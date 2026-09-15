import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/initialize';

type TaskInput = { title?: string; taskDate?: string; startTime?: string; endTime?: string; category?: string; priority?: string; tags?: string[]; notes?: string };

export async function GET(request: Request) {
  await ensureDatabase();
  const url = new URL(request.url); const date = url.searchParams.get('date'); const includeDeleted = url.searchParams.get('deleted') === 'true';
  const clauses = [includeDeleted ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL']; const values: string[] = [];
  if (date) { clauses.push('task_date = ?'); values.push(date); }
  const result = await env.DB.prepare(`SELECT * FROM tasks WHERE ${clauses.join(' AND ')} ORDER BY COALESCE(start_time, '99:99'), created_at`).bind(...values).all();
  return NextResponse.json(result.results.map(normalizeTask));
}

export async function POST(request: Request) {
  await ensureDatabase(); const body = await request.json<TaskInput>(); const title = body.title?.trim();
  if (!title || !body.taskDate) return NextResponse.json({ error: '标题和日期不能为空' }, { status: 400 });
  const now = new Date().toISOString();
  const result = await env.DB.prepare(`INSERT INTO tasks (title, task_date, start_time, end_time, category, priority, tags, notes, done, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`)
    .bind(title, body.taskDate, body.startTime || null, body.endTime || null, body.category || 'personal', body.priority || 'medium', JSON.stringify(body.tags || []), body.notes || '', now, now).run();
  const created = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(result.meta.last_row_id).first();
  return NextResponse.json(normalizeTask(created), { status: 201 });
}

export async function PATCH(request: Request) {
  await ensureDatabase(); const body = await request.json<{ id?: number; done?: boolean; restore?: boolean; taskDate?: string }>();
  if (!body.id) return NextResponse.json({ error: '缺少事项编号' }, { status: 400 }); const now = new Date().toISOString();
  if (body.restore) await env.DB.prepare('UPDATE tasks SET deleted_at = NULL, updated_at = ? WHERE id = ?').bind(now, body.id).run();
  else if (body.taskDate) await env.DB.prepare('UPDATE tasks SET task_date = ?, updated_at = ? WHERE id = ?').bind(body.taskDate, now, body.id).run();
  else await env.DB.prepare('UPDATE tasks SET done = ?, updated_at = ? WHERE id = ?').bind(body.done ? 1 : 0, now, body.id).run();
  const updated = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(body.id).first(); return NextResponse.json(normalizeTask(updated));
}

export async function DELETE(request: Request) {
  await ensureDatabase(); const url = new URL(request.url); const id = Number(url.searchParams.get('id')); const permanent = url.searchParams.get('permanent') === 'true'; const empty = url.searchParams.get('empty') === 'true';
  if (empty) { await env.DB.prepare('DELETE FROM tasks WHERE deleted_at IS NOT NULL').run(); return NextResponse.json({ ok: true }); }
  if (!id) return NextResponse.json({ error: '缺少事项编号' }, { status: 400 });
  if (permanent) { await env.DB.prepare('DELETE FROM tasks WHERE id = ? AND deleted_at IS NOT NULL').bind(id).run(); return NextResponse.json({ ok: true }); }
  const now = new Date().toISOString();
  await env.DB.prepare('UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?').bind(now, now, id).run(); return NextResponse.json({ ok: true });
}

function normalizeTask(row: Record<string, unknown> | null) {
  if (!row) return null;
  const startTime = typeof row.start_time === 'string' ? row.start_time : undefined;
  const endTime = typeof row.end_time === 'string' ? row.end_time : undefined;
  const tags = typeof row.tags === 'string' ? row.tags : '[]';
  return { id: row.id, title: row.title, taskDate: row.task_date, time: startTime ? `${startTime}${endTime ? `–${endTime}` : ''}` : undefined, startTime, endTime, category: row.category, priority: row.priority, tags: JSON.parse(tags), notes: row.notes, done: Boolean(row.done), deletedAt: row.deleted_at };
}
