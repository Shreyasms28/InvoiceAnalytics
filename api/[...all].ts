// Use CommonJS require to avoid TS7016 for untyped compiled JS during build
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../apps/api/dist/src/app.js');

export default app as any;
