'use client';

import { Check, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Summary = { completed: number; total: number; workCompleted: number };
function monday() { const date = new Date(); const day = date.getDay() || 7; date.setDate(date.getDate() - day + 1); return date.toLocaleDateString('sv-SE'); }

export function WeeklyReview({ summary }: { summary: Summary }) {
  const week = monday(); const [reflection, setReflection] = useState(''); const [focus, setFocus] = useState(''); const [saved, setSaved] = useState(false);
  useEffect(() => { fetch(`/api/weekly-review?week=${week}`).then((response) => response.json()).then((data: unknown) => { const value = data as { reflection?: string; nextWeekFocus?: string }; setReflection(value.reflection || ''); setFocus(value.nextWeekFocus || ''); }).catch(() => undefined); }, [week]);
  const save = async () => { const response = await fetch('/api/weekly-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ week, reflection, nextWeekFocus: focus }) }); if (response.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); } };
  return <><section className="mb-7 flex items-center gap-4"><div className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50"><FileText className="size-5" /></div><div><h1 className="text-2xl font-semibold tracking-tight">每周总结</h1><p className="mt-1 text-sm text-muted-foreground">回顾本周进展并写下下周重点</p></div></section><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"><article className="panel p-6"><h2 className="font-semibold">本周复盘</h2><p className="mt-1 text-xs text-muted-foreground">记录值得保留的经验、遇到的问题和新的想法。</p><textarea value={reflection} onChange={(event) => setReflection(event.target.value)} className="mt-5 min-h-52 w-full resize-y rounded-xl border bg-muted/20 p-4 text-sm outline-none focus:border-primary/40 focus:ring-3 focus:ring-primary/10" placeholder="这一周，我完成了……" /><h2 className="mt-6 font-semibold">下周重点</h2><textarea value={focus} onChange={(event) => setFocus(event.target.value)} className="mt-3 min-h-28 w-full resize-y rounded-xl border bg-muted/20 p-4 text-sm outline-none focus:border-primary/40" placeholder="下周最重要的事情是……" /><Button className="mt-5" onClick={save}>{saved ? <><Check />已保存</> : '保存本周总结'}</Button></article><article className="panel p-6"><h2 className="font-semibold">自动汇总</h2><p className="mt-1 text-xs text-muted-foreground">本周开始：{week}</p><div className="mt-5 space-y-3"><Summary value={`${summary.completed}/${summary.total}`} label="计划完成" /><Summary value={String(summary.workCompleted)} label="开发任务完成" /><Summary value="0" label="健身次数" /></div></article></div></>;
}

function Summary({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-muted/45 px-4 py-4"><strong className="block text-xl">{value}</strong><span className="mt-1 block text-xs text-muted-foreground">{label}</span></div>; }
