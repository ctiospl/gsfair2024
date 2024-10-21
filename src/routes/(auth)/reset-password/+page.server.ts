import { lucia } from '$lib/server/auth';
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

import { resetAuthSchema } from '$lib/zod/schema';
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
	const form = await superValidate(zod(resetAuthSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url }) => {
		const form = await superValidate(request, zod(resetAuthSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { phone } = form.data;
		// username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
		// keep in mind some database (e.g. mysql) are case insensitive
		try {
			const user = await db
				.selectFrom('users')
				.select([
					'id',
					'username',
					'firstname',
					'lastname',
					'email',
					'phone',
					'is_super_admin',
					'role',
					'current_event_id',
					'approved'
				])
				.where('phone', '=', phone)
				.limit(1)
				.executeTakeFirstOrThrow();
			console.log('user :>> ', user);
			const userId = user.id;

			const verificationToken = await createPasswordResetToken(userId);
			// const url = new URL($page.url);
			// const domainUrl = url.origin;
			const verificationLink = url.origin + '/reset-password/' + verificationToken;
			console.log('verificationLink :>> ', verificationLink);

			await sendPasswordResetToken(user, verificationLink);

			setFlash(
				{
					type: 'success',
					message: 'Login instructions have been sent to your registered email.'
				},
				cookies
			);
		} catch (error) {
			if (error instanceof Error) {
				console.log('errorX :>> ', error);
				// setError(form, 'username', 'Invalid credentials');
				setFlash({ type: 'error', message: error.message }, cookies);
			}
			return { form };
		}
		redirect(302, '/login');
		// redirect(302, '/app');
	}
};

async function createPasswordResetToken(userId: string): Promise<string> {
	// optionally invalidate all existing tokens
	await db.deleteFrom('password_reset_token').where('user_id', '=', userId).execute();
	const tokenId = generateIdFromEntropySize(25); // 40 character
	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));
	await db
		.insertInto('password_reset_token')
		.values({
			token_hash: tokenHash,
			user_id: userId,
			expires_at: createDate(new TimeSpan(2, 'h'))
		})
		.execute();
	return tokenId;
}

async function sendPasswordResetToken(user: any, verificationLink: string) {
	try {
		const response = await fetch('https://api.zeptomail.in/v1.1/email', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: ZOHO_SEND_MAIL_TOKEN
			},
			body: JSON.stringify({
				from: {
					address: 'noreply@goldenspiralfair.com'
				},
				to: [
					{
						email_address: {
							address: user.email,
							name: `${user.firstname} ${user.lastname}`
						}
					}
				],
				subject: 'Reset Password - GS Fair 2024',
				htmlbody: `<div>
                            Hello <br>
                            Your username is <b>${user.username}</b><br>
                            <br>
                            Please click on the link below if you need to reset your password.<br>
                            <br>
                            <a href="${verificationLink}">Reset Password</a><br>
                            <br>
                            If you did not request this, please ignore this email.<br>
                            <br>
                        </div>`
			})
		});
		const data = await response.json();
	} catch (error) {
		console.error('There was an error sending the email:', error);
	}
}
