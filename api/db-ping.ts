import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'] as any,
});

export default async function handler(_req: any, res: any) {
  try {
    // Basic connectivity check
    const r = await prisma.$queryRawUnsafe('SELECT 1 as ok');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ status: 'ok', result: r });
  } catch (err: any) {
    res.status(500).json({ error: 'db_ping_failed', message: err?.message || String(err) });
  } finally {
    // Let Vercel reuse connections across invocations; do not disconnect explicitly.
  }
}
