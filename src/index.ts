import type { Interceptor, StreamResponse } from "@bufbuild/connect-web";
import { MethodKind, ServiceType } from "@bufbuild/protobuf";

type PromiseOr<T> = T | Promise<T>;

const convertAsyncIterable = <O>(
	itrable: AsyncIterable<O>,
): StreamResponse["read"] => {
	const iterator = itrable[Symbol.asyncIterator]();
	return () =>
		iterator.next().then(({ done, value }) => ({ done: !!done, value }));
};

export const mock = <S extends ServiceType, M extends keyof S["methods"]>(
	service: S,
	methodName: M,
	handler: S["methods"][M]["kind"] extends MethodKind.Unary
		? (
				req: InstanceType<S["methods"][M]["I"]>,
		  ) => PromiseOr<InstanceType<S["methods"][M]["O"]>>
		: S["methods"][M]["kind"] extends MethodKind.ServerStreaming
		? (
				req: InstanceType<S["methods"][M]["I"]>,
		  ) => AsyncIterable<InstanceType<S["methods"][M]["O"]>>
		: never,
): Interceptor => {
	return (next) => {
		return async (req) => {
			if (
				req.service.typeName !== service.typeName ||
				req.method.name !== service.methods[methodName].name
			)
				return await next(req);
			try {
				type I = InstanceType<S["methods"][M]["I"]>;
				type O = InstanceType<S["methods"][M]["O"]>;
				switch (req.method.kind) {
					case MethodKind.Unary:
						return {
							stream: false,
							service,
							method: req.method,
							header: new Headers(),
							message: (await handler(req.message as I)) as O,
							trailer: new Headers(),
						};
					case MethodKind.ServerStreaming:
						return {
							stream: true,
							service,
							method: req.method,
							header: new Headers(),
							read: convertAsyncIterable(
								handler(req.message as I) as AsyncIterable<O>,
							),
							trailer: new Headers(),
						};
					default:
						throw new Error("Not supported");
				}
			} catch {
				return await next(req);
			}
		};
	};
};
