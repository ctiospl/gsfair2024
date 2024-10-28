import type { RequestHandler } from './$types';
import { db, log } from '$lib/server/db.js';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	console.log('object');
	return new Response();
};
export const POST: RequestHandler = async ({ params, locals }) => {
	const { master_user_id } = params;
	const session = await locals.auth.validate();
	const { user } = session;
	const volunteer_id = user.userId;
	const event_id = user.eventId ?? 0;

	// get all user ids under this master_user_id
	// if user has balance then transfer to master_user_id
	// update group_qr=1 for all users under this master_user_id

	try {
		const timestamp = (Date.now() / 1000) | 0;

		await db
			.updateTable('visitor_registration')
			.set({ group_qr: 0 })
			.where('master_user_id', '=', master_user_id)
			.executeTakeFirstOrThrow();

		// return balance;

		return json({
			text: "Visitors' QrCodes Un-Grouped Successful. All visitor now have their own balances."
		});
		// console.log('balances :>> ', balances);
	} catch (e) {
		throw error(400, 'Error: ' + e.message);
	}
	return new Response();
};
