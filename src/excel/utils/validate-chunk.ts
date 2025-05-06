import { RowEntity } from '../entities/row/row';

export function validateChunkRows(chunk: any[]): {
  validRows: RowEntity[];
  errors: string[];
} {
  const errors: string[] = [];
  const validRows: RowEntity[] = [];

  chunk.forEach((row, index) => {
    const rowErrors: string[] = [];
    const rowNumber = row.rowNumber ?? index + 2; // Adjust row number

    const sourceId = Number(row.sourceId);
    if (isNaN(sourceId)) rowErrors.push('invalid sourceId');

    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) rowErrors.push('invalid name');

    let date: Date | null = null;

    if (typeof row.date === 'string') {
      date = parseDate(row.date); // Parse custom string format
    } else if (row.date instanceof Date) {
      date = row.date;
    }
    if (!date) rowErrors.push('invalid date');
    

    if (rowErrors.length) {
      errors.push(`${rowNumber} - ${rowErrors.join(', ')}`); // Add error info
    } else {
      validRows.push({ sourceId, name, date } as RowEntity); // Add valid row
    }
  });

  return { validRows, errors };
}

function parseDate(str: string): Date | null {
  const parts = str.split('.');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900)
    return null;

  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date; // Return valid date or null
}
