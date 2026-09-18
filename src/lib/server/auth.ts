import { ORIGIN, BETTER_AUTH_SECRET } from '$app/env/private';
import { dev } from '$app/env';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db';

function normalizeOrigin(value: string): string {
	return value
		.trim()
		.replace(/^["']|["']$/g, '')
		.replace(/\/$/, '');
}

const productionOrigin = dev ? '' : normalizeOrigin(ORIGIN);

if (!dev && !productionOrigin) {
	throw new Error('ORIGIN must be set in production');
}

export const auth = betterAuth({
	// Dev: derive base URL from each request (localhost, LAN IP, etc.)
	...(dev ? {} : { baseURL: productionOrigin }),
	secret: BETTER_AUTH_SECRET,
	trustedOrigins: dev ? ['http://*', 'https://*'] : [productionOrigin],
	advanced: dev ? { disableOriginCheck: true } : {},
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	user: {
		changeEmail: {
			enabled: true,
			updateEmailWithoutVerification: true
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // must be the last plugin in the array
	]
});
