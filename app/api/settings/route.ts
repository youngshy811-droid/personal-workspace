import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/initialize';

export async function GET() {
  await ensureDatabase(); const result = await env.DB.prepare('SELECT key, value FROM settings').all(); const settings: Record<string, unknown> = {};
  for (const row of result.results) { const key = String(row.key); try { settings[key] = JSON.parse(String(row.value)); } catch { settings[key] = row.value; } }
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  await ensureDatabase(); const body = await request.json<{ key?: string; value?: unknown }>(); if (!body.key) return NextResponse.json({ error: '缺少设置名称' }, { status: 400 });
  await env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
    .bind(body.key, JSON.stringify(body.value), new Date().toISOString()).run(); return NextResponse.json({ ok: true });
}
