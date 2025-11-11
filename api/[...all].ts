// Use CommonJS require to avoid TS7016 for untyped compiled JS during build
// Ensure compatibility with both CJS and ESM default exports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appModule = require('../apps/api/dist/src/app.js');
const app = appModule?.default || appModule;

export default app as any;
