import { z } from 'zod';

// Shared between the client-side preflight and the server `form` remote function
// so validation rules stay identical on both sides.
export const loginSchema = z.strictObject({
	email: z.email('Email không hợp lệ'),
	password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự')
});

export type LoginInput = z.infer<typeof loginSchema>;
