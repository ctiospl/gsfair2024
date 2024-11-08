import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

import { cashSettlementSchema } from '$lib/zod/schema';
import { db } from '$lib/server/db';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(cashSettlementSchema));
    return { form };
};


export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) {
            error(401, 'Please login first');
        }
        const collection_volunteer_id = locals.user.id;
        const event_id = locals.user.current_event_id ?? 0;
        const form = await superValidate(request, zod(cashSettlementSchema));
        if (!form.valid) return fail(400, { form });
        const volunteerInfo = form.data;

        const volunteer_id = volunteerInfo.volunteer_id;
        const settlement_amount = Number(volunteerInfo.settlement_amount);

        try {
            const timestamp = (Date.now() / 1000) | 0;
            const transactionBuilder = db.transaction();
            const envelope_id = await transactionBuilder.execute(async (transaction) => {
                // get volunteer cash balance
                const { balance_amount } = await transaction
                    .selectFrom('volunteer_cash_log')
                    .where('volunteer_id', '=', volunteer_id)
                    .groupBy('volunteer_id')
                    .select((eb) => [eb.fn.sum<number>('trx_amount').as('balance_amount')])
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
            error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    }
}
