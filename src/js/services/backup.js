/**
 * Backup and restore. Data only lives in this browser, and Safari can clear
 * site data after a period without visits — so people can save a JSON backup
 * file and restore it on another device or browser.
 */
import { store, migrate } from '../storage/store.js';
import { APP_VERSION } from '../releases.js';
import { toast } from '../components/toast.js';

export function backupPayload() {
  return { app: 'india-interior-studio', version: APP_VERSION, exportedAt: new Date().toISOString(), data: store.get() };
}

export function exportBackup() {
  const blob = new Blob([JSON.stringify(backupPayload(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nivasa-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Backup file saved', { kind: 'good', body: a.download });
}

/** Validate and parse a backup file's text. Throws with a readable message. */
export function parseBackup(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('This file is not a valid backup (it is not JSON).');
  }
  if (!json || json.app !== 'india-interior-studio' || typeof json.data !== 'object') {
    throw new Error('This file is not a Nivasa backup.');
  }
  return migrate(json.data);
}

export async function importBackupFile(file) {
  const text = await file.text();
  const data = parseBackup(text);
  const ok = store.replaceAll(data);
  if (!ok) throw new Error("Couldn't save the restored data on this device.");
  return data;
}
