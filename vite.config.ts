import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import { iconify } from './plugins/iconify.ts';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	// Docker build sets ORIGIN via ENV / .env.production (.env is dockerignored)
	const origin = (process.env.ORIGIN || env.ORIGIN)?.replace(/\/$/, '');
	const disableCsrf = process.env.DISABLE_CSRF === 'true';

	if (mode === 'production') {
		if (origin) {
			console.log(`[vite] paths.origin = ${origin}`);
		} else if (!disableCsrf) {
			console.warn(
				'[vite] ORIGIN is not set — CSRF origin checks will fail unless DISABLE_CSRF=true'
			);
		}
	}

	return {
		plugins: [
			tailwindcss(),
			sveltekit({
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
					experimental: { async: true }
				},
				paths: {
					origin: origin || undefined
				},
				// Private self-host only: set DISABLE_CSRF=true in .env if POST requests still 403
				csrf: disableCsrf ? { trustedOrigins: ['*'] } : undefined,
				adapter: adapter({ out: 'build' }),
				experimental: { remoteFunctions: true }
			}),
			iconify({ iconSets: ['lucide'] })
		]
	};
});
