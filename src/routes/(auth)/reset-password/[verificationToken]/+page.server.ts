import { lucia } from '$lib/server/auth';
import { isWithinExpirationDate } from 'oslo';
import { TimeSpan, createDate } from 'oslo';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { generateIdFromEntropySize } from 'lucia';
import { fail, redirect } from '@sveltejs/kit';
import { hash } from '@node-rs/argon2';
import { superValidate, setError, message } from 'sveltekit-superforms';
import type { Infer } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { ZOHO_SEND_MAIL_TOKEN } from '$env/static/private';

import { newPasswordSchema } from '$lib/zod/schema';
import { db, sqlString } from '$lib/server/db';

import type { PageServerLoad, Actions } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';
import { sql } from 'kysely';

export const load: PageServerLoad = async ({ locals, params }) => {
	const form = await superValidate(zod(newPasswordSchema));
	const verificationToken = params.verificationToken;
	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(verificationToken)));
	try {
		const token = await db
			.selectFrom('password_reset_token')
			.select(['expires_at'])
			.where('token_hash', '=', tokenHash)
			.executeTakeFirstOrThrow();
		if (!token || !isWithinExpirationDate(token.expires_at)) {
			return { form, invalidtoken: true };
		}
		return { form, invalidtoken: false };
	} catch (error) {
		return { form, invalidtoken: true };
	}
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url, params }) => {
		const form = await superValidate(request, zod(newPasswordSchema));
		const verificationToken = params.verificationToken;
		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			const tokenHash = encodeHex(await sha256(new TextEncoder().encode(verificationToken)));
			const token = await db
				.selectFrom('password_reset_token')
				.select(['user_id', 'expires_at'])
				.where('token_hash', '=', tokenHash)
				.executeTakeFirstOrThrow();
			if (!token || !isWithinExpirationDate(token.expires_at)) {
				return { form, invalidtoken: true };
			}
			await db.deleteFrom('password_reset_token').where('token_hash', '=', tokenHash).execute();

			await lucia.invalidateUserSessions(token.user_id);

			const passwordHash = await hash(form.data.password, {
				// recommended minimum parameters
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			await db
				.updateTable('users')
				.set({
					password_hash: passwordHash
				})
				.where('id', '=', token.user_id)
				.$call(sqlString)
				.execute();

			setFlash(
				{
					type: 'success',
					message: 'Password has been changed successfully. Please login.'
				},
				cookies
			);
		} catch (error) {
			console.log('error :>> ', error);
			return { form, invalidtoken: true };
		}

		redirect(302, '/login');
	}
};
