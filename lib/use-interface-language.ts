'use client';

import { useEffect } from 'react';

const originalText = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

const terms: Record<string, string> = {
  '个人工作台': 'Personal Workspace', '本地版': 'Local Edition', 'Life OS · 本地版': 'Life OS · Local Edition', '回收站': 'Trash', '设置': 'Settings',
  '本地使用者': 'Local User', '数据仅保存在此电脑': 'Data stays on this computer', '快速添加': 'Quick Add',
  '切换语言': 'Switch language', '切换主题': 'Switch theme', '自定义首页': 'Customize', '完成调整': 'Done',
  '调整首页卡片': 'Customize dashboard cards', '调整顺序、宽度或隐藏卡片，设置会保存在这台电脑。': 'Change order, width, or visibility. These settings stay on this computer.',
  '恢复默认': 'Reset', '显示': 'Shown', '隐藏': 'Hidden', '窄': 'Small', '宽': 'Wide', '整行': 'Full row',
  '你好，今天稳步向前。': 'Hello, keep moving forward today.', '今天': 'Today', '今日计划': "Today's Plan", '查看日历': 'View calendar',
  '今天还没有计划': 'No plans yet today', '添加第一项计划，让今天更有方向。': 'Add your first item to give today some direction.',
  '添加计划': 'Add plan', '添加今日计划': 'Add to today', '开发工作': 'Development', '健身计划': 'Fitness', '饮食计划': 'Nutrition',
  '尚未创建项目': 'No projects yet', '项目进度': 'Project progress', '动作': 'Exercises', '已完成': 'Completed', '分钟': 'Minutes',
  '今天还没有训练安排': 'No workout scheduled today', '今日营养': "Today's nutrition", '热量': 'Calories', '蛋白质': 'Protein',
  '碳水': 'Carbs', '脂肪': 'Fat', '本周概览': 'Weekly overview', '根据已保存数据自动汇总': 'Automatically summarized from saved data',
  '计划完成': 'Plans done', '健身次数': 'Workouts', '本周总结待完成': 'Weekly review pending', '花几分钟回顾本周，为下周做好准备。': 'Take a few minutes to review this week and prepare for the next.',
  '开始总结': 'Start review', '事项名称': 'Plan title', '日期': 'Date', '所属模块': 'Module', '个人计划': 'Personal',
  '开始时间': 'Start time', '结束时间': 'End time', '优先级': 'Priority', '高': 'High', '中': 'Medium', '低': 'Low',
  '取消': 'Cancel', '保存计划': 'Save plan', '保存中…': 'Saving…', '每日计划': 'Daily Plan', '数据统计': 'Analytics', '每周总结': 'Weekly Review',
  '项目列表': 'Projects', '训练记录与模板': 'Workouts & templates', '餐食记录与模板': 'Meals & templates', '新增': 'New',
  '还没有任何记录': 'No records yet', '创建第一条内容，它会自动保存到这台电脑。': 'Create your first record. It will be saved on this computer.',
  '开始创建': 'Create', '模板': 'Template', '使用模板': 'Use template', '训练目标': 'Fitness goals', '模板功能': 'Templates',
  '每周次数': 'Weekly sessions', '每月次数': 'Monthly sessions', '保存目标': 'Save goals', '已保存': 'Saved', '本周训练': 'This week', '本月训练': 'This month',
  '新建项目': 'New project', '记录训练': 'Log workout', '记录餐食': 'Log meal', '填写基础信息，之后可以继续完善': 'Enter the basics now and add more later.',
  '名称': 'Name', '项目说明': 'Description', '开始日期': 'Start date', '目标日期': 'Target date', '训练日期': 'Workout date', '第一个动作': 'First exercise',
  '组数': 'Sets', '次数': 'Reps', '餐次': 'Meal', '早餐': 'Breakfast', '午餐': 'Lunch', '晚餐': 'Dinner', '加餐': 'Snack', '保存': 'Save',
  '保存为模板': 'Save as template', '之后可以一键加入今天': 'Reuse it with one click later.', '开发笔记': 'Development notes', '图片与文件附件': 'Images & attachments',
  '笔记标题': 'Note title', '保存笔记': 'Save note', '还没有开发笔记': 'No notes yet', '添加附件': 'Add attachment', '上传中…': 'Uploading…', '还没有附件': 'No attachments yet',
  '管理本地数据、语言、主题与备份': 'Manage local data, language, theme, and backups', '本地数据': 'Local data', '运行正常': 'Working normally',
  '深色模式': 'Dark mode', '界面语言': 'Interface language', '简体中文与英文界面': 'Chinese and English interface', '数据与报告导出': 'Data and report exports',
  '跟随系统颜色': 'Follow system colors', 'Windows 切换深色或浅色时自动同步': 'Automatically follows the Windows light or dark appearance',
  '当前由 Windows 系统颜色控制': 'Currently controlled by Windows appearance',
  '备份与恢复': 'Backup and restore', '导出完整备份': 'Export full backup', '从备份恢复': 'Restore from backup', '身体信息与营养目标': 'Profile & nutrition targets',
  '重新估算': 'Recalculate', '保存设置': 'Save settings', '恢复最近删除的内容，避免误删': 'Restore recently deleted items', '回收站是空的': 'Trash is empty',
  '删除的计划会暂时保存在这里。': 'Deleted plans are kept here temporarily.', '恢复': 'Restore', '永久删除': 'Delete forever', '清空回收站': 'Empty trash',
  '首页': 'Overview', '我': 'Me', '否': 'No', '已摄入 ': 'Consumed ', '，今日剩余 ': ', remaining today ',
  '你有 ': 'You have ', ' 项计划待完成': ' plans remaining', '已记录 ': 'Logged ', ' 餐': ' meals', ' 个项目': ' projects',
  ' 个开发任务待处理': ' development tasks remaining', '共 ': 'Total ', ' 次': ' workouts', '本周完成趋势': 'Weekly completion trend',
  '一': 'Mon', '二': 'Tue', '三': 'Wed', '四': 'Thu', '五': 'Fri', '六': 'Sat', '日': 'Sun',
};

