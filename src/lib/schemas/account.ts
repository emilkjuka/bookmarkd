import * as v from 'valibot';

export const updateProfileSchema = v.object({
	name: v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, 'Name is required'),
		v.maxLength(100)
	)
});

export const changeEmailSchema = v.object({
	email: v.pipe(v.string(), v.trim(), v.email('Enter a valid email'))
});

export const changePasswordSchema = v.pipe(
	v.object({
		currentPassword: v.pipe(v.string(), v.minLength(1, 'Current password is required')),
		newPassword: v.pipe(v.string(), v.minLength(8, 'Password must be at least 8 characters')),
		confirmPassword: v.pipe(v.string(), v.minLength(1, 'Confirm your new password'))
	}),
	v.forward(
		v.partialCheck(
			[['newPassword'], ['confirmPassword']],
			(input) => input.newPassword === input.confirmPassword,
			'Passwords do not match'
		),
		['confirmPassword']
	)
);
