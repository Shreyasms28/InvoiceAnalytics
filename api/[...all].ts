// Use CommonJS require to avoid TS7016 for untyped compiled JS during build
// Ensure compatibility with both CJS and ESM default exports
// eslint-disable-next-line @typescript-eslint/no-var-requires
// IMPORTANT: In Vercel functions, includeFiles are copied under the function root.
// So we must require from './apps/...' (not '../apps/...').
let appModule: any;
try {
  appModule = require('./apps/api/dist/src/app.js');
} catch (_e) {
  // Fallback for local dev where path resolution differs
  appModule = require('../apps/api/dist/src/app.js');
}
const app = appModule?.default || appModule;

// Export an explicit handler function for Vercel (@vercel/node) runtime
export default async function handler(req: any, res: any) {
  try {
    // Direct health shortcut to validate function works even if app fails
    if (req.url === '/api/health') {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }
    // Delegate to Express app (Express apps are request handlers)
    return app(req, res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Server error', message: err?.message || String(err) }));
  }
}
