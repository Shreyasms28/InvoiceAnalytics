import serverless from 'serverless-http';
import app from '../src/app';

// Wrap the Express app for Vercel Serverless Functions
const handler = serverless(app);

export default function vercelHandler(req: any, res: any) {
  return (handler as any)(req, res);
}
