import { db, log } from '$lib/server/db.js';
import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { sql } from 'kysely';

export const GET: RequestHandler = async () => {
    console.log('object');
    return new Response();
};
export const POST: RequestHandler = async ({ params, locals }) => {
    if (!locals.user) {
        error(401, 'Please login first');
    }

    const volunteer_id = locals.user.id;
    const event_id = locals.user.current_event_id;

    const master_user_id = Number(params.master_user_id);

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
                        .select((eb) => eb.fn<number>('ifnull', [eb.fn.sum('trx_amount'), sql`0`]).as('balance_amount'))
                        .as('balance_amount')
                )
                .execute();

            for (let index = 0; index < visitors.length; index++) {
                const visitor = visitors[index];
                if (visitor?.balance_amount && visitor.balance_amount > 0) {
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

        });
        return json({
            text: "Visitors' QrCodes Grouped Successful. All balances have been successfully transferred to master user."
        });
        // console.log('balances :>> ', balances);
    } catch (e: unknown) {
        error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
    return new Response();
};