function translate(value: string) {
  const trimmed = value.trim();
  if (terms[trimmed]) return value.replace(trimmed, terms[trimmed]);
  let output = value;
  return output
    .replace(/共 (\d+) 条记录，数据保存在本地/g, '$1 records · saved locally')
    .replace(/你有 (\d+) 项计划待完成。?/g, '$1 plans remaining today.')
    .replace(/(\d+)\/(\d+) 已完成/g, '$1/$2 completed')
    .replace(/已记录 (\d+) 餐/g, '$1 meals logged')
    .replace(/共 (\d+) 次/g, '$1 total')
    .replace(/(\d+) 个开发任务待处理/g, '$1 development tasks remaining');
}

export function useInterfaceLanguage(language: 'zh' | 'en') {
  useEffect(() => {
    const root = document.querySelector('[data-app-shell]'); if (!root) return;
    const apply = () => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let node: Node | null;
      while ((node = walker.nextNode())) {
        const current = node.nodeValue || ''; if (!current.trim()) continue;
        if (!originalText.has(node) || (language === 'en' && /[\u3400-\u9fff]/.test(current))) originalText.set(node, current);
        const original = originalText.get(node) || current; const next = language === 'en' ? translate(original) : original;
        if (current !== next) node.nodeValue = next;
      }
      root.querySelectorAll('*').forEach((element) => ['placeholder', 'aria-label', 'title'].forEach((name) => {
        const current = element.getAttribute(name); if (!current) return; let saved = originalAttributes.get(element); if (!saved) { saved = new Map(); originalAttributes.set(element, saved); }
        if (!saved.has(name) || (language === 'en' && /[\u3400-\u9fff]/.test(current))) saved.set(name, current);
        const original = saved.get(name) || current; const next = language === 'en' ? translate(original) : original; if (current !== next) element.setAttribute(name, next);
      }));
    };
    apply(); const observer = new MutationObserver(apply); observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] });
    return () => observer.disconnect();
  }, [language]);
}
