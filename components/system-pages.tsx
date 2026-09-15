'use client';

import {
  ArchiveRestore,
  Calculator,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  HardDrive,
  Languages,
  Moon,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

type DeletedTask = {
  id: number;
  title: string;
  taskDate: string;
  category: string;
  deletedAt: string;
};

export function SettingsPage({
  dark,
  onDarkChange,
  followSystem,
  onFollowSystemChange,
  language,
  onLanguageChange,
}: {
  dark: boolean;
  onDarkChange: (value: boolean) => void;
  followSystem: boolean;
  onFollowSystemChange: (value: boolean) => void;
  language: 'zh' | 'en';
  onLanguageChange: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const restore = async (file?: File) => {
    if (!file) return;
    if (!confirm('恢复备份会替换当前全部数据，确定继续吗？')) return;
    try {
      const body = await file.text();
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!response.ok) throw new Error();
      setMessage('恢复完成，刷新页面后即可看到数据。');
    } catch {
      setMessage('恢复失败，请检查是否选择了正确的备份文件。');
    }
  };
  return (
    <>
      <Header
        icon={Database}
        title="设置"
        description="管理本地数据、语言、主题与备份"
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="panel overflow-hidden">
          <SettingRow
            icon={HardDrive}
            title="本地数据"
            description="所有计划、项目、训练和饮食记录只保存在这台电脑"
          >
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              运行正常
            </span>
          </SettingRow>
          <SettingRow
            icon={Moon}
            title="跟随系统颜色"
            description="Windows 切换深色或浅色时自动同步"
          >
            <Switch
              checked={followSystem}
              onCheckedChange={onFollowSystemChange}
            />
          </SettingRow>
          <SettingRow
            icon={Moon}
            title="深色模式"
            description={
              followSystem
                ? '当前由 Windows 系统颜色控制'
                : '也可以使用页面右上角的按钮随时切换'
            }
          >
            <Switch
              checked={dark}
              disabled={followSystem}
              onCheckedChange={onDarkChange}
            />
          </SettingRow>
          <SettingRow
            icon={Languages}
            title="界面语言"
            description="简体中文与英文界面"
          >
            <Button variant="outline" size="sm" onClick={onLanguageChange}>
              {language === 'zh' ? '简体中文' : 'English'}
            </Button>
          </SettingRow>
          <div className="border-t p-6">
            <h2 className="font-semibold">数据与报告导出</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              导出后可在 Excel 中整理，或打印为 PDF 留档。
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Button
                variant="outline"
                render={
                  <a
                    href="/api/export?format=xls"
                    download
                    aria-label="导出 Excel"
                  />
                }
              >
                <FileSpreadsheet />
                Excel
              </Button>
              <Button
                variant="outline"
                render={
                  <a
                    href="/api/export?format=csv"
                    download
                    aria-label="导出 CSV"
                  />
                }
              >
                <Download />
                CSV
              </Button>
              <Button
                variant="outline"
                render={
                  <a
                    href="/report"
                    target="_blank"
                    aria-label="打开 PDF 打印报告"
                  />
                }
              >
                <FileText />
                PDF 报告
              </Button>
            </div>
          </div>
        </article>
        <article className="panel p-6">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Database className="size-5" />
          </div>
          <h2 className="mt-5 font-semibold">备份与恢复</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            建议定期导出完整备份。备份包含计划、项目、训练、饮食和设置数据。
          </p>
          <div className="mt-5 space-y-2">
            <Button
              className="w-full justify-start"
              render={
                <a href="/api/backup" download aria-label="导出完整备份" />
              }
            >
              <Download />
              导出完整备份
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => restore(event.target.files?.[0])}
            />
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              <FileUp />
              从备份恢复
            </Button>
          </div>
          {message && (
            <p className="mt-4 rounded-lg bg-muted p-3 text-xs">{message}</p>
          )}
        </article>
        <div className="lg:col-span-2">
          <NutritionSettings />
        </div>
      </div>
    </>
  );
}

