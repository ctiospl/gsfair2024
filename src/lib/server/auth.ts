import { Lucia, TimeSpan } from 'lucia';

import { adapter } from './db.js';
import { dev } from '$app/environment';

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
