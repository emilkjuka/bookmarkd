import { relations } from 'drizzle-orm';
import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export * from './auth.schema';

export const category = sqliteTable(
	'category',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		color: text('color'),
		urlPatterns: text('url_patterns'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index('category_user_idx').on(table.userId),
		uniqueIndex('category_user_slug_idx').on(table.userId, table.slug)
	]
);

export const tag = sqliteTable(
	'tag',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index('tag_user_idx').on(table.userId),
		uniqueIndex('tag_user_slug_idx').on(table.userId, table.slug)
	]
);

export const bookmark = sqliteTable(
	'bookmark',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		url: text('url').notNull(),
		title: text('title').notNull(),
		description: text('description'),
		faviconUrl: text('favicon_url'),
		imageUrl: text('image_url'),
		notes: text('notes'),
		categoryId: text('category_id').references(() => category.id, { onDelete: 'set null' }),
		pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
		pinnedAt: integer('pinned_at', { mode: 'timestamp_ms' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [
		index('bookmark_user_idx').on(table.userId),
		index('bookmark_category_idx').on(table.categoryId),
		uniqueIndex('bookmark_user_url_idx').on(table.userId, table.url)
	]
);

export const bookmarkTag = sqliteTable(
	'bookmark_tag',
	{
		bookmarkId: text('bookmark_id')
			.notNull()
			.references(() => bookmark.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' })
	},
	(table) => [
		primaryKey({ columns: [table.bookmarkId, table.tagId] }),
		index('bookmark_tag_tag_idx').on(table.tagId)
	]
);

export const categoryRelations = relations(category, ({ one, many }) => ({
	user: one(user, { fields: [category.userId], references: [user.id] }),
	bookmarks: many(bookmark)
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
	user: one(user, { fields: [tag.userId], references: [user.id] }),
	bookmarkTags: many(bookmarkTag)
}));

export const bookmarkRelations = relations(bookmark, ({ one, many }) => ({
	user: one(user, { fields: [bookmark.userId], references: [user.id] }),
	category: one(category, { fields: [bookmark.categoryId], references: [category.id] }),
	bookmarkTags: many(bookmarkTag)
}));

export const bookmarkTagRelations = relations(bookmarkTag, ({ one }) => ({
	bookmark: one(bookmark, { fields: [bookmarkTag.bookmarkId], references: [bookmark.id] }),
	tag: one(tag, { fields: [bookmarkTag.tagId], references: [tag.id] })
}));
