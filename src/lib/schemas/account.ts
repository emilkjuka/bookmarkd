import { z } from 'zod';

export const updateProfileSchema = z.object({
	name: z.string().trim().min(1, 'Name is required').max(100)
});

export const changeEmailSchema = z.object({
	email: z.string().trim().email('Enter a valid email')
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string().min(1, 'Confirm your new password')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});
