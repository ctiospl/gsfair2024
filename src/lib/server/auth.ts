import { Lucia, TimeSpan } from 'lucia';
import { dev } from '$app/environment';
import crypto from 'node:crypto';

import { pool, adapter } from './db.js';


export const lucia = new Lucia(adapter, {
	sessionCookie: {
		expires: true,
		attributes: {
			secure: !dev
		}
	},

	getUserAttributes: (data) => {
		return {
			id: data.id,
			username: data.username,
			firstname: data.firstname,
			lastname: data.lastname,
			email: data.email,
			phone: data.phone,
			is_super_admin: data.is_super_admin,
			role: data.role,
			current_event_id: data.current_event_id,
            approved: data.approved
		};
	},
	sessionExpiresIn: new TimeSpan(2, 'h')
});


declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseSessionAttributes: DatabaseSessionAttributes;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseSessionAttributes {
	country: string;
}

interface DatabaseUserAttributes {
	id: string;
	username: string;
	firstname: string;
	lastname: string;
	email: string;
	phone: string;
	is_super_admin: boolean;
	role: string;
	current_event_id: number;
    approved: number;
}


/*
const user = await db('fry_users')
			.select(['username', 'userfirstname', 'userlastname', 'token', 'userpass', 'salt'])
			.where('username', '=', username)
			.limit(1);

		if (user.length && generatePasswordHash(password, user[0].salt) === user[0].userpass) {
			const jwt = await getNewJWT(user[0]);
			cookies.set('jwt', jwt, {path: '/', httpOnly: true});

			throw redirect(303, prevUrl);
		} else {
			return fail(401, { error: 'Invalid Credentials... Login failed...' });
		}

**/
