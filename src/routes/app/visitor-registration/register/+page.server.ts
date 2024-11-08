import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

import { db } from '$lib/server/db';
import { visitorSchema } from '$lib/zod/schema';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(visitorSchema));
    return { form };
};

///// Form actions /////

export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) {
            error(401, 'Please login first');
        }
        const volunteer_id = locals.user.id;
        const event_id = locals.user.current_event_id ?? 0;
        const form = await superValidate(request, zod(visitorSchema));
        if (!form.valid) return fail(400, { form });
        const visitorInfo = form.data;

        const {
            name,
            email,
            phone,
            area,
            number_of_guests,
            group_qr,
            guests,
            payment_method,
            payment_amount,
            payment_status,
            recharge_amt,
            registration_amount,
            from_gs,
            is_child,
            hear_about_us
        } = visitorInfo;
        let master_user_id;
        try {
            const transactionBuilder = db.transaction();
            master_user_id = await transactionBuilder.execute(async (transaction) => {
                const timestamp = (Date.now() / 1000) | 0;
                try {
                    const { id: master_user_id } = await transaction
                        .insertInto('visitor_registration')
                        .values({
                            name,
                            email,
                            phone,
                            area: area ?? '',
                            number_of_guests: number_of_guests ?? 0,
                            payment_status: payment_status ? 1 : 0,
                            payment_amount: payment_amount ?? 0,
                            payment_method: payment_method ?? '',
                            event_id,
                            volunteer_id,
                            from_gs: from_gs ? 1 : 0,
                            is_child: is_child ? 1 : 0,
                            reg_ts: timestamp,
                            group_qr: group_qr ? 1 : 0,
                            hear_about_us: hear_about_us ?? '',
                            balance_credit: 0,
                            master_user_id: 0,
                            uid: ''
                        })
                        .returning(['id'])
                        .executeTakeFirstOrThrow();

                    await transaction
                        .updateTable('visitor_registration')
                        .set({
                            // uid: sql`SUBSTRING(MD5(${master_user_id}), 1, 6)`,
                            master_user_id: master_user_id
                        })
                        .where('id', '=', master_user_id)
                        .executeTakeFirstOrThrow();
                    if (recharge_amt) {
                        const { id: guest_recharge_id } = await transaction
                            .insertInto('transaction_log')
                            .values({
                                visitor_id: master_user_id,
                                event_id,
                                volunteer_id,
                                payment_method,
                                trx_amount: recharge_amt,
                                trx_ts: timestamp,
                                notes: 'recharge'
                            })
                            .returning(['id'])
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
                    }
                    interface visitorIdName {
                        id: number;
                        name: string;
                    }
                    let guestIdNamesArray: visitorIdName[] = [];
                    if (number_of_guests) {
                        let guestInserData = guests.map((guest: any) => {
                            return {
                                master_user_id: master_user_id,
                                name: guest.name,
                                reg_ts: timestamp,
                                is_child: guest.is_child ? 1 : 0,
                                from_gs: guest.from_gs ? 1 : 0,
                                group_qr: group_qr ? 1 : 0,
                                // Add required fields with default values
                                number_of_guests: 0,
                                area: '',
                                payment_method: '',
                                payment_status: 0,
                                payment_amount: 0,
                                event_id,
                                volunteer_id,
                                balance_credit: 0,
                                uid: ''
                            };
                        });

                        guestIdNamesArray = await transaction
                            .insertInto('visitor_registration')
                            .values(guestInserData)
                            .returning(['id', 'name'])
                            .execute();

                        // if (group_qr) {
                        // 	guestIdNamesArray.map(async (visitor_id: any) => {
                        // 		await transaction
                        // 			.updateTable('visitor_registration')
                        // 			.set({
                        // 				uid: sql`SUBSTRING(MD5(${master_user_id}), 1, 6)`
                        // 			})
                        // 			.where('id', '=', visitor_id.id)
                        // 			.execute();
                        // 	});
                        // } else {
                        // 	guestIdNamesArray.map(async (visitor_id: any) => {
                        // 		await transaction
                        // 			.updateTable('visitor_registration')
                        // 			.set({
                        // 				uid: sql`SUBSTRING(MD5(${visitor_id.id}), 1, 6)`
                        // 			})
                        // 			.where('id', '=', visitor_id.id)
                        // 			.execute();
                        // 	});
                        // }

                        guests.map(async (guest: any) => {
                            const visitor = guestIdNamesArray.find((v) => v.name === guest.name);
                            if (!visitor) throw new Error(`Guest ${guest.name} not found in registered guests`);
                            const visitor_id = visitor.id;
                            if (guest.recharge_amt) {
                                const { id: guest_recharge_id } = await transaction
                                    .insertInto('transaction_log')
                                    .values({
                                        visitor_id,
                                        event_id,
                                        volunteer_id,
                                        payment_method,
                                        trx_amount: guest.recharge_amt,
                                        trx_ts: timestamp,
                                        notes: 'recharge'
                                    })
                                    .returning(['id'])
                                    .executeTakeFirstOrThrow();
                                if (payment_method.toLowerCase().trim() == 'cash') {
                                    await transaction
                                        .insertInto('volunteer_cash_log')
                                        .values({
                                            volunteer_id,
                                            trx_amount: guest.recharge_amt,
                                            trx_ts: timestamp,
                                            trx_log_id: guest_recharge_id
                                        })
                                        .executeTakeFirstOrThrow();
                                }
                            }
                        });
                    }
                    //  insert to transaction table
                    // if(group_qr){
                    // 	id	visitor_id	event_id	volunteer_id	trx_amount	trx_ts

                    const { id: payment_log_id } = await transaction
                        .insertInto('transaction_log')
                        .values({
                            visitor_id: master_user_id,
                            event_id,
                            volunteer_id,
                            payment_method,
                            trx_amount: registration_amount,
                            trx_ts: timestamp,
                            notes: 'registration'
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
                            notes: 'registration_charges',
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

                    return master_user_id;
                } catch (e: any) {
                    throw new Error('Error in transaction' + e.message);
                }
            });
            // console.log(`/app/visitor-registration/print/${master_user_id}`);
        } catch (e: any) {
            error(406, e.message);
            // if (error.code === 'ER_DUP_ENTRY') {
            // 	return message(form, { type: 'Error', text: 'Visitor already added. Confirm email/phone' });
            // }
            // return message(form, { type: 'Error', text: error.message });

            // If an error occurs, it will automatically roll back the transaction
        }
        redirect(302, `/app/visitor-registration/assign/${master_user_id}`);
    }
};
