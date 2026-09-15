import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(), taskDate: text('task_date').notNull(),
  startTime: text('start_time'), endTime: text('end_time'),
  category: text('category').notNull().default('personal'), priority: text('priority').notNull().default('medium'),
  tags: text('tags').notNull().default('[]'), notes: text('notes').notNull().default(''),
  done: integer('done', { mode: 'boolean' }).notNull().default(false), deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
});

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }), name: text('name').notNull(),
  description: text('description').notNull().default(''), status: text('status').notNull().default('active'),
  progress: integer('progress').notNull().default(0), manualProgress: integer('manual_progress'),
  startDate: text('start_date'), targetDate: text('target_date'), deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
});

export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }), name: text('name').notNull(), workoutDate: text('workout_date').notNull(),
  duration: integer('duration').notNull().default(0), exercises: text('exercises').notNull().default('[]'), notes: text('notes').notNull().default(''),
  isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false), completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  deletedAt: text('deleted_at'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
});

export const meals = sqliteTable('meals', {
  id: integer('id').primaryKey({ autoIncrement: true }), name: text('name').notNull(), mealDate: text('meal_date').notNull(),
  mealType: text('meal_type').notNull().default('other'), calories: real('calories').notNull().default(0),
  protein: real('protein').notNull().default(0), carbs: real('carbs').notNull().default(0), fat: real('fat').notNull().default(0),
  foods: text('foods').notNull().default('[]'), isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false),
  deletedAt: text('deleted_at'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
});

export const weeklyReviews = sqliteTable('weekly_reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }), weekStart: text('week_start').notNull().unique(),
  reflection: text('reflection').notNull().default(''), nextWeekFocus: text('next_week_focus').notNull().default(''), updatedAt: text('updated_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(), value: text('value').notNull(), updatedAt: text('updated_at').notNull(),
});

export const projectNotes = sqliteTable('project_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }), projectId: integer('project_id').notNull(),
  title: text('title').notNull(), content: text('content').notNull().default(''),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
});

export const attachments = sqliteTable('attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }), projectId: integer('project_id').notNull(),
  fileName: text('file_name').notNull(), objectKey: text('object_key').notNull().unique(), contentType: text('content_type').notNull(),
  size: integer('size').notNull(), createdAt: text('created_at').notNull(),
});

export type TaskRecord = typeof tasks.$inferSelect;
