# connect-web-mock-interceptor

Mock utility for [connect-web](https://github.com/bufbuild/connect-web).

🚧 Streaming requests are not currently supported.

If you want to use with MSW, you can use [msw-connect-web](https://npmjs.com/msw-connect-web).

## Usage

Install package.

```sh
npm i -D connect-web-mock-interceptor @bufbuild/protobuf
```

Define mocks.

_handlers.ts_

```typescript
import { createConnectTransport } from '@bufbuild/connect-web';
import { mock } from 'connect-web-mock-interceptor';
const transport = createConnectTransport({
  // ...
  interceptors: process.env.USE_MOCKS !== 'true' ? [] : [
    mock(YourService, "methodName", (req: RequestMessage) => {
      // ...
      return new ResponseMessage({ /* ... */ });
    }),
  ]
});
```
