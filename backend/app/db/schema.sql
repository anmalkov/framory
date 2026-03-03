CREATE TABLE IF NOT EXISTS channels (
    id              TEXT PRIMARY KEY,
    folder          TEXT NOT NULL DEFAULT '',
    delay_seconds   INTEGER NOT NULL DEFAULT 60,
    stop_time       TEXT NOT NULL DEFAULT '00:00',
    state           TEXT NOT NULL DEFAULT 'stopped_manual',
    current_index   INTEGER NOT NULL DEFAULT 0,
    history         TEXT NOT NULL DEFAULT '[]',
    sequence        TEXT NOT NULL DEFAULT '[]',
    show_progress_bar INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TRIGGER IF NOT EXISTS channels_updated_at
    AFTER UPDATE ON channels
    FOR EACH ROW
BEGIN
    UPDATE channels SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = OLD.id;
END;
