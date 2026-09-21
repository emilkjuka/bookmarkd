import type Database from 'better-sqlite3';

/** Full-text search index for bookmark lists at scale. */
export function ensureBookmarkFts(client: Database.Database): void {
	client.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS bookmark_fts USING fts5(
			bookmark_id UNINDEXED,
			user_id UNINDEXED,
			title,
			description,
			url,
			notes,
			tokenize='unicode61 remove_diacritics 2'
		);

		CREATE TRIGGER IF NOT EXISTS bookmark_fts_insert AFTER INSERT ON bookmark BEGIN
			INSERT INTO bookmark_fts(bookmark_id, user_id, title, description, url, notes)
			VALUES (
				new.id,
				new.user_id,
				new.title,
				COALESCE(new.description, ''),
				new.url,
				COALESCE(new.notes, '')
			);
		END;

		CREATE TRIGGER IF NOT EXISTS bookmark_fts_delete AFTER DELETE ON bookmark BEGIN
			DELETE FROM bookmark_fts WHERE bookmark_id = old.id;
		END;

		CREATE TRIGGER IF NOT EXISTS bookmark_fts_update AFTER UPDATE ON bookmark BEGIN
			DELETE FROM bookmark_fts WHERE bookmark_id = old.id;
			INSERT INTO bookmark_fts(bookmark_id, user_id, title, description, url, notes)
			VALUES (
				new.id,
				new.user_id,
				new.title,
				COALESCE(new.description, ''),
				new.url,
				COALESCE(new.notes, '')
			);
		END;
	`);

	const { count } = client.prepare('SELECT COUNT(*) AS count FROM bookmark_fts').get() as {
		count: number;
	};
	const { total } = client.prepare('SELECT COUNT(*) AS total FROM bookmark').get() as {
		total: number;
	};

	if (count < total) {
		client.exec(`
			INSERT INTO bookmark_fts(bookmark_id, user_id, title, description, url, notes)
			SELECT
				b.id,
				b.user_id,
				b.title,
				COALESCE(b.description, ''),
				b.url,
				COALESCE(b.notes, '')
			FROM bookmark b
			WHERE NOT EXISTS (
				SELECT 1 FROM bookmark_fts f WHERE f.bookmark_id = b.id
			);
		`);
	}
}

export function ftsQueryTerm(raw: string): string | null {
	const tokens = raw
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.map((token) => token.replace(/[^a-z0-9._-]+/g, ''))
		.filter(Boolean);

	if (tokens.length === 0) return null;
	return tokens.map((token) => `"${token}"*`).join(' ');
}
