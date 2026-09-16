import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { tag } from '#lib/server/db/schema';
import { slugify } from '#lib/server/slug';
import type { Tag } from '#lib/types';

async function uniqueSlug(userId: string, name: string, excludeId?: string): Promise<string> {
	const base = slugify(name);
	let candidate = base;
	let n = 1;

	while (true) {
		const existing = await db.query.tag.findFirst({
			where: and(eq(tag.userId, userId), eq(tag.slug, candidate))
		});
		if (!existing || existing.id === excludeId) return candidate;
		n += 1;
		candidate = `${base}-${n}`;
	}
}

function toTag(row: typeof tag.$inferSelect): Tag {
	return { id: row.id, name: row.name, slug: row.slug };
}

export async function listTags(userId: string): Promise<Tag[]> {
	const rows = await db.select().from(tag).where(eq(tag.userId, userId)).orderBy(asc(tag.name));
	return rows.map(toTag);
}

export async function getTagBySlug(userId: string, slug: string): Promise<Tag | null> {
	const row = await db.query.tag.findFirst({
		where: and(eq(tag.userId, userId), eq(tag.slug, slug))
	});
	return row ? toTag(row) : null;
}

export async function findOrCreateTags(userId: string, names: string[]): Promise<Tag[]> {
	const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
	if (uniqueNames.length === 0) return [];

	const existing = await db
		.select()
		.from(tag)
		.where(and(eq(tag.userId, userId), inArray(tag.name, uniqueNames)));

	const byName = new Map(existing.map((row) => [row.name.toLowerCase(), toTag(row)]));
	const created: Tag[] = [];

	for (const name of uniqueNames) {
		const current = byName.get(name.toLowerCase());
		if (current) {
			created.push(current);
			continue;
		}
		const slug = await uniqueSlug(userId, name);
		const [row] = await db.insert(tag).values({ userId, name, slug }).returning();
		const mapped = toTag(row);
		byName.set(name.toLowerCase(), mapped);
		created.push(mapped);
	}

	return created;
}

export async function createTag(userId: string, name: string): Promise<Tag> {
	const [created] = await findOrCreateTags(userId, [name]);
	if (!created) throw new Error('Failed to create tag');
	return created;
}

export async function updateTag(userId: string, id: string, name: string): Promise<Tag> {
	const existing = await db.query.tag.findFirst({
		where: and(eq(tag.id, id), eq(tag.userId, userId))
	});
	if (!existing) throw new Error('Tag not found');

	const slug = await uniqueSlug(userId, name, id);
	const [updated] = await db
		.update(tag)
		.set({ name: name.trim(), slug })
		.where(and(eq(tag.id, id), eq(tag.userId, userId)))
		.returning();

	return toTag(updated);
}

export async function deleteTag(userId: string, id: string): Promise<void> {
	const deleted = await db
		.delete(tag)
		.where(and(eq(tag.id, id), eq(tag.userId, userId)))
		.returning({ id: tag.id });

	if (deleted.length === 0) throw new Error('Tag not found');
}
