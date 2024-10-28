import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, log } from '$lib/server/db.js';

export const GET: RequestHandler = async () => {
    return new Response();
};

export const POST: RequestHandler = async ({ request, locals }) => {
	let { reregisterUsers, payment_status, payment_method, registration_amount } =
		await request.json();
        console.log('reregisterUsers :>> ', reregisterUsers);

	const session = await locals.auth.validate();
	const { user } = session;
	const volunteer_id = user.userId;
	const event_id = user.current_event_id ?? 0;
	// console.log('user :>> ', user);
    try {
			const transactionBuilder = db.transaction();
			const master_user_id = await transactionBuilder.execute(async (transaction) => {
				const timestamp = (Date.now() / 1000) | 0;
                let master_user_id = reregisterUsers[0].master_user_id;
				try {
					const { id: payment_log_id } = await transaction
						.insertInto('transaction_log')
						.values({
							visitor_id: master_user_id,
							event_id,
							volunteer_id,
							payment_method,
							trx_amount: registration_amount,
							trx_ts: timestamp,
							notes: 're_registration'
						})
						.returning(['id'])
						.executeTakeFirstOrThrow();

					await transaction
						.insertInto('transaction_log')
						.values({
							visitor_id: master_user_id,
							event_id,
							volunteer_id,
							trx_amount: -registration_amount,
							trx_ts: timestamp,
							notes: 're_registration_charges',
							log_ref_id: payment_log_id
						})
						.executeTakeFirstOrThrow();
					if (payment_method.toLowerCase().trim() == 'cash') {
						await transaction
							.insertInto('volunteer_cash_log')
							.values({
								volunteer_id,
								trx_amount: registration_amount,
								trx_ts: timestamp,
								trx_log_id: payment_log_id
							})
							.executeTakeFirstOrThrow();
					}
                    for (let index = 0; index < reregisterUsers.length; index++) {
                        const visitor = reregisterUsers[index];
                        // update day_2 to in visitor_registration
                        await transaction
                        .updateTable('visitor_registration')
                        .set({
                            day_2: 1,
                            // payment_status,
                            // payment_method,
                            // registration_amount
                        })
                        .where('id', '=', visitor.id)
                        .executeTakeFirstOrThrow();


                    }
				} catch (e: any) {
					throw new Error('Error in transaction' + e.message);
				}
                return master_user_id;
			});
			// console.log(`/app/visitor-registration/print/${master_user_id}`);
		} catch (e: any) {
            console.log('e.message :>> ', e.message);
			throw error(406, e.message);
			// if (error.code === 'ER_DUP_ENTRY') {
			// 	return message(form, { type: 'Error', text: 'Visitor already added. Confirm email/phone' });
			// }
			// return message(form, { type: 'Error', text: error.message });

			// If an error occurs, it will automatically roll back the transaction
		}
		// throw redirect(302, `/app/visitor-registration/assign/${master_user_id}`);
        return json({success: true, message: 'Re-Registration Successful'});



	// return new Response();
};
