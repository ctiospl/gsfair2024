import type { RequestHandler } from './$types';
import { db, log } from '$lib/server/db.js';
import { jsonArrayFrom } from '$lib/server/kyselyhelpers.js';
import { json, error } from '@sveltejs/kit';
import { auth } from '$lib/server/lucia.js';
import { LuciaError } from 'lucia';

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
		try {
			const user2 = await auth.updateUserAttributes(
				user.userId,
				{
					current_event_id: event.id,
					event_since: (Date.now() / 1000) | 0
				} // expects partial `Lucia.DatabaseUserAttributes`
			);
			console.log('user2 :>> ', user2);
		} catch (e) {
			console.log('e :>> ', e);
			if (e instanceof LuciaError && e.message === `AUTH_INVALID_USER_ID`) {
				// invalid user id
			}
			// provided user attributes violates database rules (e.g. unique constraint)
			// or unexpected database errors
		}

		// console.log('event :>> ', event);
		return json(event);
	} catch (e) {
		console.log('e :>> ', e);
		error(400, 'DB error');
	}
};
