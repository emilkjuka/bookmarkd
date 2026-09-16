import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import {
	changeEmailSchema,
	changePasswordSchema,
	updateProfileSchema
} from '#lib/schemas/account';
import { auth } from '#lib/server/auth';
import { firstZodError, formString } from '#lib/server/form';

function authError(error: unknown, fallback: string, intent: 'profile' | 'email' | 'password') {
	if (error instanceof APIError) {
		return fail(400, { message: error.message || fallback, intent });
	}
	return fail(500, { message: 'Unexpected error', intent });
}

export async function updateProfileAction(event: RequestEvent) {
	if (!event.locals.user) {
		return fail(401, { message: 'Unauthorized', intent: 'profile' as const });
	}

	const parsed = updateProfileSchema.safeParse({
		name: formString(await event.request.formData(), 'name')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'profile' as const });
	}

	try {
		await auth.api.updateUser({
			body: { name: parsed.data.name },
			headers: event.request.headers
		});
		return { saved: true, intent: 'profile' as const };
	} catch (error) {
		return authError(error, 'Could not update profile', 'profile');
	}
}

export async function changeEmailAction(event: RequestEvent) {
	if (!event.locals.user) {
		return fail(401, { message: 'Unauthorized', intent: 'email' as const });
	}

	const parsed = changeEmailSchema.safeParse({
		email: formString(await event.request.formData(), 'email')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'email' as const });
	}

	if (parsed.data.email.toLowerCase() === event.locals.user.email.toLowerCase()) {
		return fail(400, { message: 'Email is unchanged', intent: 'email' as const });
	}

	try {
		await auth.api.changeEmail({
			body: { newEmail: parsed.data.email },
			headers: event.request.headers
		});
		return { saved: true, intent: 'email' as const };
	} catch (error) {
		return authError(error, 'Could not update email', 'email');
	}
}

export async function changePasswordAction(event: RequestEvent) {
	if (!event.locals.user) {
		return fail(401, { message: 'Unauthorized', intent: 'password' as const });
	}

	const data = await event.request.formData();
	const parsed = changePasswordSchema.safeParse({
		currentPassword: formString(data, 'currentPassword'),
		newPassword: formString(data, 'newPassword'),
		confirmPassword: formString(data, 'confirmPassword')
	});
	if (!parsed.success) {
		return fail(400, { message: firstZodError(parsed.error), intent: 'password' as const });
	}

	try {
		await auth.api.changePassword({
			body: {
				currentPassword: parsed.data.currentPassword,
				newPassword: parsed.data.newPassword
			},
			headers: event.request.headers
		});
		return { saved: true, intent: 'password' as const };
	} catch (error) {
		return authError(error, 'Could not change password', 'password');
	}
}

export const accountFormActions = {
	updateProfile: updateProfileAction,
	changeEmail: changeEmailAction,
	changePassword: changePasswordAction
};
