import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { db } from '$lib/server/db.js';

export const GET: RequestHandler = async () => {
    console.log('object');
    return new Response();
};
export const POST: RequestHandler = async ({ params, locals }) => {

    const { trxId } = params;
    if (!locals.user) {
        error(401, 'Please login first');
    }

    const volunteer_id = locals.user.id;

    try {
        const timestamp = (Date.now() / 1000) | 0;
        const transactionBuilder = db.transaction();
        const balance_amount = await transactionBuilder.execute(async (transaction) => {
            const trx = await transaction
                .selectFrom('transaction_log')
                .where('id', '=', parseInt(trxId))
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
                    log_ref_id: parseInt(trxId),
                    event_id: trx.event_id
                })
                .returning(['id'])
                .executeTakeFirstOrThrow();



            const { balance } = await transaction
                .selectFrom('transaction_log as tl')
                .groupBy('visitor_id')
                .select((eb) => [eb.fn.sum('trx_amount').as('balance')])
                .where('visitor_id', '=', trx.visitor_id)
                .executeTakeFirstOrThrow();

            return balance;
        });
        return json({
            balance_amount: balance_amount,
            text: 'Balance Transfer Successful.',

        });

    } catch (e: unknown) {
        error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
    return new Response();
}
