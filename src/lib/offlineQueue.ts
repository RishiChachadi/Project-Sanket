import { openDB } from 'idb';

const DB_NAME = 'sanket_disaster_db';
const STORE_NAME = 'sos_outbox';

export interface QueuedReport {
  id?: number;
  latitude: number;
  longitude: number;
  hazard_type: string;
  headcount: number;
  note: string;
  source: string;
  timestamp: number;
}

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function queueDistressReport(report: Omit<QueuedReport, 'id' | 'timestamp'>) {
  const db = await initDB();
  return db.add(STORE_NAME, {
    ...report,
    timestamp: Date.now(),
  });
}

export async function getQueuedReports(): Promise<QueuedReport[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function removeQueuedReport(id: number) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}
