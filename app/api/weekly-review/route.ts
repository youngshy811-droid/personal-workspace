import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/initialize';

export async function GET(request: Request) {
  await ensureDatabase(); const week = new URL(request.url).searchParams.get('week'); if (!week) return NextResponse.json({ reflection: '', nextWeekFocus: '' });
  const row = await env.DB.prepare('SELECT reflection, next_week_focus FROM weekly_reviews WHERE week_start = ?').bind(week).first();
  return NextResponse.json({ reflection: row?.reflection || '', nextWeekFocus: row?.next_week_focus || '' });
}

export async function POST(request: Request) {
  await ensureDatabase(); const body = await request.json<{ week?: string; reflection?: string; nextWeekFocus?: string }>(); if (!body.week) return NextResponse.json({ error: '缺少周日期' }, { status: 400 });
  await env.DB.prepare(`INSERT INTO weekly_reviews (week_start, reflection, next_week_focus, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(week_start) DO UPDATE SET reflection = excluded.reflection, next_week_focus = excluded.next_week_focus, updated_at = excluded.updated_at`)
    .bind(body.week, body.reflection || '', body.nextWeekFocus || '', new Date().toISOString()).run(); return NextResponse.json({ ok: true });
}
