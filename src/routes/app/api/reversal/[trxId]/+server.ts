import type { RequestHandler } from './$types';
import { db, log } from '$lib/server/db.js';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    console.log('object');
    return new Response();
};
export const POST: RequestHandler = async ({params, locals}) => {

    const {trxId} = params;
    const session = await locals.auth.validate();
		const { user } = session;
		const volunteer_id = user.userId;
		const event_id = user.eventId ?? 0;

		try {
			const timestamp = (Date.now() / 1000) | 0;
			const transactionBuilder = db.transaction();
			const balance_amount = await transactionBuilder.execute(async (transaction) => {
				const trx = await transaction
					.selectFrom('transaction_log')
					.where('id', '=', trxId)
					.selectAll()
					.executeTakeFirstOrThrow();



				const { id: log_ref_id } = await transaction
					.insertInto('transaction_log')
					.values({
						volunteer_id,
						visitor_id: trx.visitor_id,
						trx_ts: timestamp,
						trx_amount: -trx.trx_amount,
						notes: 'reversal',
                        log_ref_id: trxId,
                        event_id: trx.event_id
					})
					.returning(['id'])
					.executeTakeFirstOrThrow();



				const {balance} = await transaction
					.selectFrom('transaction_log as tl')
					.groupBy('visitor_id')
					.select((eb) => [eb.fn.sum('trx_amount').as('balance')])
					.where('visitor_id', '=', trx.visitor_id)
					.executeTakeFirstOrThrow();

				return balance;
			});
            console.log('balance_amount :>> ', balance_amount);
            return json({
                balance_amount: balance_amount,
				text: 'Balance Transfer Successful.',

			});
			// console.log('balances :>> ', balances);

		} catch (e) {
			throw error(400, 'Error: ' + e.message);
		}
    return new Response();
}
