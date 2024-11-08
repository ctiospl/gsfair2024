import type { Actions, PageServerLoad } from './$types';
import { db, log } from '$lib/server/db';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

import { balanceTransferScheme } from '$lib/zod/schema';
import type { installPolyfills } from '@sveltejs/kit/node/polyfills';
import { invalidateAll } from '$app/navigation';
import { jsonBuildArrayObject } from '$lib/server/kyselyhelpers';
import { sql } from 'kysely';
import { zod } from 'sveltekit-superforms/adapters';

// import {  } from 'sveltekit-flash-message/server';



export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(balanceTransferScheme));
    return { form };
};


export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) {
            error(401, 'Please login first');
        }
        const volunteer_id = locals.user.id;
        const form = await superValidate(request, zod(balanceTransferScheme));
        if (!form.valid) return fail(400, { form });
        const transferInfo = form.data;

        const transferFromId = Number(transferInfo.transferFromId);
        const transferToId = Number(transferInfo.transferToId);
        const from_balance = Number(transferInfo.from_balance);

        try {
            const timestamp = (Date.now() / 1000) | 0;
            const transactionBuilder = db.transaction();
            const balances = await transactionBuilder.execute(async (transaction) => {

                const { id: log_ref_id } = await transaction
                    .insertInto('transaction_log')
                    .values({
                        volunteer_id,
                        visitor_id: transferFromId,
                        trx_ts: timestamp,
                        trx_amount: -from_balance,
                        notes: 'transfer',
                        event_id: 0
                    })
                    .returning(['id'])
                    .executeTakeFirstOrThrow();

                const { id: transfer_id } = await transaction
                    .insertInto('transaction_log')
                    .values({
                        volunteer_id,
                        visitor_id: transferToId,
                        trx_ts: timestamp,
                        trx_amount: from_balance,
                        notes: 'transfer',
                        log_ref_id,
                        event_id: 0
                    })
                    .returning(['id'])
                    .executeTakeFirstOrThrow();



                const balances = await transaction
                    .selectFrom('transaction_log as tl')
                    .groupBy('visitor_id')
                    .select((eb) => ['visitor_id', eb.fn.sum('trx_amount').as('balance')])
                    .select((eb) =>
                        eb
                            .selectFrom('visitor_registration as vr')
                            .whereRef('vr.id', '=', 'tl.visitor_id')
                            .select('name')
                            .orderBy('id')
                            .limit(1)
                            .as('name')
                    )
                    .where('visitor_id', 'in', [transferFromId, transferToId])
                    .orderBy('balance')
                    .execute();

                return balances;
            });

            return message(form, {
                text: 'Balance Transfer Successful.',
                balances
            });

        } catch (e) {
            error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    }
}
