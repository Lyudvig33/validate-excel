import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RowEntity } from './entities/row/row';
import { Repository } from 'typeorm';
import { parseExcel, RawExcelRow } from './utils/excel-parser';
import { Worker } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ExcelService {
  constructor(
    @InjectRepository(RowEntity)
    private rowRepository: Repository<RowEntity>,
    private redisService: RedisService,
  ) {}

  async runWorker(
    chunk: RawExcelRow[],
  ): Promise<{ validRows: RowEntity[]; errors: string[] }> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, 'excel-worker.js'), {
        workerData: { chunk }, // Send chunk to worker
      });

      worker.on('message', resolve); // Receive result
      worker.on('error', reject); // Handle errors
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker Stoped with exit code ${code}`)); // Handle non-zero exit
        }
      });
    });
  }

  async importExcel(
    filePath: string,
  ): Promise<{ message: string; taskId: string; errorFilePath: string }> {
    const { validRows: allRows, errors: parseErrors } =
      await parseExcel(filePath); // Parse Excel file

    const chunkSize = 10000; // Define chunk size for processing
    const taskId = `import:${uuidv4()}`; // Generate unique task ID
    const chunks: RawExcelRow[][] = [];

    for (let i = 0; i < allRows.length; i += chunkSize) {
      chunks.push(allRows.slice(i, i + chunkSize)); // Split rows into chunks
    }

    const allValidRows: RowEntity[] = [];
    const allErrors: string[] = [...parseErrors];

    let totalProcessedRows = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const result = await this.runWorker(chunk); // Process chunk in worker
        allValidRows.push(...result.validRows); // Collect valid rows
        allErrors.push(...result.errors); // Collect errors

        totalProcessedRows += chunk.length; // Update total processed rows
        const redisKey = `import:progress:${path.basename(filePath)}`; // Define Redis key for progress
        await this.redisService.set(redisKey, totalProcessedRows.toString()); // save progress in Redis
      } catch (error) {
        console.error(`Worker failed for chunk ${i + 1}`, error);
        allErrors.push(`Chunk ${i + 1}: Worker failed - ${error.message}`);
      }
    }

    const saveChunks: RowEntity[][] = []; 
    for (let i = 0; i < allValidRows.length; i += chunkSize) {
      saveChunks.push(allValidRows.slice(i, i + chunkSize)); // Split into smaller chunks for saving
    }

    await Promise.all(
      saveChunks.map((chunk) => this.rowRepository.insert(chunk)),
    );

    const resultPath = path.join(process.cwd(), 'result.txt');
    fs.writeFileSync(resultPath, allErrors.join('\n'), 'utf-8');

    return {
      message: 'Import completed',
      taskId,
      errorFilePath: resultPath,
    };
  }

  async getGroupedByDate(): Promise<{ date: string; items: RowEntity[] }[]> {
    const rows = await this.rowRepository.find();
    const grouped: Record<string, RowEntity[]> = {};

    for (const row of rows) {
      const dateObj = new Date(row.date);
      const dateKey = dateObj.toISOString().split('T')[0]; //format date as yyyy-mm-dd
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(row);
    }

    return Object.entries(grouped)
      .map(([date, items]) => ({
        date,
        items,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
