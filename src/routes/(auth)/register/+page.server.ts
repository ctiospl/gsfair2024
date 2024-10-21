import { lucia } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { generateIdFromEntropySize } from 'lucia';
import { hash } from '@node-rs/argon2';
import { superValidate, setError, message } from 'sveltekit-superforms';
import type { Infer } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

import { authSchema } from '$lib/zod/schema';
import { db, sqlString } from '$lib/server/db';

import type { PageServerLoad, Actions } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { sql } from 'kysely';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) {
		if (await lucia.validateSession(locals.session.id)) {
			redirect(302, '/app');
		}
	}
	const form = await superValidate(zod(authSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const form = await superValidate(request, zod(authSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { username, password, firstname, lastname, email, phone } = form.data;
		// username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
		// keep in mind some database (e.g. mysql) are case insensitive
		try {
			const userId = generateIdFromEntropySize(10); // 16 characters long
			const passwordHash = await hash(password, {
				// recommended minimum parameters
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			await db
				.insertInto('users')
				.values({
					id: userId,
					username,
					firstname,
					lastname,
					email,
					phone,
					is_super_admin: 0,
					role: 'volunteer',
					password_hash: passwordHash
				})
				.execute();

			// const session = await lucia.createSession(userId, {});
			// const sessionCookie = lucia.createSessionCookie(session.id);
			// cookies.set(sessionCookie.name, sessionCookie.value, {
			// 	path: '.',
			// 	...sessionCookie.attributes
			// });
			setFlash(
				{
					type: 'success',
					message: 'User added successfully. Please wait for admin to approve your account.'
				},
				cookies
			);
			redirect(302, '/login');
		} catch (error) {
			if (error instanceof Error) {
				console.log('errorX :>> ', error);
				// setError(form, 'username', 'Invalid credentials');
				setError(form, 'username', error.message);
				setFlash({ type: 'error', message: error.message }, cookies);
			}
			return { form };
		}
		// redirect(302, '/app');
	}
};
