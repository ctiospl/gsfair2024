import type { Actions, PageServerLoad } from './$types';
import { db, log } from '$lib/server/db.js';
import { superValidate, message } from 'sveltekit-superforms/server';
import { rechargeSchema } from '$lib/zod/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

export const load = (async () => {
	const form = await superValidate(rechargeSchema);
    const uuid: string = randomUUID();

	return { form, uuid };
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ locals, request }) => {
		const session = await locals.auth.validate();
		const { user } = session;
		const volunteer_id = user.userId;
		const form = await superValidate(request, rechargeSchema);
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
								.limit(1)
								.orderBy('master_user_id', 'desc'),
							trx_amount: recharge_amt,
							payment_method,
							volunteer_id,
							trx_ts: timestamp,
                            trx_uid:uuid,
							notes: 'recharge',
							event_id: event_id
						}))
						.returning(['id'])
                        // .$call(log)
						.executeTakeFirstOrThrow();


					if (payment_method.toLowerCase().trim() == 'cash') {
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
			// console.log(`/app/visitor-registration/print/${master_user_id}`);
		} catch (e: any) {
			throw error(406, e.message);
			// if (error.code === 'ER_DUP_ENTRY') {
			// 	return message(form, { type: 'Error', text: 'Visitor already added. Confirm email/phone' });
			// }
			// return message(form, { type: 'Error', text: error.message });

			// If an error occurs, it will automatically roll back the transaction
		}
	}
};
