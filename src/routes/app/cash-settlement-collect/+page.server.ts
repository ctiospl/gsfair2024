import { superValidate, message } from 'sveltekit-superforms/server';
// import {  } from 'sveltekit-flash-message/server';

import { error, fail, redirect } from '@sveltejs/kit';
import { cashSettlementSchema } from '$lib/zod/schema';
import { db, log } from '$lib/server/db';
import { sql } from 'kysely';

import type { Actions, PageServerLoad } from './$types';
import type { installPolyfills } from '@sveltejs/kit/node/polyfills';
import { invalidateAll } from '$app/navigation';

export const load: PageServerLoad = async () => {
	const form = await superValidate(cashSettlementSchema);
	return { form };
};


export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth.validate();
		const { user } = session;
		const collection_volunteer_id = user.userId;
		const event_id = user.current_event_id ?? 0;
		const form = await superValidate(request, cashSettlementSchema);
		if (!form.valid) return fail(400, { form });
		const volunteerInfo = form.data;

		const { volunteer_id, settlement_amount } = volunteerInfo;

         try {
            const timestamp = (Date.now() / 1000) | 0;
            const transactionBuilder = db.transaction();
            const envelope_id = await transactionBuilder.execute(async (transaction) => {
                // get volunteer cash balance
                const { balance_amount } = await transaction
                                    .selectFrom('volunteer_cash_log')
                                    .where('volunteer_id', '=', volunteer_id)
                                    .groupBy('volunteer_id')
                                    .select((eb) => [eb.fn.sum('trx_amount').as('balance_amount')])
                                    .executeTakeFirstOrThrow();
                if (balance_amount < settlement_amount) {
                    throw error(400, 'Insufficient balance');
                }
                const { id: ref_log_id } = await transaction
									.insertInto('volunteer_cash_log')
									.values({
										volunteer_id,
                                        trx_amount: -settlement_amount,
                                        trx_ts: timestamp,

									})
									.returning(['id'])
									.executeTakeFirstOrThrow();
                const { id: trx_log_id } = await transaction
									.insertInto('volunteer_cash_log')
									.values({
										volunteer_id: collection_volunteer_id,
										trx_amount: settlement_amount,
										trx_ts: timestamp,
										ref_log_id
									})
									.returning(['id'])
									.executeTakeFirstOrThrow();

                const { id: envelope_id } = await transaction
									.insertInto('cash_envelope_log')
									.values({
										from_volunteer_id: volunteer_id,
										collected_by: collection_volunteer_id,
										cash_amount: settlement_amount,
										trx_ts: timestamp,
										trx_log_id
									})
									.returning(['id'])
									.executeTakeFirstOrThrow();
                return envelope_id;

            });
            return message(form, {
							text: 'Cash collected successfully',
							envelope_id
						});
        } catch (e) {
            throw error(400, 'Error: ' + e.message);
        }
    }
}
