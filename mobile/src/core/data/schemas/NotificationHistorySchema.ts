/**
 * NotificationHistory Table Schema
 * SQLite用の通知履歴テーブルスキーマ
 */

export const createNotificationHistoriesTable = `
  CREATE TABLE IF NOT EXISTS notification_histories (
    id TEXT PRIMARY KEY,
    notification_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    data TEXT,
    sent_at TEXT NOT NULL,
    is_tapped INTEGER NOT NULL DEFAULT 0,
    tapped_at TEXT,
    is_delivered INTEGER NOT NULL DEFAULT 1,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`;

export const createNotificationHistoriesIndexes = `
  CREATE INDEX IF NOT EXISTS idx_notification_histories_user_id ON notification_histories(user_id);
  CREATE INDEX IF NOT EXISTS idx_notification_histories_type ON notification_histories(type);
  CREATE INDEX IF NOT EXISTS idx_notification_histories_sent_at ON notification_histories(sent_at);
  CREATE INDEX IF NOT EXISTS idx_notification_histories_is_tapped ON notification_histories(is_tapped);
  CREATE INDEX IF NOT EXISTS idx_notification_histories_notification_id ON notification_histories(notification_id);
`;
