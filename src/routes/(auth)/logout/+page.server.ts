import { lucia } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {

	if (!locals.session) {
		redirect(302, '/login');
	} else {
		await lucia.invalidateUserSessions(locals.session.userId);
		redirect(302, '/login');
	}
};
