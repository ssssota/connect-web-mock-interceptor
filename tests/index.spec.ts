import {
	createConnectTransport,
	createPromiseClient,
} from "@bufbuild/connect-web";
import { expect, it } from "vitest";
import { mock } from "../src";
import { ElizaService } from "./buf/buf/connect/demo/eliza/v1/eliza_connectweb";
import {
	IntroduceResponse,
	SayResponse,
} from "./buf/buf/connect/demo/eliza/v1/eliza_pb";

it("mocks as echo method", async () => {
	const transport = createConnectTransport({
		baseUrl: "https://test",
		interceptors: [
			mock(ElizaService, "say", (req) => {
				return new SayResponse({ sentence: req.sentence });
			}),
		],
	});
	const client = createPromiseClient(ElizaService, transport);
	const sentence = "Hello world!";
	const res = await client.say({ sentence });
	expect(res.sentence).toBe(sentence);
});

it("throughs other methods", async () => {
	const transport = createConnectTransport({
		baseUrl: "https://test",
		interceptors: [
			mock(ElizaService, "say", (req) => {
				return new SayResponse({ sentence: req.sentence });
			}),
		],
	});
	const client = createPromiseClient(ElizaService, transport);
	const iterator = client.introduce({})[Symbol.asyncIterator]();
	expect(iterator.next()).rejects.toThrow(/fetch failed/);
});

it("mocks server stream method", async () => {
	const transport = createConnectTransport({
		baseUrl: "https://test",
		interceptors: [
			mock(ElizaService, "introduce", (req) => {
				return {
					async *[Symbol.asyncIterator]() {
						for (let i = 0; i < 5; i++) {
							await new Promise((r) => setTimeout(r, 0));
							yield new IntroduceResponse({
								sentence: `${req.name}${"!".repeat(i)}`,
							});
						}
					},
				};
			}),
		],
	});
	const client = createPromiseClient(ElizaService, transport);
	const name = "taro";
	let i = 0;
	for await (const message of client.introduce({ name })) {
		expect(message.sentence).toBe(`${name}${"!".repeat(i++)}`);
	}
});
