import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const MAX_HISTORY_SIZE = 300;

class HistoryManager {
  constructor() {
    this.history = [];
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.history = parsed;
        }
      } else {
        this.saveHistory();
      }
    } catch (err) {
      console.warn('[HistoryManager] Failed to read history file, starting fresh:', err.message);
      this.history = [];
    }
  }

  saveHistory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history.slice(-MAX_HISTORY_SIZE), null, 2), 'utf-8');
    } catch (err) {
      console.warn('[HistoryManager] Failed to save history:', err.message);
    }
  }

  getRecentWords(limit = 100) {
    return this.history.slice(-limit);
  }

  recordUsedWords(wordsArray = []) {
    if (!Array.isArray(wordsArray) || wordsArray.length === 0) return;

    wordsArray.forEach(w => {
      const trimmed = (w || '').trim();
      if (trimmed && !this.history.includes(trimmed)) {
        this.history.push(trimmed);
      }
    });

    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history = this.history.slice(-MAX_HISTORY_SIZE);
    }

    this.saveHistory();
  }

  hasUsedWords(words = []) {
    if (!Array.isArray(words) || words.length === 0) return false;
    const recent = this.history.slice(-80).map(w => (w || '').toLowerCase());
    return words.some(w => recent.includes((w || '').toLowerCase()));
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }
}

export const historyManager = new HistoryManager();
