import * as ExcelJS from 'exceljs';

export interface RawExcelRow {
  rowNumber: number;
  sourceId: any;
  name: any;
  date: any;
}

export async function parseExcel(filePath: string): Promise<{
  validRows: RawExcelRow[];
  errors: string[];
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];

  const rows: RawExcelRow[] = [];
  const errors: string[] = [];

  sheet.eachRow((row, index) => {
    if (index === 1) return; // skip header row

    const rowData: RawExcelRow = {
      rowNumber: index,
      sourceId: row.getCell(1).value,
      name: row.getCell(2).value,
      date: row.getCell(3).value,
    }; // TODO VALIDATE HERE WITH JOI 

    rows.push(rowData); // collect parsed rows
  });

  return { validRows: rows, errors };
}
