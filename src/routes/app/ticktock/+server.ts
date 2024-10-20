import { lucia } from '$lib/server/auth';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({locals}) => {
    if (locals.session) {
        // const {session, user} = await lucia.validateSession(locals.session.id);
        // console.log('session :>> ', session);
        // console.log('user :>> ', user);
		if (await lucia.validateSession(locals.session.id)) {
			return json({ status: 'ok' });
		}
	}
    return json({ status: 'error' });
};
