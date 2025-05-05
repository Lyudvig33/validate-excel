import { parentPort, workerData } from 'worker_threads';
import { validateChunkRows } from './utils/validate-chunk';

async function run() {
  const { chunk } = workerData; // Get chunk data from main thread
  const result = validateChunkRows(chunk); // Validate chunk
  parentPort?.postMessage(result); // Send result back
}

run().catch(() => {
  parentPort?.postMessage({ validRows: [], errors: ['Worker error'] });
});
