'use client';

import {
  Activity, Apple, BarChart3, CalendarDays, Check, ChevronLeft, ChevronRight,
  Code2, Dumbbell, FileText, Home as HomeIcon, Languages,
  Menu, Moon, Plus, RotateCcw, Search, Settings, SlidersHorizontal, Sun, Target, Trash2, X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import { ModuleRecords } from '@/components/module-records';
import { SettingsPage, TrashPage } from '@/components/system-pages';
import { WeeklyReview } from '@/components/weekly-review';
import { DailyPlanner } from '@/components/daily-planner';
import { RolloverPrompt } from '@/components/rollover-prompt';
import { useInterfaceLanguage } from '@/lib/use-interface-language';

type Task = {
  id: number;
  title: string;
  taskDate: string;
  time?: string;
  category: 'work' | 'fitness' | 'food' | 'personal';
  priority: 'high' | 'medium' | 'low';
  done: boolean;
};
type ProjectSummary = { id: number; name: string; progress: number };
type WorkoutSummary = { id: number; name: string; date: string; duration: number; exercises: unknown[]; completed: boolean };
type MealSummary = { id: number; name: string; date: string; calories: number; protein: number; carbs: number; fat: number };
type DashboardCard = { id: 'tasks' | 'focus' | 'nutrition' | 'week' | 'review'; label: string; visible: boolean; width: 4 | 8 | 12 };

const defaultDashboardCards: DashboardCard[] = [
  { id: 'tasks', label: '今日计划', visible: true, width: 8 },
  { id: 'nutrition', label: '今日营养', visible: true, width: 4 },
  { id: 'focus', label: '开发与健身', visible: true, width: 8 },
  { id: 'week', label: '本周概览', visible: true, width: 4 },
  { id: 'review', label: '每周总结', visible: true, width: 4 },
];

const today = new Date().toLocaleDateString('sv-SE');

const navItems = [
  { label: '首页', en: 'Overview', icon: HomeIcon },
  { label: '每日计划', en: 'Daily Plan', icon: CalendarDays },
  { label: '开发工作', en: 'Development', icon: Code2 },
  { label: '健身计划', en: 'Fitness', icon: Dumbbell },
  { label: '饮食计划', en: 'Nutrition', icon: Apple },
  { label: '数据统计', en: 'Analytics', icon: BarChart3 },
  { label: '每周总结', en: 'Weekly Review', icon: FileText },
];

const categoryStyle = {
  work: { label: '开发', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300' },
  fitness: { label: '健身', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' },
  food: { label: '饮食', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  personal: { label: '个人', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
};

function Ring({ value, label, tone = 'mint' }: { value: number; label: string; tone?: 'mint' | 'amber' | 'violet' }) {
  const color = tone === 'amber' ? '#f59e0b' : tone === 'violet' ? '#8b5cf6' : '#0f9f79';
  return (
    <div className="relative grid size-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${color} ${value}%, color-mix(in oklab, ${color} 12%, transparent) 0)` }}>
      <div className="grid size-[76px] place-items-center rounded-full bg-card text-center shadow-sm">
        <div><strong className="block text-xl leading-none">{value}%</strong><span className="mt-1 block text-[11px] text-muted-foreground">{label}</span></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dark, setDark] = useState(false);
  const [followSystem, setFollowSystem] = useState(true);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('首页');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: number; title: string; detail: string; type: 'task' | 'project' | 'workout' | 'meal' }[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [nutritionTargets, setNutritionTargets] = useState({ calories: 2100, protein: 140, carbs: 260, fat: 70 });
  const [timeConflict, setTimeConflict] = useState('');
  const [taskDraft, setTaskDraft] = useState({ title: '', taskDate: today, startTime: '', endTime: '', category: 'personal', priority: 'medium' });
  const [dashboardEditing, setDashboardEditing] = useState(false);
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>(defaultDashboardCards);
  useInterfaceLanguage(language);

  useEffect(() => { const savedTheme = localStorage.getItem('workspace-theme-mode'); const savedLanguage = localStorage.getItem('workspace-language'); if (savedTheme === 'dark' || savedTheme === 'light') { setFollowSystem(false); setDark(savedTheme === 'dark'); } else setDark(window.matchMedia('(prefers-color-scheme: dark)').matches); if (savedLanguage === 'en') setLanguage('en'); }, []);
  useEffect(() => { try { const saved = localStorage.getItem('workspace-dashboard'); if (saved) setDashboardCards(JSON.parse(saved) as DashboardCard[]); } catch { localStorage.removeItem('workspace-dashboard'); } }, []);
  useEffect(() => { localStorage.setItem('workspace-dashboard', JSON.stringify(dashboardCards)); }, [dashboardCards]);
  useEffect(() => { const media = window.matchMedia('(prefers-color-scheme: dark)'); const sync = () => { if (followSystem) setDark(media.matches); }; sync(); media.addEventListener('change', sync); return () => media.removeEventListener('change', sync); }, [followSystem]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('workspace-theme-mode', followSystem ? 'system' : dark ? 'dark' : 'light'); }, [dark, followSystem]);
  useEffect(() => { localStorage.setItem('workspace-language', language); document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; }, [language]);
  useEffect(() => {
    const load = () => fetch(`/api/tasks?date=${today}`).then((response) => response.json()).then((data) => setTasks(data as Task[])).catch(() => undefined);
    load(); window.addEventListener('tasks-updated', load); return () => window.removeEventListener('tasks-updated', load);
  }, []);
  useEffect(() => {
    const load = () => Promise.all(['projects','workouts','meals'].map((type) => fetch(`/api/records?type=${type}`).then((response) => response.json()))).then(([projectData, workoutData, mealData]) => { setProjects(projectData as ProjectSummary[]); setWorkouts(workoutData as WorkoutSummary[]); setMeals(mealData as MealSummary[]); }).catch(() => undefined);
    load(); window.addEventListener('records-updated', load); return () => window.removeEventListener('records-updated', load);
  }, []);
  useEffect(() => { const load = () => fetch('/api/settings').then((response) => response.json()).then((data: unknown) => { const settings = data as { nutritionTargets?: typeof nutritionTargets }; if (settings.nutritionTargets) setNutritionTargets(settings.nutritionTargets); }).catch(() => undefined); load(); window.addEventListener('settings-updated', load); return () => window.removeEventListener('settings-updated', load); }, []);
  useEffect(() => {
    if (!quickOpen || !taskDraft.startTime || !taskDraft.endTime) { setTimeConflict(''); return; }
    const timer = setTimeout(() => fetch(`/api/tasks?date=${taskDraft.taskDate}`).then((response) => response.json()).then((data: unknown) => { const conflict = (data as (Task & { startTime?: string; endTime?: string })[]).find((item) => item.startTime && item.endTime && taskDraft.startTime < item.endTime && taskDraft.endTime > item.startTime); setTimeConflict(conflict ? `时间与“${conflict.title}”重叠，但仍然可以保存。` : ''); }).catch(() => undefined), 150);
    return () => clearTimeout(timer);
  }, [quickOpen, taskDraft.taskDate, taskDraft.startTime, taskDraft.endTime]);
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`).then((response) => response.json()).then((data) => setSearchResults(data as typeof searchResults)).catch(() => undefined), 220);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const completed = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const todayMeals = meals.filter((meal) => meal.date === today);
  const nutrition = todayMeals.reduce((total, meal) => ({ calories: total.calories + Number(meal.calories || 0), protein: total.protein + Number(meal.protein || 0), carbs: total.carbs + Number(meal.carbs || 0), fat: total.fat + Number(meal.fat || 0) }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const todayWorkout = workouts.find((workout) => workout.date === today);
  const project = projects[0];
  const card = (id: DashboardCard['id']) => dashboardCards.find((item) => item.id === id) ?? defaultDashboardCards.find((item) => item.id === id)!;
  const cardClass = (id: DashboardCard['id']) => card(id).width === 12 ? 'xl:col-span-12' : card(id).width === 8 ? 'xl:col-span-8' : 'xl:col-span-4';
  const cardOrder = (id: DashboardCard['id']) => dashboardCards.findIndex((item) => item.id === id);
  const moveCard = (id: DashboardCard['id'], direction: -1 | 1) => setDashboardCards((current) => { const index = current.findIndex((item) => item.id === id); const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const updateCard = (id: DashboardCard['id'], patch: Partial<DashboardCard>) => setDashboardCards((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  const toggleTask = async (id: number) => {
    const task = tasks.find((item) => item.id === id); if (!task) return;
    setTasks((current) => current.map((item) => item.id === id ? { ...item, done: !item.done } : item));
    await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, done: !task.done }) });
  };
  const deleteTask = async (id: number) => {
    setTasks((current) => current.filter((item) => item.id !== id));
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
  };
  const addTask: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault(); if (!taskDraft.title.trim()) return; setSaving(true);
    const response = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskDraft) });
    if (response.ok) { const created = await response.json() as Task; if (created.taskDate === today) setTasks((current) => [...current, created]); window.dispatchEvent(new Event('tasks-updated')); setTaskDraft({ title: '', taskDate: today, startTime: '', endTime: '', category: 'personal', priority: 'medium' }); setQuickOpen(false); }
    setSaving(false);
  };

  return (
    <div data-app-shell className="min-h-screen bg-background text-foreground">
      <RolloverPrompt />
      {sidebarOpen && <button aria-label="关闭菜单" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[246px] flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-12 items-center gap-3 px-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Target className="size-[18px]" /></div>
          <div><p className="text-sm font-semibold tracking-tight">个人工作台</p><p className="text-[11px] text-muted-foreground">Life OS · 本地版</p></div>
          <Button className="ml-auto lg:hidden" variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><X /></Button>
        </div>
        <nav className="mt-5 space-y-1" aria-label="主导航">
          {navItems.map(({ label, en, icon: Icon }) => (
            <button key={label} onClick={() => { setActiveNav(label); setSidebarOpen(false); }} className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm transition-colors ${activeNav === label ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
              <Icon className="size-[17px]" /><span>{language === 'zh' ? label : en}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-sidebar-border pt-3">
          <button onClick={() => { setActiveNav('回收站'); setSidebarOpen(false); }} className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm ${activeNav === '回收站' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'}`}><Trash2 className="size-[17px]" />回收站</button>
          <button onClick={() => { setActiveNav('设置'); setSidebarOpen(false); }} className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm ${activeNav === '设置' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'}`}><Settings className="size-[17px]" />设置</button>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/60 p-3">
            <div className="grid size-8 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">我</div>
            <div className="min-w-0"><p className="truncate text-xs font-medium">本地使用者</p><p className="text-[10px] text-muted-foreground">数据仅保存在此电脑</p></div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-[246px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl sm:px-7">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu /></Button>
          <div className="relative hidden w-full max-w-md sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-10 w-full rounded-xl border bg-muted/45 pl-10 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-3 focus:ring-primary/10" placeholder="搜索计划、项目、训练、食物…" />
            {searchQuery && <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl border bg-popover p-2 shadow-xl">{searchResults.length ? searchResults.map((result) => <button key={`${result.type}-${result.id}`} onClick={() => { setActiveNav(result.type === 'project' ? '开发工作' : result.type === 'workout' ? '健身计划' : result.type === 'meal' ? '饮食计划' : '每日计划'); setSearchQuery(''); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted"><Search className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-medium">{result.title}</strong><span className="block truncate text-[11px] text-muted-foreground">{result.detail || (result.type === 'task' ? '计划事项' : '记录')}</span></span></button>) : <p className="px-3 py-5 text-center text-xs text-muted-foreground">没有找到相关内容</p>}</div>}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" aria-label="切换语言" onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}><Languages /></Button>
            <Button variant="ghost" size="icon" aria-label="切换主题" onClick={() => { setFollowSystem(false); setDark(!dark); }}>{dark ? <Sun /> : <Moon />}</Button>
            <Button className="ml-1 rounded-xl px-3" size="lg" onClick={() => setQuickOpen(true)}><Plus />快速添加</Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-7 sm:py-8">
          {activeNav === '首页' ? <>
          <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mb-1 text-sm font-medium text-primary">{new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date())}</p><h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">你好，今天稳步向前。</h1><p className="mt-2 text-sm text-muted-foreground">你有 {tasks.length - completed} 项计划待完成{tasks.find((task) => !task.done && task.time) ? `，下一项安排在 ${tasks.find((task) => !task.done && task.time)?.time?.split('–')[0]}` : '。'}</p></div>
            <div className="flex flex-wrap items-center justify-end gap-2"><Button variant={dashboardEditing ? 'default' : 'outline'} size="sm" onClick={() => setDashboardEditing(!dashboardEditing)}><SlidersHorizontal />{dashboardEditing ? '完成调整' : '自定义首页'}</Button><div className="flex items-center gap-1 rounded-xl border bg-card p-1 shadow-sm"><Button variant="ghost" size="icon-sm"><ChevronLeft /></Button><Button variant="ghost" size="sm">今天</Button><Button variant="ghost" size="icon-sm"><ChevronRight /></Button></div></div>
          </section>

          {dashboardEditing && <section className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold">调整首页卡片</h2><p className="mt-0.5 text-xs text-muted-foreground">调整顺序、宽度或隐藏卡片，设置会保存在这台电脑。</p></div><Button variant="ghost" size="sm" onClick={() => setDashboardCards(defaultDashboardCards)}><RotateCcw />恢复默认</Button></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{dashboardCards.map((item, index) => <div key={item.id} className="flex items-center gap-2 rounded-xl border bg-card p-2.5"><span className="min-w-0 flex-1 truncate text-xs font-medium">{item.label}</span><Button variant="ghost" size="icon-sm" disabled={index === 0} aria-label="向前移动" onClick={() => moveCard(item.id, -1)}><ChevronLeft /></Button><Button variant="ghost" size="icon-sm" disabled={index === dashboardCards.length - 1} aria-label="向后移动" onClick={() => moveCard(item.id, 1)}><ChevronRight /></Button><NativeSelect className="w-[72px]" value={String(item.width)} onChange={(event) => updateCard(item.id, { width: Number(event.target.value) as 4 | 8 | 12 })}><NativeSelectOption value="4">窄</NativeSelectOption><NativeSelectOption value="8">宽</NativeSelectOption><NativeSelectOption value="12">整行</NativeSelectOption></NativeSelect><Button variant={item.visible ? 'outline' : 'secondary'} size="sm" onClick={() => updateCard(item.id, { visible: !item.visible })}>{item.visible ? '显示' : '隐藏'}</Button></div>)}</div></section>}

          <section className="grid gap-4 xl:grid-cols-12">
            <div className="contents">
              {card('tasks').visible && <article className={`panel overflow-hidden ${cardClass('tasks')}`} style={{ order: cardOrder('tasks') }}>
                <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6"><div><h2 className="font-semibold">今日计划</h2><p className="mt-0.5 text-xs text-muted-foreground">{completed}/{tasks.length} 已完成 · {completion}%</p></div><Button variant="ghost" size="sm">查看日历 <ChevronRight /></Button></div>
                <div className="divide-y">
                  {tasks.length === 0 && <div className="px-6 py-12 text-center"><div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></div><h3 className="mt-3 text-sm font-semibold">今天还没有计划</h3><p className="mt-1 text-xs text-muted-foreground">添加第一项计划，让今天更有方向。</p><Button className="mt-4" size="sm" onClick={() => setQuickOpen(true)}><Plus />添加计划</Button></div>}
                  {tasks.map((task) => {
                    const category = categoryStyle[task.category];
                    return (
                      <div key={task.id} className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-muted/35 sm:px-6">
                        <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id)} aria-label={`完成 ${task.title}`} />
                        <span className={`h-8 w-1 rounded-full ${category.dot}`} />
                        <div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${task.done ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p><div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">{task.time && <span>{task.time}</span>}<span className={`rounded-full px-2 py-0.5 ${category.badge}`}>{category.label}</span>{task.priority === 'high' && <span className="text-rose-500">高优先级</span>}</div></div>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" aria-label={`删除 ${task.title}`} onClick={() => deleteTask(task.id)}><Trash2 /></Button>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setQuickOpen(true)} className="flex w-full items-center gap-2 border-t px-6 py-3.5 text-sm font-medium text-primary transition hover:bg-primary/5"><Plus className="size-4" />添加今日计划</button>
              </article>}

              {card('focus').visible && <div className={`grid gap-4 md:grid-cols-2 ${cardClass('focus')}`} style={{ order: cardOrder('focus') }}>
                <article className="panel p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div className="icon-box bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300"><Code2 /></div><Badge variant="outline">{projects.length} 个项目</Badge></div><h2 className="font-semibold">开发工作</h2><p className="mt-1 text-sm text-muted-foreground">{project?.name || '尚未创建项目'}</p><div className="mt-5 flex items-center justify-between text-xs"><span>项目进度</span><strong>{project?.progress || 0}%</strong></div><Progress value={project?.progress || 0} className="mt-2 [&_[data-slot=progress-indicator]]:bg-sky-500" /><p className="mt-4 text-xs text-muted-foreground">{tasks.filter((task) => task.category === 'work' && !task.done).length} 个开发任务待处理</p></article>
                <article className="panel p-5 sm:p-6"><div className="mb-5 flex items-start justify-between"><div className="icon-box bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"><Dumbbell /></div><Badge variant="outline">共 {workouts.length} 次</Badge></div><h2 className="font-semibold">健身计划</h2><p className="mt-1 text-sm text-muted-foreground">{todayWorkout ? `今日 · ${todayWorkout.name}` : '今天还没有训练安排'}</p><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="metric"><strong>{todayWorkout?.exercises.length || 0}</strong><span>动作</span></div><div className="metric"><strong>{todayWorkout?.completed ? '是' : '否'}</strong><span>已完成</span></div><div className="metric"><strong>{todayWorkout?.duration || 0}</strong><span>分钟</span></div></div></article>
              </div>}
            </div>

            <div className="contents">
              {card('nutrition').visible && <article className={`panel p-5 sm:p-6 ${cardClass('nutrition')}`} style={{ order: cardOrder('nutrition') }}><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">今日营养</h2><p className="mt-1 text-xs text-muted-foreground">已记录 {todayMeals.length} 餐</p></div><div className="icon-box bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"><Apple /></div></div><div className="flex items-center gap-5"><Ring value={Math.min(100, Math.round(nutrition.calories / nutritionTargets.calories * 100))} label="热量" tone="amber" /><div className="min-w-0 flex-1 space-y-3"><Nutrient label="蛋白质" value={`${Math.round(nutrition.protein)} / ${nutritionTargets.protein}g`} percent={Math.min(100, nutrition.protein / nutritionTargets.protein * 100)} color="bg-sky-500" /><Nutrient label="碳水" value={`${Math.round(nutrition.carbs)} / ${nutritionTargets.carbs}g`} percent={Math.min(100, nutrition.carbs / nutritionTargets.carbs * 100)} color="bg-amber-500" /><Nutrient label="脂肪" value={`${Math.round(nutrition.fat)} / ${nutritionTargets.fat}g`} percent={Math.min(100, nutrition.fat / nutritionTargets.fat * 100)} color="bg-violet-500" /></div></div><div className="mt-5 rounded-xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">已摄入 <strong className="text-foreground">{Math.round(nutrition.calories).toLocaleString()} kcal</strong>，今日剩余 {Math.max(0, Math.round(nutritionTargets.calories - nutrition.calories)).toLocaleString()} kcal</div></article>}
              {card('week').visible && <article className={`panel p-5 sm:p-6 ${cardClass('week')}`} style={{ order: cardOrder('week') }}><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">本周概览</h2><p className="mt-1 text-xs text-muted-foreground">根据已保存数据自动汇总</p></div><Activity className="size-5 text-primary" /></div><div className="grid grid-cols-3 gap-3"><Stat value={`${completion}%`} label="计划完成" /><Stat value={String(workouts.filter((workout) => workout.completed).length)} label="健身次数" /><Stat value={`${project?.progress || 0}%`} label="项目进度" /></div><div className="mt-5 flex h-20 items-end gap-2" aria-label="本周完成趋势">{[0, 0, 0, 0, 0, 0, completion].map((height, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1.5"><div className="w-full rounded-t-md bg-primary/15" style={{ height: `${Math.max(4, height)}%` }}><div className="h-full w-full rounded-t-md bg-primary" style={{ opacity: i === 6 ? 1 : 0.2 }} /></div><span className="text-[9px] text-muted-foreground">{['一','二','三','四','五','六','日'][i]}</span></div>)}</div></article>}
              {card('review').visible && <article className={`panel flex items-center gap-4 p-5 ${cardClass('review')}`} style={{ order: cardOrder('review') }}><div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"><Check className="size-5" /></div><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">本周总结待完成</h3><p className="mt-0.5 text-xs text-muted-foreground">花几分钟回顾本周，为下周做好准备。</p></div><Button variant="outline" size="sm">开始总结</Button></article>}
            </div>
          </section>
          </> : activeNav === '设置' ? <SettingsPage dark={dark} onDarkChange={(value) => { setFollowSystem(false); setDark(value); }} followSystem={followSystem} onFollowSystemChange={setFollowSystem} language={language} onLanguageChange={() => setLanguage(language === 'zh' ? 'en' : 'zh')} /> : activeNav === '回收站' ? <TrashPage /> : <SectionPage name={activeNav} tasks={tasks} onAdd={(date) => { setTaskDraft((current) => ({ ...current, taskDate: date || today })); setQuickOpen(true); }} onToggle={toggleTask} onDelete={deleteTask} />}
        </div>
      </main>

      {quickOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-sm" onMouseDown={() => setQuickOpen(false)}>
          <form className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()} onSubmit={addTask}>
            <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">添加计划</h2><p className="mt-1 text-xs text-muted-foreground">保存后会自动出现在对应模块和每日计划中</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setQuickOpen(false)}><X /></Button></div>
            <div className="mt-5 space-y-4">
              <label className="block text-xs font-medium">事项名称<Input className="mt-2 h-10" autoFocus placeholder="例如：完成首页设计" value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} /></label>
              <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">日期<Input className="mt-2 h-10" type="date" value={taskDraft.taskDate} onChange={(event) => setTaskDraft({ ...taskDraft, taskDate: event.target.value })} /></label><label className="block text-xs font-medium">所属模块<NativeSelect className="mt-2 w-full" value={taskDraft.category} onChange={(event) => setTaskDraft({ ...taskDraft, category: event.target.value })}><NativeSelectOption value="personal">个人计划</NativeSelectOption><NativeSelectOption value="work">开发工作</NativeSelectOption><NativeSelectOption value="fitness">健身计划</NativeSelectOption><NativeSelectOption value="food">饮食计划</NativeSelectOption></NativeSelect></label></div>
              <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-medium">开始时间<Input className="mt-2 h-10" type="time" value={taskDraft.startTime} onChange={(event) => setTaskDraft({ ...taskDraft, startTime: event.target.value })} /></label><label className="block text-xs font-medium">结束时间<Input className="mt-2 h-10" type="time" value={taskDraft.endTime} onChange={(event) => setTaskDraft({ ...taskDraft, endTime: event.target.value })} /></label></div>
              {timeConflict && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">{timeConflict}</p>}
              <label className="block text-xs font-medium">优先级<NativeSelect className="mt-2 w-full" value={taskDraft.priority} onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value })}><NativeSelectOption value="high">高</NativeSelectOption><NativeSelectOption value="medium">中</NativeSelectOption><NativeSelectOption value="low">低</NativeSelectOption></NativeSelect></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setQuickOpen(false)}>取消</Button><Button type="submit" disabled={saving || !taskDraft.title.trim()}>{saving ? '保存中…' : '保存计划'}</Button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Nutrient({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return <div><div className="mb-1.5 flex justify-between text-[11px]"><span>{label}</span><span className="text-muted-foreground">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl bg-muted/45 px-2 py-3 text-center"><strong className="block text-base">{value}</strong><span className="mt-1 block text-[10px] text-muted-foreground">{label}</span></div>;
}

function SectionPage({ name, tasks, onAdd, onToggle, onDelete }: { name: string; tasks: Task[]; onAdd: (date?: string) => void; onToggle: (id: number) => void; onDelete: (id: number) => void }) {
  const config: Record<string, { description: string; icon: typeof CalendarDays; tone: string }> = {
    '每日计划': { description: '按日期安排普通待办与时间日程', icon: CalendarDays, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50' },
    '开发工作': { description: '管理项目、任务进度与开发笔记', icon: Code2, tone: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50' },
    '健身计划': { description: '安排训练、记录动作并管理训练模板', icon: Dumbbell, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50' },
    '饮食计划': { description: '记录每餐与热量、蛋白质、碳水和脂肪', icon: Apple, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50' },
    '数据统计': { description: '查看计划、开发、健身和营养趋势', icon: BarChart3, tone: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50' },
    '每周总结': { description: '回顾本周进展并写下下周重点', icon: FileText, tone: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50' },
  };
  const current = config[name] ?? config['每日计划']; const Icon = current.icon;
  const moduleCategory = name === '开发工作' ? 'work' : name === '健身计划' ? 'fitness' : name === '饮食计划' ? 'food' : undefined;
  const visibleTasks = moduleCategory ? tasks.filter((task) => task.category === moduleCategory) : tasks;

  return <>
    {name !== '每周总结' && <section className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><div className={`grid size-12 place-items-center rounded-2xl ${current.tone}`}><Icon className="size-5" /></div><div><h1 className="text-2xl font-semibold tracking-tight">{name}</h1><p className="mt-1 text-sm text-muted-foreground">{current.description}</p></div></div><Button className="self-start sm:self-auto" onClick={() => onAdd()}><Plus />快速添加</Button></section>}
    {name === '每日计划' && <DailyPlanner onAdd={(date) => onAdd(date)} />}
    {['开发工作','健身计划','饮食计划'].includes(name) && <><ModuleRecords module={name as '开发工作' | '健身计划' | '饮食计划'} /><div className="mt-4"><TaskPanel tasks={visibleTasks} onAdd={onAdd} onToggle={onToggle} onDelete={onDelete} /></div></>}
    {name === '数据统计' && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard title="计划完成率" value={`${tasks.length ? Math.round(tasks.filter((task) => task.done).length / tasks.length * 100) : 0}%`} subtitle="今日完成情况" tone="bg-emerald-500" /><StatCard title="开发任务" value={`${tasks.filter((task) => task.category === 'work' && task.done).length}/${tasks.filter((task) => task.category === 'work').length}`} subtitle="今日已完成" tone="bg-sky-500" /><StatCard title="健身次数" value="0/4" subtitle="本周目标" tone="bg-violet-500" /><StatCard title="营养目标" value="0%" subtitle="今日摄入" tone="bg-amber-500" /><article className="panel col-span-full p-6"><h2 className="font-semibold">本周趋势</h2><p className="mt-1 text-xs text-muted-foreground">数据积累后，这里会显示完整的趋势图和模块对比。</p><div className="mt-8 flex h-52 items-end gap-3">{[18,35,28,52,45,68,25].map((height, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full max-w-16 rounded-t-lg bg-primary/70" style={{ height: `${height}%` }} /><span className="text-xs text-muted-foreground">周{['一','二','三','四','五','六','日'][i]}</span></div>)}</div></article></div>}
    {name === '每周总结' && <WeeklyReview summary={{ completed: tasks.filter((task) => task.done).length, total: tasks.length, workCompleted: tasks.filter((task) => task.category === 'work' && task.done).length }} />}
  </>;
}

function TaskPanel({ tasks, onAdd, onToggle, onDelete, compact = false }: { tasks: Task[]; onAdd: () => void; onToggle: (id: number) => void; onDelete: (id: number) => void; compact?: boolean }) {
  return <article className={compact ? '' : 'panel overflow-hidden'}>{!compact && <div className="flex items-center justify-between border-b px-6 py-4"><div><h2 className="font-semibold">今日事项</h2><p className="mt-1 text-xs text-muted-foreground">普通待办与时间日程</p></div><Badge variant="secondary">{tasks.length} 项</Badge></div>}<div className="divide-y">{tasks.length === 0 ? <div className="px-6 py-12 text-center text-sm text-muted-foreground">暂时没有安排，点击下方按钮添加。</div> : tasks.map((task) => <div key={task.id} className="group flex items-center gap-3 px-6 py-4 hover:bg-muted/30"><Checkbox checked={task.done} onCheckedChange={() => onToggle(task.id)} /><div className="min-w-0 flex-1"><p className={`truncate text-sm font-medium ${task.done ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.time || '普通待办'} · {categoryStyle[task.category].label}</p></div><Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => onDelete(task.id)}><Trash2 /></Button></div>)}</div><button onClick={onAdd} className="flex w-full items-center gap-2 border-t px-6 py-3.5 text-sm font-medium text-primary hover:bg-primary/5"><Plus className="size-4" />添加事项</button></article>;
}

function StatCard({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: string }) {
  return <article className="panel p-5"><div className={`mb-5 h-1.5 w-10 rounded-full ${tone}`} /><p className="text-xs text-muted-foreground">{title}</p><strong className="mt-2 block text-3xl tracking-tight">{value}</strong><p className="mt-2 text-xs text-muted-foreground">{subtitle}</p></article>;
}
