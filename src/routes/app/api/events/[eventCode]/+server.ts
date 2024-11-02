import type { RequestHandler } from './$types';
import { db, log } from '$lib/server/db.js';
import { jsonArrayFrom } from '$lib/server/kyselyhelpers.js';
import { json, error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		// show login page
	}
	const { eventCode } = params;
	try {
		let event = await db
			.selectFrom('category_events as ce')
			.where('ce.event_code', '=', eventCode)
			.selectAll('ce')
			.select((eb) => [
				jsonArrayFrom(
					eb
						.selectFrom('event_items as ei')
						.select(['id', 'item_code', 'item_name', 'price'])
						.whereRef('ei.event_id', '=', 'ce.id')
						.orderBy('ei.id')
				).as('event_items')
			])
			// .$call(log)
			.executeTakeFirstOrThrow();
		// console.log('event :>> ', event);
		return json(event);
	} catch (e) {
		console.log('e :>> ', e);
		throw error(400, 'DB error');
	}
};
