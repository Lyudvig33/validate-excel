import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RowEntity } from './entities/row/row';
import { Repository } from 'typeorm';
import { parseExcel } from './utils/excel-parser';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(
    @InjectRepository(RowEntity) private rowRepository: Repository<RowEntity>,
  ) {}

  async importExcel(filePath: string) {
    try {
      this.logger.log(`Starting to process the file: ${filePath}`);

      const { validRows, errors } = await parseExcel(filePath);
      this.logger.log(
        `Parsed rows: ${validRows.length}, Errors: ${errors.length}`,
      );

      const rowsToSave = validRows
        .map((r) => {
          if (!r.sourceId || !r.name || !r.date) {
            this.logger.warn(`Skipping invalid row: ${JSON.stringify(r)}`);
            return null; // Skip a line if the data is incomplete
          }
          const row = new RowEntity();
          row.sourceId = r.sourceId;
          row.name = r.name;
          row.date = new Date(r.date); // Convert a date to a Date object
          return row;
        })
        .filter((row) => row !== null); // Removing empty rows

      const batchSize = 1000;
      const total = rowsToSave.length;

      if (total > 0) {
        this.logger.log(`Saving ${total} rows in batches of ${batchSize}`);

        for (let i = 0; i < total; i += batchSize) {
          const chunk = rowsToSave.slice(i, i + batchSize);
          await this.rowRepository.insert(chunk);
          this.logger.log(
            `Saved batch ${i / batchSize + 1}: ${chunk.length} rows`,
          );
        }
      } else {
        this.logger.warn('No valid rows to save');
      }

      const errorPath = path.join(process.cwd(), 'result.txt');
      fs.writeFileSync(errorPath, errors.join('\n'), 'utf-8');
      this.logger.log(`Error report saved to ${errorPath}`);

      // delete after processing
      fs.unlinkSync(filePath);
      this.logger.log(`File ${filePath} has been deleted after processing`);

      return {
        imported: rowsToSave.length,
        errors: errors.length,
        resultPath: 'result.txt',
      };
    } catch (err) {
      this.logger.error('Error processing the file', err.stack);
      throw new HttpException(
        'Error processing the file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
