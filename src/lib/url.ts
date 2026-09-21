/** Add http:// when the user pastes a bare hostname or IP (e.g. 192.168.1.5/path). */
export function normalizeUrlInput(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return trimmed;
	if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
	return `http://${trimmed}`;
}

export function hostnameFromUrl(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}
