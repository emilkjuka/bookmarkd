import { and, asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { category } from '#lib/server/db/schema';
import { slugify } from '#lib/server/slug';
import {
	decodeUrlPatterns,
	parseUrlPatterns,
	serializeUrlPatterns,
	urlMatchesAnyPattern
} from '#lib/url-patterns';
import type { Category } from '#lib/types';

async function uniqueSlug(userId: string, name: string, excludeId?: string): Promise<string> {
	const base = slugify(name);
	let candidate = base;
	let n = 1;

	while (true) {
		const existing = await db.query.category.findFirst({
			where: and(eq(category.userId, userId), eq(category.slug, candidate))
		});
		if (!existing || existing.id === excludeId) return candidate;
		n += 1;
		candidate = `${base}-${n}`;
	}
}

function toCategory(row: typeof category.$inferSelect): Category {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		color: row.color,
		urlPatterns: decodeUrlPatterns(row.urlPatterns)
	};
}

export async function listCategories(userId: string): Promise<Category[]> {
	const rows = await db
		.select()
		.from(category)
		.where(eq(category.userId, userId))
		.orderBy(asc(category.name));
	return rows.map(toCategory);
}

export async function getCategoryBySlug(userId: string, slug: string): Promise<Category | null> {
	const row = await db.query.category.findFirst({
		where: and(eq(category.userId, userId), eq(category.slug, slug))
	});
	return row ? toCategory(row) : null;
}

export async function matchCategoryForUrl(userId: string, url: string): Promise<Category | null> {
	const categories = await listCategories(userId);
	for (const item of categories) {
		if (item.urlPatterns.length > 0 && urlMatchesAnyPattern(url, item.urlPatterns)) {
			return item;
		}
	}
	return null;
}

export async function findOrCreateCategory(userId: string, name: string): Promise<Category> {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Category name is required');

	const rows = await db.select().from(category).where(eq(category.userId, userId));
	const existing = rows.find((row) => row.name.toLowerCase() === trimmed.toLowerCase());
	if (existing) return toCategory(existing);

	return createCategory(userId, { name: trimmed });
}

export async function createCategory(
	userId: string,
	input: { name: string; color?: string | null; urlPatterns?: string | null }
): Promise<Category> {
	const slug = await uniqueSlug(userId, input.name);
	const [created] = await db
		.insert(category)
		.values({
			userId,
			name: input.name.trim(),
			slug,
			color: input.color || null,
			urlPatterns: serializeUrlPatterns(parseUrlPatterns(input.urlPatterns))
		})
		.returning();
	return toCategory(created);
}

export async function updateCategory(
	userId: string,
	id: string,
	input: { name: string; color?: string | null; urlPatterns?: string | null }
): Promise<Category> {
	const existing = await db.query.category.findFirst({
		where: and(eq(category.id, id), eq(category.userId, userId))
	});
	if (!existing) throw new Error('Category not found');

	const slug = await uniqueSlug(userId, input.name, id);
	const [updated] = await db
		.update(category)
		.set({
			name: input.name.trim(),
			slug,
			color: input.color || null,
			urlPatterns: serializeUrlPatterns(parseUrlPatterns(input.urlPatterns))
		})
		.where(and(eq(category.id, id), eq(category.userId, userId)))
		.returning();

	return toCategory(updated);
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
	const deleted = await db
		.delete(category)
		.where(and(eq(category.id, id), eq(category.userId, userId)))
		.returning({ id: category.id });

	if (deleted.length === 0) throw new Error('Category not found');
}
