
import { type JDCard } from "../types";

export interface RunHistoryEntry {
  id: string;
  timestamp: string;
  intent: string;
  jdCard: JDCard;
  executionResults: Record<string, any>;
  projectName: string;
}

const STORAGE_KEY = 'api2ui_run_history';

class RunHistoryService {
  saveRun(entry: Omit<RunHistoryEntry, 'id' | 'timestamp'>): RunHistoryEntry {
    const history = this.getHistory();
    const newEntry: RunHistoryEntry = {
      ...entry,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
    };
    
    // Limit to 20 most recent runs
    const updatedHistory = [newEntry, ...history].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return newEntry;
  }

  getHistory(): RunHistoryEntry[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  deleteEntry(id: string) {
    const history = this.getHistory();
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const runHistoryService = new RunHistoryService();
