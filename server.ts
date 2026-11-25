// Book.299wala.com - Full-Stack Express Server (Port 3000)
// Handles:
// 1. Vite dev middleware & production static serving with SPA routing (/admin, /product/:id, etc.)
// 2. Admin Brute-Force Lockout Protection (5 wrong attempts -> 15-minute lock)
// 3. Email Notification Outbox Logging

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
const EMAIL_OUTBOX_FILE = path.join(DATA_DIR, 'email-outbox.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// In-memory Admin Brute-Force Lockout Tracker (5 wrong attempts -> 15 min lock)
interface AttemptRecord {
  failedCount: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', store: 'Book.299wala.com', academy: 'Galaxy Science Academy, Ghazipur' });
});

// Check or record admin login attempt (for 5-failure 15-minute brute-force protection)
app.post('/api/auth/admin-attempt', (req, res) => {
  const { action, email } = req.body as { action?: 'check' | 'fail' | 'success'; email?: string };
  const key = `${req.ip || 'local'}:${(email || 'admin').toLowerCase()}`;
  const now = Date.now();
  const current = loginAttempts.get(key) || { failedCount: 0, lockedUntil: 0 };

  // Reset expired lock
  if (current.lockedUntil && current.lockedUntil <= now) {
    current.failedCount = 0;
    current.lockedUntil = 0;
  }

  if (action === 'success') {
    loginAttempts.delete(key);
    return res.json({ locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS });
  }

  if (action === 'fail') {
    if (current.lockedUntil > now) {
      return res.json({
        locked: true,
        remainingSeconds: Math.ceil((current.lockedUntil - now) / 1000),
        attemptsLeft: 0,
      });
    }
    current.failedCount += 1;
    if (current.failedCount >= MAX_ATTEMPTS) {
      current.lockedUntil = now + LOCK_DURATION_MS;
    }
    loginAttempts.set(key, current);
  }

  const isLocked = current.lockedUntil > now;
  return res.json({
    locked: isLocked,
    remainingSeconds: isLocked ? Math.ceil((current.lockedUntil - now) / 1000) : 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - current.failedCount),
  });
});

// Email Notification Outbox Endpoint
app.post('/api/notify/email', (req, res) => {
  try {
    const entry = {
      ...req.body,
      receivedAt: new Date().toISOString(),
    };
    let existing: unknown[] = [];
    if (fs.existsSync(EMAIL_OUTBOX_FILE)) {
      existing = JSON.parse(fs.readFileSync(EMAIL_OUTBOX_FILE, 'utf-8'));
    }
    existing.unshift(entry);
    fs.writeFileSync(EMAIL_OUTBOX_FILE, JSON.stringify(existing.slice(0, 200), null, 2));
    res.json({ ok: true, status: 'Sent' });
  } catch {
    res.status(500).json({ ok: false });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Book.299wala.com server running on http://localhost:${PORT}`);
  });
}

startServer();
