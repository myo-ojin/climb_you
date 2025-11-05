/**
 * Goal Table Schema
 * SQLite用の目標テーブルスキーマ
 */

export const createGoalsTable = `
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    kpi TEXT NOT NULL,
    duration TEXT NOT NULL,
    deadline TEXT,
    obstacles TEXT,
    plans TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_synced INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

export const createGoalsIndexes = `
  CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
  CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
`;
