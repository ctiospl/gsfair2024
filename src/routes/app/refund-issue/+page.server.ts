import type { Actions, PageServerLoad } from './$types';
import { db, log } from '$lib/server/db';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

import type { installPolyfills } from '@sveltejs/kit/node/polyfills';
import { invalidateAll } from '$app/navigation';
import { refundIssueSchema } from '$lib/zod/schema';
import { sql } from 'kysely';
import { zod } from 'sveltekit-superforms/adapters';

// import {  } from 'sveltekit-flash-message/server';



export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(refundIssueSchema));
    return { form };
};

export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) {
            error(401, 'Please login first');
        }
        const volunteer_id = locals.user.id;
        const event_id = locals.user.current_event_id ?? 0;
        const form = await superValidate(request, zod(refundIssueSchema));
        if (!form.valid) return fail(400, { form });
        const refundInfo = form.data;

        const { visitor_id, refund_amount } = refundInfo;

        try {
            const timestamp = (Date.now() / 1000) | 0;
            const transactionBuilder = db.transaction();
            const refund_id = await transactionBuilder.execute(async (transaction) => {
                const { id: trx_log_id } = await transaction
                    .insertInto('transaction_log')
                    .values({
                        volunteer_id,
                        visitor_id,
                        trx_amount: -refund_amount,
                        trx_ts: timestamp,
                        notes: 'refund',
                        payment_method: 'cash',
                        event_id
                    })
                    .returning(['id'])
                    .executeTakeFirstOrThrow();

                const { id: ref_log_id } = await transaction
                    .insertInto('volunteer_cash_log')
                    .values({
                        volunteer_id,
                        trx_amount: -refund_amount,
                        trx_ts: timestamp,
                        notes: 'refund',
                        ref_log_id: trx_log_id
                    })
                    .returning(['id'])
                    .executeTakeFirstOrThrow();

                const { id: refund_id } = await transaction
                    .insertInto('refund_log')
                    .values({
                        volunteer_id,
                        visitor_id,
                        cash_amount: refund_amount,
                        trx_ts: timestamp,
                        trx_log_id,
                        ref_log_id
                    })
                    .returning(['id'])
                    .executeTakeFirstOrThrow();
                return refund_id;
            });
            return message(form, {
                text: 'Cash refunded successfully',
                refund_id
            });
        } catch (e) {
            // if (e instanceof Error && 'code' in e && e.code === 'ER_DUP_ENTRY') {
            // 	error(400, 'Visitor already added. Confirm email/phone');
            // }
            error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    }
};
