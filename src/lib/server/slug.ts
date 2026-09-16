export function slugify(value: string): string {
	const slug = value
		.toLowerCase()
		.trim()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return slug || 'item';
}
