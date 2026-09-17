import { parseHTML } from 'linkedom';
import type { PageMetadata } from '#lib/types';

const USER_AGENT = 'Mozilla/5.0 (compatible; Bookmarkd/0.1; +https://github.com)';
const TIMEOUT_MS = 5000;

function isPrivateHost(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
	if (
		host === 'localhost' ||
		host.endsWith('.localhost') ||
		host === '127.0.0.1' ||
		host === '::1' ||
		host === '0.0.0.0' ||
		host.endsWith('.local') ||
		host.endsWith('.internal')
	) {
		return true;
	}

	return (
		/^10\./.test(host) ||
		/^192\.168\./.test(host) ||
		/^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
		/^169\.254\./.test(host) ||
		/^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./.test(host)
	);
}

function googleFavicon(origin: string): string {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=64`;
}

function attr(
	el: {
		querySelector: (selector: string) => { getAttribute: (name: string) => string | null } | null;
	},
	selector: string
): string | null {
	return el.querySelector(selector)?.getAttribute('content')?.trim() || null;
}

function resolveUrl(value: string, base: string): string | null {
	try {
		return new URL(value, base).href;
	} catch {
		return null;
	}
}

export async function fetchPageMetadata(
	rawUrl: string,
	fetchFn: typeof fetch = fetch
): Promise<PageMetadata> {
	const parsed = new URL(rawUrl);
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new Error('URL must start with http:// or https://');
	}
	if (isPrivateHost(parsed.hostname)) {
		throw new Error('That URL cannot be fetched');
	}

	const fallback: PageMetadata = {
		url: parsed.href,
		title: parsed.hostname.replace(/^www\./, ''),
		description: null,
		faviconUrl: googleFavicon(parsed.origin),
		imageUrl: null
	};

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const response = await fetchFn(parsed.href, {
			signal: controller.signal,
			headers: {
				'User-Agent': USER_AGENT,
				Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
			},
			redirect: 'follow'
		});

		if (!response.ok) return fallback;

		const html = await response.text();
		const { document } = parseHTML(html);
		const base = response.url || parsed.href;

		const title =
			attr(document, 'meta[property="og:title"]') ||
			attr(document, 'meta[name="twitter:title"]') ||
			document.querySelector('title')?.textContent?.trim() ||
			fallback.title;

		const description =
			attr(document, 'meta[property="og:description"]') ||
			attr(document, 'meta[name="description"]') ||
			attr(document, 'meta[name="twitter:description"]');

		const iconHref =
			document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
			document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
			document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href');

		const faviconUrl = iconHref
			? (resolveUrl(iconHref, base) ?? `${new URL(base).origin}/favicon.ico`)
			: `${new URL(base).origin}/favicon.ico`;

		const imageRaw =
			attr(document, 'meta[property="og:image"]') ||
			attr(document, 'meta[name="twitter:image"]') ||
			attr(document, 'meta[property="twitter:image"]');
		const imageUrl = imageRaw ? resolveUrl(imageRaw, base) : null;

		return {
			url: parsed.href,
			title: title.slice(0, 500),
			description: description ? description.slice(0, 2000) : null,
			faviconUrl,
			imageUrl
		};
	} catch {
		return fallback;
	} finally {
		clearTimeout(timeout);
	}
}
