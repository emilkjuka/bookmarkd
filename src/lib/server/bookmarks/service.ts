import { and, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { bookmark, bookmarkTag, category, tag } from '#lib/server/db/schema';
import { fetchPageMetadata } from '#lib/server/bookmarks/metadata';
import { findOrCreateCategory, matchCategoryForUrl } from '#lib/server/categories/service';
import { findOrCreateTags } from '#lib/server/tags/service';
import { decodeUrlPatterns } from '#lib/url-patterns';
import type { Bookmark, Category, Tag } from '#lib/types';

export type BookmarkFilters = {
	q?: string;
	categorySlug?: string;
	tagSlug?: string;
	pinned?: boolean;
	limit?: number;
	offset?: number;
};

export type BookmarkWriteInput = {
	url: string;
	title?: string;
	description?: string;
	notes?: string;
	categoryId?: string | null;
	newCategory?: string;
	tagIds?: string[];
	newTags?: string[];
};

function sanitizeLike(value: string): string {
	return value.replace(/[%_]/g, '');
}

async function getOwnedCategory(userId: string, categoryId: string | null | undefined) {
	if (!categoryId) return null;
	const row = await db.query.category.findFirst({
		where: and(eq(category.id, categoryId), eq(category.userId, userId))
	});
	return row ?? null;
}

async function getOwnedTags(userId: string, tagIds: string[]): Promise<Tag[]> {
	if (tagIds.length === 0) return [];
	const rows = await db
		.select({ id: tag.id, name: tag.name, slug: tag.slug })
		.from(tag)
		.where(and(eq(tag.userId, userId), inArray(tag.id, tagIds)));
	return rows;
}

async function setBookmarkTags(bookmarkId: string, tags: Tag[]) {
	await db.delete(bookmarkTag).where(eq(bookmarkTag.bookmarkId, bookmarkId));
	if (tags.length === 0) return;
	await db.insert(bookmarkTag).values(tags.map((item) => ({ bookmarkId, tagId: item.id })));
}

async function hydrateBookmarks(rows: (typeof bookmark.$inferSelect)[]): Promise<Bookmark[]> {
	if (rows.length === 0) return [];

	const bookmarkIds = rows.map((row) => row.id);
	const categoryIds = rows
		.map((row) => row.categoryId)
		.filter((id): id is string => typeof id === 'string');

	const [categories, tagRows] = await Promise.all([
		categoryIds.length
			? db
					.select({
						id: category.id,
						name: category.name,
						slug: category.slug,
						color: category.color,
						urlPatterns: category.urlPatterns
					})
					.from(category)
					.where(inArray(category.id, categoryIds))
			: Promise.resolve([] as Category[]),
		db
			.select({
				bookmarkId: bookmarkTag.bookmarkId,
				id: tag.id,
				name: tag.name,
				slug: tag.slug
			})
			.from(bookmarkTag)
			.innerJoin(tag, eq(bookmarkTag.tagId, tag.id))
			.where(inArray(bookmarkTag.bookmarkId, bookmarkIds))
	]);

	const categoryById = new Map(
		categories.map((item) => [
			item.id,
			{
				id: item.id,
				name: item.name,
				slug: item.slug,
				color: item.color,
				urlPatterns: decodeUrlPatterns(item.urlPatterns as string | null)
			} satisfies Category
		])
	);
	const tagsByBookmark = new Map<string, Tag[]>();
	for (const row of tagRows) {
		const list = tagsByBookmark.get(row.bookmarkId) ?? [];
		list.push({ id: row.id, name: row.name, slug: row.slug });
		tagsByBookmark.set(row.bookmarkId, list);
	}

	return rows.map((row) => ({
		id: row.id,
		url: row.url,
		title: row.title,
		description: row.description,
		faviconUrl: row.faviconUrl,
		imageUrl: row.imageUrl,
		notes: row.notes,
		categoryId: row.categoryId,
		pinned: row.pinned,
		pinnedAt: row.pinnedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		category: row.categoryId ? (categoryById.get(row.categoryId) ?? null) : null,
		tags: tagsByBookmark.get(row.id) ?? []
	}));
}

async function resolveCategoryId(
	userId: string,
	categoryId: string | null | undefined,
	newCategory?: string
): Promise<string | null> {
	if (newCategory?.trim()) {
		const created = await findOrCreateCategory(userId, newCategory);
		return created.id;
	}
	const owned = await getOwnedCategory(userId, categoryId);
	return owned?.id ?? null;
}

async function resolveTags(userId: string, tagIds: string[] = [], newTags: string[] = []) {
	const [owned, created] = await Promise.all([
		getOwnedTags(userId, tagIds),
		findOrCreateTags(userId, newTags)
	]);
	const merged = new Map<string, Tag>();
	for (const item of [...owned, ...created]) merged.set(item.id, item);
	return [...merged.values()];
}

export async function listBookmarks(
	userId: string,
	filters: BookmarkFilters = {}
): Promise<Bookmark[]> {
	const conditions = [eq(bookmark.userId, userId)];
	const query = filters.q?.trim();

	if (query) {
		const term = `%${sanitizeLike(query)}%`;
		conditions.push(
			or(
				like(bookmark.title, term),
				like(bookmark.description, term),
				like(bookmark.url, term),
				like(bookmark.notes, term)
			)!
		);
	}

	if (filters.categorySlug) {
		const ownedCategory = await db.query.category.findFirst({
			where: and(eq(category.userId, userId), eq(category.slug, filters.categorySlug))
		});
		if (!ownedCategory) return [];
		conditions.push(eq(bookmark.categoryId, ownedCategory.id));
	}

	if (filters.tagSlug) {
		const ownedTag = await db.query.tag.findFirst({
			where: and(eq(tag.userId, userId), eq(tag.slug, filters.tagSlug))
		});
		if (!ownedTag) return [];
		const tagged = await db
			.select({ bookmarkId: bookmarkTag.bookmarkId })
			.from(bookmarkTag)
			.where(eq(bookmarkTag.tagId, ownedTag.id));
		if (tagged.length === 0) return [];
		conditions.push(
			inArray(
				bookmark.id,
				tagged.map((row) => row.bookmarkId)
			)
		);
	}

	if (filters.pinned !== undefined) {
		conditions.push(eq(bookmark.pinned, filters.pinned));
	}

	const rows = await db
		.select()
		.from(bookmark)
		.where(and(...conditions))
		.orderBy(
			filters.pinned ? desc(bookmark.pinnedAt) : desc(bookmark.createdAt)
		)
		.limit(filters.limit ?? 200)
		.offset(filters.offset ?? 0);

	return hydrateBookmarks(rows);
}

export async function getBookmark(userId: string, id: string): Promise<Bookmark | null> {
	const row = await db.query.bookmark.findFirst({
		where: and(eq(bookmark.id, id), eq(bookmark.userId, userId))
	});
	if (!row) return null;
	const [hydrated] = await hydrateBookmarks([row]);
	return hydrated ?? null;
}

export async function createBookmark(
	userId: string,
	input: BookmarkWriteInput,
	fetchFn?: typeof fetch
): Promise<Bookmark> {
	const metadata = await fetchPageMetadata(input.url, fetchFn);
	let categoryId: string | null;
	if (input.newCategory?.trim()) {
		categoryId = await resolveCategoryId(userId, null, input.newCategory);
	} else if (input.categoryId) {
		categoryId = await resolveCategoryId(userId, input.categoryId);
	} else {
		const matched = await matchCategoryForUrl(userId, metadata.url);
		categoryId = matched?.id ?? null;
	}
	const tags = await resolveTags(userId, input.tagIds, input.newTags);
	const now = new Date();

	try {
		const [created] = await db
			.insert(bookmark)
			.values({
				userId,
				url: metadata.url,
				title: input.title?.trim() || metadata.title,
				description: input.description?.trim() || metadata.description,
				faviconUrl: metadata.faviconUrl,
				imageUrl: metadata.imageUrl,
				notes: input.notes?.trim() || null,
				categoryId,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		await setBookmarkTags(created.id, tags);
		const saved = await getBookmark(userId, created.id);
		if (!saved) throw new Error('Failed to save bookmark');
		return saved;
	} catch (error) {
		if (error instanceof Error && /UNIQUE/i.test(error.message)) {
			throw new Error('You already saved this URL', { cause: error });
		}
		throw error;
	}
}

export async function updateBookmark(
	userId: string,
	id: string,
	input: BookmarkWriteInput
): Promise<Bookmark> {
	const existing = await db.query.bookmark.findFirst({
		where: and(eq(bookmark.id, id), eq(bookmark.userId, userId))
	});
	if (!existing) throw new Error('Bookmark not found');

	const categoryId = await resolveCategoryId(userId, input.categoryId, input.newCategory);
	const tags = await resolveTags(userId, input.tagIds, input.newTags);
	const metadata = input.url !== existing.url ? await fetchPageMetadata(input.url) : null;

	try {
		await db
			.update(bookmark)
			.set({
				url: metadata?.url ?? input.url,
				title: input.title?.trim() || metadata?.title || existing.title,
				description: input.description?.trim() || metadata?.description || existing.description,
				faviconUrl: metadata?.faviconUrl ?? existing.faviconUrl,
				imageUrl: metadata?.imageUrl ?? existing.imageUrl,
				notes: input.notes?.trim() || null,
				categoryId,
				updatedAt: new Date()
			})
			.where(and(eq(bookmark.id, id), eq(bookmark.userId, userId)));
	} catch (error) {
		if (error instanceof Error && /UNIQUE/i.test(error.message)) {
			throw new Error('You already saved this URL', { cause: error });
		}
		throw error;
	}

	await setBookmarkTags(id, tags);
	const saved = await getBookmark(userId, id);
	if (!saved) throw new Error('Bookmark not found');
	return saved;
}

export async function deleteBookmark(userId: string, id: string): Promise<void> {
	const deleted = await db
		.delete(bookmark)
		.where(and(eq(bookmark.id, id), eq(bookmark.userId, userId)))
		.returning({ id: bookmark.id });

	if (deleted.length === 0) throw new Error('Bookmark not found');
}

export async function toggleBookmarkPin(userId: string, id: string): Promise<Bookmark> {
	const existing = await db.query.bookmark.findFirst({
		where: and(eq(bookmark.id, id), eq(bookmark.userId, userId))
	});
	if (!existing) throw new Error('Bookmark not found');

	const pinned = !existing.pinned;
	await db
		.update(bookmark)
		.set({
			pinned,
			pinnedAt: pinned ? new Date() : null,
			updatedAt: new Date()
		})
		.where(and(eq(bookmark.id, id), eq(bookmark.userId, userId)));

	const saved = await getBookmark(userId, id);
	if (!saved) throw new Error('Bookmark not found');
	return saved;
}
