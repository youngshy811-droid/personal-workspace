import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/initialize';

const tables = ['tasks', 'projects', 'workouts', 'meals', 'weekly_reviews', 'settings', 'project_notes', 'attachments'] as const;

export async function GET() {
  await ensureDatabase(); const data: Record<string, unknown[]> = {};
  for (const table of tables) { const result = await env.DB.prepare(`SELECT * FROM ${table}`).all(); data[table] = result.results; }
  const files: Record<string, string> = {};
  for (const attachment of data.attachments || []) { const row = attachment as Record<string, unknown>; const key = String(row.object_key); const object = await env.FILES.get(key); if (object) files[key] = bytesToBase64(new Uint8Array(await object.arrayBuffer())); }
  const body = JSON.stringify({ app: 'personal-workspace', version: 1, exportedAt: new Date().toISOString(), data, files }, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="personal-workspace-${stamp}.json"` } });
}

export async function POST(request: Request) {
  await ensureDatabase(); const backup = await request.json<{ app?: string; version?: number; data?: Record<string, unknown[]>; files?: Record<string, string> }>();
  if (backup.app !== 'personal-workspace' || backup.version !== 1 || !backup.data) return NextResponse.json({ error: '这不是有效的个人工作台备份文件' }, { status: 400 });
  const db = env.DB; const statements: D1PreparedStatement[] = [];
  for (const table of tables) statements.push(db.prepare(`DELETE FROM ${table}`));
  addRows(db, statements, 'tasks', backup.data.tasks, ['id','title','task_date','start_time','end_time','category','priority','tags','notes','done','deleted_at','created_at','updated_at']);
  addRows(db, statements, 'projects', backup.data.projects, ['id','name','description','status','progress','manual_progress','start_date','target_date','deleted_at','created_at','updated_at']);
  addRows(db, statements, 'workouts', backup.data.workouts, ['id','name','workout_date','duration','exercises','notes','is_template','completed','deleted_at','created_at','updated_at']);
  addRows(db, statements, 'meals', backup.data.meals, ['id','name','meal_date','meal_type','calories','protein','carbs','fat','foods','is_template','deleted_at','created_at','updated_at']);
  addRows(db, statements, 'weekly_reviews', backup.data.weekly_reviews, ['id','week_start','reflection','next_week_focus','updated_at']);
  addRows(db, statements, 'settings', backup.data.settings, ['key','value','updated_at']);
  addRows(db, statements, 'project_notes', backup.data.project_notes, ['id','project_id','title','content','created_at','updated_at']);
  addRows(db, statements, 'attachments', backup.data.attachments, ['id','project_id','file_name','object_key','content_type','size','created_at']);
  await db.batch(statements);
  for (const [key, encoded] of Object.entries(backup.files || {})) await env.FILES.put(key, base64ToBytes(encoded));
  await db.prepare('PRAGMA optimize').run(); return NextResponse.json({ ok: true });
}

function bytesToBase64(bytes: Uint8Array) { let binary = ''; for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000)); return btoa(binary); }
function base64ToBytes(value: string) { const binary = atob(value); const bytes = new Uint8Array(binary.length); for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index); return bytes; }

function addRows(db: D1Database, statements: D1PreparedStatement[], table: string, input: unknown, columns: string[]) {
  if (!Array.isArray(input)) return; const placeholders = columns.map(() => '?').join(',');
  for (const item of input) { if (!item || typeof item !== 'object') continue; const row = item as Record<string, unknown>; statements.push(db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`).bind(...columns.map((column) => row[column] ?? null))); }
}
