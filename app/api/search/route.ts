import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { ensureDatabase } from '@/db/initialize';

export async function GET(request: Request) {
  await ensureDatabase(); const query = new URL(request.url).searchParams.get('q')?.trim(); if (!query) return NextResponse.json([]); const pattern = `%${query}%`;
  const results = await env.DB.batch([
    env.DB.prepare("SELECT id, title AS title, notes AS detail, 'task' AS type FROM tasks WHERE deleted_at IS NULL AND (title LIKE ? OR notes LIKE ?) LIMIT 6").bind(pattern, pattern),
    env.DB.prepare("SELECT id, name AS title, description AS detail, 'project' AS type FROM projects WHERE deleted_at IS NULL AND (name LIKE ? OR description LIKE ?) LIMIT 6").bind(pattern, pattern),
    env.DB.prepare("SELECT id, name AS title, workout_date AS detail, 'workout' AS type FROM workouts WHERE deleted_at IS NULL AND name LIKE ? LIMIT 6").bind(pattern),
    env.DB.prepare("SELECT id, name AS title, meal_date AS detail, 'meal' AS type FROM meals WHERE deleted_at IS NULL AND name LIKE ? LIMIT 6").bind(pattern),
  ]);
  return NextResponse.json(results.flatMap((result) => result.results));
}
