import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/initialize';

export async function GET(request: Request) {
  await ensureDatabase(); const url = new URL(request.url); const id = Number(url.searchParams.get('id'));
  if (id) { const row = await env.DB.prepare('SELECT * FROM attachments WHERE id = ?').bind(id).first(); if (!row) return new Response('Not found', { status: 404 }); const object = await env.FILES.get(String(row.object_key)); if (!object) return new Response('Not found', { status: 404 }); return new Response(object.body, { headers: { 'Content-Type': String(row.content_type), 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(String(row.file_name))}` } }); }
  const projectId = Number(url.searchParams.get('projectId')); if (!projectId) return NextResponse.json([]); const result = await env.DB.prepare('SELECT id, project_id AS projectId, file_name AS fileName, content_type AS contentType, size, created_at AS createdAt FROM attachments WHERE project_id = ? ORDER BY created_at DESC').bind(projectId).all(); return NextResponse.json(result.results);
}
export async function POST(request: Request) {
  await ensureDatabase(); const form = await request.formData(); const projectId = Number(form.get('projectId')); const file = form.get('file');
  if (!projectId || !(file instanceof File)) return NextResponse.json({ error: '请选择项目和文件' }, { status: 400 }); if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '单个附件不能超过 10MB' }, { status: 400 });
  const safeName = file.name.replaceAll(/[^\p{L}\p{N}._-]/gu, '_'); const key = `projects/${projectId}/${crypto.randomUUID()}-${safeName}`; await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } }); const now = new Date().toISOString();
  const result = await env.DB.prepare('INSERT INTO attachments (project_id, file_name, object_key, content_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(projectId, file.name, key, file.type || 'application/octet-stream', file.size, now).run(); return NextResponse.json({ id: result.meta.last_row_id, projectId, fileName: file.name, contentType: file.type, size: file.size, createdAt: now }, { status: 201 });
}
export async function DELETE(request: Request) { await ensureDatabase(); const id = Number(new URL(request.url).searchParams.get('id')); if (!id) return NextResponse.json({ error: '参数错误' }, { status: 400 }); const row = await env.DB.prepare('SELECT object_key FROM attachments WHERE id = ?').bind(id).first(); if (row) await env.FILES.delete(String(row.object_key)); await env.DB.prepare('DELETE FROM attachments WHERE id = ?').bind(id).run(); return NextResponse.json({ ok: true }); }
