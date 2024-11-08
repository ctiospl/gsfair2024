import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db.js';

export const load = (async ({params}) => {
    const master_user_id = Number(params.uid);
	const userData = await db
		.selectFrom('visitor_registration')
		.where('master_user_id', '=', master_user_id)
		.select(['name', 'uid'])
		.execute();
	return { userData };
}) satisfies PageServerLoad;
