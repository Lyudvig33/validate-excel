import * as ExcelJS from 'exceljs';

export interface ExcelRow {
  rowNumber: number;
  sourceId: number;
  name: string;
  date: Date;
}

export async function parseExcel(filePath: string): Promise<{
  validRows: ExcelRow[];
  errors: string[];
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  const validRows: ExcelRow[] = [];
  const errors: string[] = [];

  worksheet.eachRow((row, index) => {
    if (index === 1) return;
    const sourceIdRaw = row.getCell(1).value;
    const nameRaw = row.getCell(2).value;
    const dateRaw = row.getCell(3).value;

    const rowErrors: string[] = [];

    const sourceId = Number(sourceIdRaw);
    if (isNaN(sourceId)) rowErrors.push('invalid sourceId');

    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    if (!name) rowErrors.push('invalid name');

    let date: Date | null = null;

    if (dateRaw instanceof Date) {
      date = dateRaw;
    } else if (typeof dateRaw === 'string') {
      date = parseDate(dateRaw);
    }
    if (!date) rowErrors.push('invalid date');

    if (rowErrors.length > 0) {
      errors.push(`${index} - ${rowErrors.join(', ')}`);
    } else {
      validRows.push({
        rowNumber: index,
        sourceId,
        name,
        date: date!,
      });
    }
  });

  return { validRows, errors };
}

function parseDate(str: string): Date | null {
  const parts = str.split('.');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}
