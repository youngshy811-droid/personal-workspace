import { env } from 'cloudflare:workers';
import { ensureDatabase } from '@/db/initialize';

type Row = Record<string, unknown>;
const sources = [
  { name: '每日计划', table: 'tasks', columns: [['标题','title'],['日期','task_date'],['开始时间','start_time'],['结束时间','end_time'],['模块','category'],['优先级','priority'],['已完成','done']] },
  { name: '开发项目', table: 'projects', columns: [['项目名称','name'],['项目说明','description'],['状态','status'],['进度','progress'],['开始日期','start_date'],['目标日期','target_date']] },
  { name: '健身记录', table: 'workouts', columns: [['训练名称','name'],['日期','workout_date'],['时长（分钟）','duration'],['动作','exercises'],['已完成','completed']] },
  { name: '饮食记录', table: 'meals', columns: [['餐食名称','name'],['日期','meal_date'],['餐次','meal_type'],['热量','calories'],['蛋白质','protein'],['碳水','carbs'],['脂肪','fat']] },
] as const;

export async function GET(request: Request) {
  await ensureDatabase(); const format = new URL(request.url).searchParams.get('format') || 'xls'; const sheets: { name: string; headers: string[]; rows: unknown[][] }[] = [];
  for (const source of sources) { const result = await env.DB.prepare(`SELECT * FROM ${source.table} WHERE deleted_at IS NULL ORDER BY id`).all(); sheets.push({ name: source.name, headers: source.columns.map(([label]) => label), rows: result.results.map((row) => source.columns.map(([, key]) => display(key, (row as Row)[key]))) }); }
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'csv') {
    const rows = [['类型','名称','日期','详情']];
    for (const sheet of sheets) for (const row of sheet.rows) rows.push([sheet.name, row[0], row[1] ?? '', row.slice(2).join(' | ')]);
    const body = '\ufeff' + rows.map((row) => row.map(csv).join(',')).join('\r\n');
    return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="personal-workspace-${stamp}.csv"` } });
  }
  return new Response(toExcelXml(sheets), { headers: { 'Content-Type': 'application/vnd.ms-excel; charset=utf-8', 'Content-Disposition': `attachment; filename="personal-workspace-${stamp}.xls"` } });
}

function display(key: string, value: unknown) { if (key === 'done' || key === 'completed') return value ? '是' : '否'; if (key === 'category') return value === 'work' ? '开发' : value === 'fitness' ? '健身' : value === 'food' ? '饮食' : '个人'; if (key === 'exercises' && typeof value === 'string') { try { const items = JSON.parse(value) as { name?: string; sets?: number; reps?: number }[]; return items.map((item) => `${item.name || '动作'} ${item.sets || 0}组×${item.reps || 0}次`).join('；'); } catch { return value; } } return value ?? ''; }
function csv(value: unknown) { const text = String(value ?? ''); return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function xml(value: unknown) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function toExcelXml(sheets: { name: string; headers: string[]; rows: unknown[][] }[]) {
  const worksheets = sheets.map((sheet) => `<Worksheet ss:Name="${xml(sheet.name)}"><Table>${rowXml(sheet.headers, true)}${sheet.rows.map((row) => rowXml(row, false)).join('')}</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane></WorksheetOptions></Worksheet>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#16866A" ss:Pattern="Solid"/></Style><Style ss:ID="Cell"><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style></Styles>${worksheets}</Workbook>`;
}
function rowXml(values: unknown[], header: boolean) { return `<Row>${values.map((value) => { const isNumber = typeof value === 'number'; return `<Cell ss:StyleID="${header ? 'Header' : 'Cell'}"><Data ss:Type="${isNumber ? 'Number' : 'String'}">${xml(value)}</Data></Cell>`; }).join('')}</Row>`; }
