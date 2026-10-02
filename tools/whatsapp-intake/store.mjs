import { DatabaseSync } from 'node:sqlite'

/** Durable local inbox. Provider retries do not create duplicate rows or media jobs. */
export function openStore(filename) {
  const db = new DatabaseSync(filename)
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS messages (
      seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
      vendor TEXT NOT NULL, payload TEXT NOT NULL, media_path TEXT,
      attempts INTEGER NOT NULL DEFAULT 0, retry_at INTEGER NOT NULL DEFAULT 0,
      media_error TEXT NOT NULL DEFAULT ''
    );`)
  return {
    db,
    save(messages) {
      db.exec('BEGIN IMMEDIATE')
      try {
        const existing = Number(db.prepare('SELECT COUNT(*) AS count FROM messages').get().count)
        const newIds = new Set(messages.filter((message) => !db.prepare('SELECT id FROM messages WHERE id=?').get(message.id)).map((message) => message.id))
        if (existing + newIds.size > 50000) throw new Error('Local inbox capacity reached; archive before resuming')
        for (const message of messages) db.prepare('INSERT OR IGNORE INTO messages(id,vendor,payload) VALUES(?,?,?)').run(message.id, message.vendorId, JSON.stringify(message))
        db.exec('COMMIT')
      } catch (error) { db.exec('ROLLBACK'); throw error }
    },
    rows() { return db.prepare('SELECT * FROM messages ORDER BY seq').all().map((row) => ({ ...row, message: JSON.parse(row.payload) })) },
    downloaded(id, path) { db.prepare("UPDATE messages SET media_path=?,media_error='' WHERE id=?").run(path, id) },
    failed(id, attempts) { db.prepare("UPDATE messages SET attempts=?,retry_at=?,media_error='Media download failed; check access or retry later.' WHERE id=?").run(attempts, Date.now() + Math.min(3600000, 30000 * 2 ** attempts), id) },
    retry() { db.prepare("UPDATE messages SET attempts=0,retry_at=0,media_error='' WHERE media_path IS NULL").run() },
  }
}
