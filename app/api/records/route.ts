import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/initialize';

const allowedTypes = ['projects', 'workouts', 'meals'] as const;
type RecordType = typeof allowedTypes[number];

export async function GET(request: Request) {
  await ensureDatabase(); const type = new URL(request.url).searchParams.get('type') as RecordType;
  if (!allowedTypes.includes(type)) return NextResponse.json({ error: '不支持的记录类型' }, { status: 400 });
  const dateColumn = type === 'workouts' ? 'workout_date' : type === 'meals' ? 'meal_date' : 'created_at';
  const result = await env.DB.prepare(`SELECT * FROM ${type} WHERE deleted_at IS NULL ORDER BY ${dateColumn} DESC, id DESC`).all();
  return NextResponse.json(result.results.map((row) => normalize(type, row)));
}

export async function POST(request: Request) {
  await ensureDatabase(); const body = await request.json<Record<string, unknown>>(); const type = body.type as RecordType;
  if (!allowedTypes.includes(type)) return NextResponse.json({ error: '不支持的记录类型' }, { status: 400 });
  const now = new Date().toISOString(); let result;
  if (type === 'projects') {
    if (!text(body.name)) return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    result = await env.DB.prepare('INSERT INTO projects (name, description, status, progress, start_date, target_date, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?, ?, ?)')
      .bind(text(body.name), text(body.description), 'active', nullableText(body.startDate), nullableText(body.targetDate), now, now).run();
  } else if (type === 'workouts') {
    if (!text(body.name) || !text(body.date)) return NextResponse.json({ error: '训练名称和日期不能为空' }, { status: 400 });
    const exercises = [{ name: text(body.exercise) || '自定义动作', sets: number(body.sets), reps: number(body.reps) }];
    result = await env.DB.prepare('INSERT INTO workouts (name, workout_date, duration, exercises, notes, is_template, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)')
      .bind(text(body.name), text(body.date), number(body.duration), JSON.stringify(exercises), text(body.notes), body.isTemplate ? 1 : 0, now, now).run();
  } else {
    if (!text(body.name) || !text(body.date)) return NextResponse.json({ error: '餐食名称和日期不能为空' }, { status: 400 });
    result = await env.DB.prepare('INSERT INTO meals (name, meal_date, meal_type, calories, protein, carbs, fat, foods, is_template, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(text(body.name), text(body.date), text(body.mealType) || 'other', number(body.calories), number(body.protein), number(body.carbs), number(body.fat), '[]', body.isTemplate ? 1 : 0, now, now).run();
  }
  const created = await env.DB.prepare(`SELECT * FROM ${type} WHERE id = ?`).bind(result.meta.last_row_id).first();
  return NextResponse.json(normalize(type, created ?? {}), { status: 201 });
}

export async function PATCH(request: Request) {
  await ensureDatabase(); const body = await request.json<Record<string, unknown>>(); const type = body.type as RecordType; const id = number(body.id);
  if (!allowedTypes.includes(type) || !id) return NextResponse.json({ error: '参数错误' }, { status: 400 }); const now = new Date().toISOString();
  if (type === 'projects') await env.DB.prepare('UPDATE projects SET progress = ?, manual_progress = ?, updated_at = ? WHERE id = ?').bind(number(body.progress), number(body.progress), now, id).run();
  else if (type === 'workouts') await env.DB.prepare('UPDATE workouts SET completed = ?, updated_at = ? WHERE id = ?').bind(body.completed ? 1 : 0, now, id).run();
  const updated = await env.DB.prepare(`SELECT * FROM ${type} WHERE id = ?`).bind(id).first(); return NextResponse.json(normalize(type, updated ?? {}));
}

export async function DELETE(request: Request) {
  await ensureDatabase(); const url = new URL(request.url); const type = url.searchParams.get('type') as RecordType; const id = Number(url.searchParams.get('id'));
  if (!allowedTypes.includes(type) || !id) return NextResponse.json({ error: '参数错误' }, { status: 400 }); const now = new Date().toISOString();
  await env.DB.prepare(`UPDATE ${type} SET deleted_at = ?, updated_at = ? WHERE id = ?`).bind(now, now, id).run(); return NextResponse.json({ ok: true });
}

function normalize(type: RecordType, row: Record<string, unknown>) {
  if (type === 'projects') return { id: row.id, name: row.name, description: row.description, status: row.status, progress: row.manual_progress ?? row.progress, startDate: row.start_date, targetDate: row.target_date };
  if (type === 'workouts') return { id: row.id, name: row.name, date: row.workout_date, duration: row.duration, exercises: parse(row.exercises), notes: row.notes, isTemplate: Boolean(row.is_template), completed: Boolean(row.completed) };
  return { id: row.id, name: row.name, date: row.meal_date, mealType: row.meal_type, calories: row.calories, protein: row.protein, carbs: row.carbs, fat: row.fat, isTemplate: Boolean(row.is_template) };
}
function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
function nullableText(value: unknown) { return text(value) || null; }
function number(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function parse(value: unknown) { if (typeof value !== 'string') return []; try { return JSON.parse(value) as unknown[]; } catch { return []; } }
