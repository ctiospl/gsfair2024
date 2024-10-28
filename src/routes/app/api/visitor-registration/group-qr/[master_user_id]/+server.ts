import type { RequestHandler } from './$types';
import { db, log } from '$lib/server/db.js';
import { error, json } from '@sveltejs/kit';
import { sql } from 'kysely';

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
		const transactionBuilder = db.transaction();
		await transactionBuilder.execute(async (transaction) => {
			const visitors = await transaction
				.selectFrom('visitor_registration as vr')
				.where('master_user_id', '=', master_user_id)
				.where('id', '!=', master_user_id)
				.select('id')
				.select((eb) =>
					eb
						.selectFrom('transaction_log')
						.whereRef('visitor_id', '=', 'vr.id')
						.select((eb) => eb.fn('ifnull', [eb.fn.sum('trx_amount'), sql`0`]))
						.as('balance_amount')
				)
				.execute();
            console.log('visitors :>> ', visitors);
			for (let index = 0; index < visitors.length; index++) {
				const visitor = visitors[index];
				if (visitor.balance_amount > 0) {
					const { id: log_ref_id } = await transaction
						.insertInto('transaction_log')
						.values({
							volunteer_id,
							visitor_id: visitor.id,
							trx_ts: timestamp,
							trx_amount: -visitor.balance_amount,
							notes: 'transfer',
							event_id
						})
						.returning(['id'])
						.executeTakeFirstOrThrow();

					const { id: transfer_id } = await transaction
						.insertInto('transaction_log')
						.values({
							volunteer_id,
							visitor_id: master_user_id,
							trx_ts: timestamp,
							trx_amount: visitor.balance_amount,
							notes: 'transfer',
							log_ref_id,
							event_id
						})
						.returning(['id'])
						.executeTakeFirstOrThrow();
				}
			}

			await transaction
				.updateTable('visitor_registration')
				.set({ group_qr: 1 })
				.where('master_user_id', '=', master_user_id)
				.executeTakeFirstOrThrow();

			// return balance;
		});
		return json({
			text: "Visitors' QrCodes Grouped Successful. All balances have been successfully transferred to master user."
		});
		// console.log('balances :>> ', balances);
	} catch (e) {
        console.log('e.message :>> ', e.message);
		throw error(400, 'Error: ' + e.message);
	}
	return new Response();
};