function NutritionSettings() {
  const [profile, setProfile] = useState({
    age: '30',
    sex: 'male',
    height: '175',
    weight: '70',
    activity: '1.55',
    goal: 'maintain',
  });
  const [targets, setTargets] = useState({
    calories: 2100,
    protein: 126,
    carbs: 265,
    fat: 56,
  });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    fetch('/api/settings')
      .then((response) => response.json())
      .then((data: unknown) => {
        const settings = data as {
          profile?: typeof profile;
          nutritionTargets?: typeof targets;
        };
        if (settings.profile) setProfile(settings.profile);
        if (settings.nutritionTargets) setTargets(settings.nutritionTargets);
      })
      .catch(() => undefined);
  }, []);
  const calculate = () => {
    const age = Number(profile.age),
      height = Number(profile.height),
      weight = Number(profile.weight);
    const bmr =
      10 * weight +
      6.25 * height -
      5 * age +
      (profile.sex === 'male' ? 5 : -161);
    const adjustment =
      profile.goal === 'lose' ? -300 : profile.goal === 'gain' ? 300 : 0;
    const calories = Math.max(
      1200,
      Math.round(bmr * Number(profile.activity) + adjustment),
    );
    const protein = Math.round(weight * 1.8);
    const fat = Math.round(weight * 0.8);
    const carbs = Math.max(
      0,
      Math.round((calories - protein * 4 - fat * 9) / 4),
    );
    setTargets({ calories, protein, carbs, fat });
  };
  const save = async () => {
    await Promise.all([
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'profile', value: profile }),
      }),
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'nutritionTargets', value: targets }),
      }),
    ]);
    window.dispatchEvent(new Event('settings-updated'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <article className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">身体信息与营养目标</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            根据基础信息估算建议值，你可以随时手动修改。建议仅用于日常规划。
          </p>
        </div>
        <div className="icon-box bg-amber-50 text-amber-600 dark:bg-amber-950/50">
          <Calculator />
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MiniField label="年龄">
          <Input
            type="number"
            value={profile.age}
            onChange={(event) =>
              setProfile({ ...profile, age: event.target.value })
            }
          />
        </MiniField>
        <MiniField label="性别">
          <NativeSelect
            className="w-full"
            value={profile.sex}
            onChange={(event) =>
              setProfile({ ...profile, sex: event.target.value })
            }
          >
            <NativeSelectOption value="male">男</NativeSelectOption>
            <NativeSelectOption value="female">女</NativeSelectOption>
          </NativeSelect>
        </MiniField>
        <MiniField label="身高 cm">
          <Input
            type="number"
            value={profile.height}
            onChange={(event) =>
              setProfile({ ...profile, height: event.target.value })
            }
          />
        </MiniField>
        <MiniField label="体重 kg">
          <Input
            type="number"
            value={profile.weight}
            onChange={(event) =>
              setProfile({ ...profile, weight: event.target.value })
            }
          />
        </MiniField>
        <MiniField label="活动量">
          <NativeSelect
            className="w-full"
            value={profile.activity}
            onChange={(event) =>
              setProfile({ ...profile, activity: event.target.value })
            }
          >
            <NativeSelectOption value="1.2">较少</NativeSelectOption>
            <NativeSelectOption value="1.375">轻度</NativeSelectOption>
            <NativeSelectOption value="1.55">中等</NativeSelectOption>
            <NativeSelectOption value="1.725">较高</NativeSelectOption>
          </NativeSelect>
        </MiniField>
        <MiniField label="目标">
          <NativeSelect
            className="w-full"
            value={profile.goal}
            onChange={(event) =>
              setProfile({ ...profile, goal: event.target.value })
            }
          >
            <NativeSelectOption value="lose">减脂</NativeSelectOption>
            <NativeSelectOption value="maintain">维持</NativeSelectOption>
            <NativeSelectOption value="gain">增重</NativeSelectOption>
          </NativeSelect>
        </MiniField>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl bg-muted/35 p-4">
        <MiniField label="热量 kcal">
          <Input
            className="w-28"
            type="number"
            value={targets.calories}
            onChange={(event) =>
              setTargets({ ...targets, calories: Number(event.target.value) })
            }
          />
        </MiniField>
        <MiniField label="蛋白质 g">
          <Input
            className="w-28"
            type="number"
            value={targets.protein}
            onChange={(event) =>
              setTargets({ ...targets, protein: Number(event.target.value) })
            }
          />
        </MiniField>
        <MiniField label="碳水 g">
          <Input
            className="w-28"
            type="number"
            value={targets.carbs}
            onChange={(event) =>
              setTargets({ ...targets, carbs: Number(event.target.value) })
            }
          />
        </MiniField>
        <MiniField label="脂肪 g">
          <Input
            className="w-28"
            type="number"
            value={targets.fat}
            onChange={(event) =>
              setTargets({ ...targets, fat: Number(event.target.value) })
            }
          />
        </MiniField>
        <Button variant="outline" onClick={calculate}>
          <Calculator />
          重新估算
        </Button>
        <Button onClick={save}>
          {saved ? (
            <>
              <Save />
              已保存
            </>
          ) : (
            '保存设置'
          )}
        </Button>
      </div>
    </article>
  );
}
function MiniField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-medium">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

export function TrashPage() {
  const [items, setItems] = useState<DeletedTask[]>([]);
  useEffect(() => {
    fetch('/api/tasks?deleted=true')
      .then((response) => response.json())
      .then((data) => setItems(data as DeletedTask[]))
      .catch(() => undefined);
  }, []);
  const restore = async (id: number) => {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, restore: true }),
    });
    setItems((current) => current.filter((item) => item.id !== id));
  };
  const removeForever = async (id: number) => {
    if (!confirm('永久删除后无法恢复，确定删除这条计划吗？')) return;
    await fetch(`/api/tasks?id=${id}&permanent=true`, { method: 'DELETE' });
    setItems((current) => current.filter((item) => item.id !== id));
  };
  const emptyTrash = async () => {
    if (
      !items.length ||
      !confirm(`将永久删除回收站中的 ${items.length} 条计划，确定继续吗？`)
    )
      return;
    await fetch('/api/tasks?empty=true', { method: 'DELETE' });
    setItems([]);
  };
  return (
    <>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <Header
          icon={Trash2}
          title="回收站"
          description="恢复最近删除的内容，避免误删"
        />
        {items.length > 0 && (
          <Button variant="destructive" size="sm" onClick={emptyTrash}>
            <Trash2 />
            清空回收站
          </Button>
        )}
      </div>
      <article className="panel overflow-hidden">
        {items.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Trash2 className="size-5" />
            </div>
            <h2 className="mt-4 text-sm font-semibold">回收站是空的</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              删除的计划会暂时保存在这里。
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">
                  <Trash2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">{item.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    原计划日期：{item.taskDate}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restore(item.id)}
                >
                  <ArchiveRestore />
                  恢复
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeForever(item.id)}
                >
                  <Trash2 />
                  永久删除
                </Button>
              </div>
            ))}
          </div>
        )}
      </article>
    </>
  );
}

function Header({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Database;
  title: string;
  description: string;
}) {
  return (
    <section className="mb-7 flex items-center gap-4">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Database;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 border-b px-6 py-5 last:border-0">
      <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
