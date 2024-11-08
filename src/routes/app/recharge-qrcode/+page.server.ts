import type { Actions, PageServerLoad } from './$types';
import { db, log } from '$lib/server/db.js';
import { superValidate, message } from 'sveltekit-superforms/server';
import { rechargeSchema } from '$lib/zod/schema';
import { zod } from 'sveltekit-superforms/adapters';
import { error, fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

export const load = (async () => {
    const form = await superValidate(zod(rechargeSchema));
    const uuid: string = randomUUID();

    return { form, uuid };
}) satisfies PageServerLoad;

export const actions: Actions = {
    default: async ({ locals, request }) => {
        if (!locals.user) {
            error(401, 'Please login first');
        }
        const volunteer_id = locals.user.id;
        const form = await superValidate(request, zod(rechargeSchema));
        if (!form.valid) return fail(400, { form });
        const paymentInfo = form.data;
        const { recharge_amt, payment_method, uid, event_id, uuid } = paymentInfo;
        try {
            const transactionBuilder = db.transaction();
            const guest_recharge_id = await transactionBuilder.execute(async (transaction) => {
                const timestamp = (Date.now() / 1000) | 0;
                try {
                    const { id: guest_recharge_id } = await transaction
                        .insertInto('transaction_log')
                        .values((eb) => ({
                            visitor_id: eb
                                .selectFrom('visitor_registration')
                                .select('id')
                                .where('uid', '=', uid)
                                .orderBy('master_user_id', 'desc')
                                .limit(1),
                            trx_amount: recharge_amt,
                            payment_method,
                            volunteer_id,
                            trx_ts: timestamp,
                            trx_uid: uuid,
                            notes: 'recharge',
                            event_id: event_id
                        }))
                        .returning(['id'])
                        .executeTakeFirstOrThrow();


                    if (payment_method.toLowerCase().trim() === 'cash') {
                        await transaction
                            .insertInto('volunteer_cash_log')
                            .values({
                                volunteer_id,
                                trx_amount: recharge_amt,
                                trx_ts: timestamp,
                                trx_log_id: guest_recharge_id
                            })
                            .executeTakeFirstOrThrow();
                    }

                    return guest_recharge_id;
                } catch (e: any) {
                    throw new Error('Error in transaction' + e.message);
                }
            });
            return message(form, {
                text: 'QrCode Recharged successfully'
            });
        } catch (e) {
            if (e instanceof Error && 'code' in e && e.code === 'ER_DUP_ENTRY') {
                error(400, 'Visitor already added. Confirm email/phone');
            }
            error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    }
};
