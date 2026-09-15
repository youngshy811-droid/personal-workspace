import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/initialize';

export async function GET(request: Request) {
  await ensureDatabase(); const projectId = Number(new URL(request.url).searchParams.get('projectId')); if (!projectId) return NextResponse.json([]);
  const result = await env.DB.prepare('SELECT id, project_id AS projectId, title, content, updated_at AS updatedAt FROM project_notes WHERE project_id = ? ORDER BY updated_at DESC').bind(projectId).all(); return NextResponse.json(result.results);
}
export async function POST(request: Request) {
  await ensureDatabase(); const body = await request.json<{ projectId?: number; title?: string; content?: string }>(); if (!body.projectId || !body.title?.trim()) return NextResponse.json({ error: '项目和标题不能为空' }, { status: 400 }); const now = new Date().toISOString();
  const result = await env.DB.prepare('INSERT INTO project_notes (project_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').bind(body.projectId, body.title.trim(), body.content || '', now, now).run();
  return NextResponse.json({ id: result.meta.last_row_id, projectId: body.projectId, title: body.title.trim(), content: body.content || '', updatedAt: now }, { status: 201 });
}
export async function DELETE(request: Request) { await ensureDatabase(); const id = Number(new URL(request.url).searchParams.get('id')); if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 }); await env.DB.prepare('DELETE FROM project_notes WHERE id = ?').bind(id).run(); return NextResponse.json({ ok: true }); }
