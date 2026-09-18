/** Allow only same-app relative redirects after login. */
export function safeRedirectPath(path: string | null | undefined): string {
	if (!path || !path.startsWith('/') || path.startsWith('//')) return '/bookmarks';
	return path;
}
