'use client';

import { ArrowRight, CalendarDays, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Task = { id: number; title: string; taskDate: string; time?: string; done: boolean };
const today = new Date().toLocaleDateString('sv-SE');
const yesterday = (() => { const date = new Date(); date.setDate(date.getDate() - 1); return date.toLocaleDateString('sv-SE'); })();

export function RolloverPrompt() {
  const [tasks, setTasks] = useState<Task[]>([]); const [open, setOpen] = useState(false);
  useEffect(() => { if (sessionStorage.getItem('rollover-checked') === today) return; fetch(`/api/tasks?date=${yesterday}`).then((response) => response.json()).then((data: unknown) => { const unfinished = (data as Task[]).filter((task) => !task.done); setTasks(unfinished); setOpen(unfinished.length > 0); sessionStorage.setItem('rollover-checked', today); }).catch(() => undefined); }, []);
  const removeFromList = (id: number) => setTasks((current) => { const next = current.filter((task) => task.id !== id); if (!next.length) setOpen(false); return next; });
  const move = async (id: number) => { await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, taskDate: today }) }); removeFromList(id); window.dispatchEvent(new Event('tasks-updated')); };
  const keep = (id: number) => removeFromList(id);
  const cancel = async (id: number) => { await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }); removeFromList(id); };
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/35 p-4 backdrop-blur-sm"><div className="w-full max-w-xl overflow-hidden rounded-2xl border bg-card shadow-2xl"><div className="flex items-start gap-4 border-b p-5"><div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50"><CalendarDays className="size-5" /></div><div className="min-w-0 flex-1"><h2 className="font-semibold">昨日有 {tasks.length} 项计划未完成</h2><p className="mt-1 text-xs text-muted-foreground">请逐项决定如何处理，不会自动移动。</p></div><Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X /></Button></div><div className="max-h-[60vh] divide-y overflow-auto">{tasks.map((task) => <div key={task.id} className="p-5"><h3 className="text-sm font-medium">{task.title}</h3><p className="mt-1 text-xs text-muted-foreground">{task.time || '普通待办'}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => move(task.id)}><ArrowRight />移到今天</Button><Button variant="outline" size="sm" onClick={() => keep(task.id)}>保留在昨天</Button><Button variant="destructive" size="sm" onClick={() => cancel(task.id)}><Trash2 />取消事项</Button></div></div>)}</div></div></div>;
}
