import type { Actions, PageServerLoad } from './$types';
import { db, sqlString } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import { message, setError, superValidate } from 'sveltekit-superforms';

import type { Infer } from 'sveltekit-superforms';
import { loginSchema } from '$lib/zod/schema';
import { lucia } from '$lib/server/auth';
import { setFlash } from 'sveltekit-flash-message/server';
import { sql } from 'kysely';
import { verify } from '@node-rs/argon2';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) {
		if (await lucia.validateSession(locals.session.id)) {
			redirect(302, '/app');
		}
	}
	const form = await superValidate(zod(loginSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const form = await superValidate(request, zod(loginSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		// basic check
		try {
			const existingUser = await db
				.selectFrom('users')
				.select(['id', 'username', 'firstname', 'lastname', 'approved', 'password_hash'])
				.where('username', '=', form.data.username)
				.limit(1)
				// .$call(sqlString)
				.executeTakeFirstOrThrow();
			// console.log('user :>> ', user);
			const isApproved = existingUser.approved;
			if (!isApproved) {
				setError(
					form,
					'username',
					'Your account is not approved yet. Please wait for admin to approve your account.'
				);
				setFlash(
					{
						type: 'error',
						message: {
							title: 'Account not approved',
							text: 'Your account is not approved yet. Please wait for admin to approve your account.'
						}
					},
					cookies
				);
				return { form };
			}

            if (!existingUser.password_hash) {
                // throw new Error('Invalid password hash');
                setFlash(
                    {
                        type: 'error',
                        message: {
                            title: 'Invalid username or password',
                            text: 'Invalid username or password'
                        }
                    },
                    cookies
                );
				return { form };
			}

			const validPassword = await verify(existingUser.password_hash, form.data.password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
			if (!validPassword) {
				// setError(form, 'username', 'Invalid username or password');
				setFlash(
					{
						type: 'error',
						message: {
							title: 'Invalid username or password',
							text: 'Invalid username or password'
						}
					},
					cookies
				);
				return { form };
			}

			const session = await lucia.createSession(existingUser.id, { country: 'IN' });
            console.log('session :>> ', session);
			const sessionCookie = lucia.createSessionCookie(session.id);
            const { session: sessionX, user } = await lucia.validateSession(session.id);
            console.log('sessionX :>> ', sessionX);
            console.log('user :>> ', user);
            console.log('sessionCookie :>> ', sessionCookie);
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
            console.log('cookies :>> ', cookies.get(sessionCookie.name));
		} catch (error) {
			console.log('errorX :>> ', error);
			setFlash(
				{
					type: 'error',
					message: {
						title: 'Invalid username or password',
						text: 'Invalid username or password'
					}
				},
				cookies
			);
			return { form };
		}
		setFlash(
			{
				type: 'success',
				message: {
					title: 'Login successful',
					text: 'Login successful'
				}
			},
			cookies
		);
		redirect(302, '/app');
	}
};
