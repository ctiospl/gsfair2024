import type { Actions, PageServerLoad } from './$types';
import { db, log, sqlString } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';
import { jsonArrayFrom, jsonObjectFrom } from '$lib/server/kyselyhelpers';
import { message, setError, superValidate } from 'sveltekit-superforms/server';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

import { collectionSchema } from '$lib/zod/schema';
import { sql } from 'kysely';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ params, cookies, locals }) => {
    const { eventcode } = params;
    console.log('eventcode :>> ', eventcode);
    if (!eventcode) {
        redirect('/app/event-selector',
            {
                type: 'error',
                message: { title: 'Missing/Invalid Eventcode', text: 'Please select an event' }
            },
            cookies
        );
        // error(400, 'Missing eventcode');
    }
    // get last payment info

    const event = await db
        .selectFrom('category_events as ce')
        .where('ce.event_code', '=', eventcode)
        .select([
            'ce.id as event_id',
            'ce.category_id',
            'ce.event_name',
            'ce.event_code',
            'ce.price',
            'ce.has_items'
        ])
        .select((eb) => [
            jsonArrayFrom(
                eb
                    .selectFrom('event_items as ei')
                    .select(['id as event_item_id', 'item_code', 'item_name', 'price'])
                    .whereRef('ei.event_id', '=', 'ce.id')
                    .orderBy('ei.id')
            ).as('event_items')
        ])
        .select((eb) => [
            jsonObjectFrom(
                eb
                    .selectFrom('transaction_log as tl')
                    .select((eb)=>['visitor_id',
                        eb.selectFrom('visitor_registration as vr')
                            .select(['name'])
                            .whereRef('vr.id', '=', 'tl.visitor_id')
                            .as('visitor_name'),
                        'sub_visitor_id',
                        eb.selectFrom('visitor_registration as vr')
                            .select(['name'])
                            .whereRef('vr.id', '=', 'tl.sub_visitor_id')
                            .as('sub_visitor_name'),
                        'trx_amount',
                        'payment_method',
                        eb.fn("FROM_UNIXTIME", [
                            eb("trx_ts", "+", sql.raw("5.5 * 60 * 60")),
                            sql.lit("%d-%m-%Y %h:%i %p")
                        ]).as("trx_ts")
                    ])
                    .where('event_id', '=', eb.ref('ce.id'))
                    .where('volunteer_id', '=', locals.user?.id)
                    .orderBy('trx_ts', 'desc')
                    .limit(1)
            )
            .as('last_payment_info')
        ])
        .$call(sqlString)
        .executeTakeFirstOrThrow();

    console.log('event :>> ', event);
    let form = await superValidate(zod(collectionSchema));
    form.data.event_id = event.event_id;
    form.data.has_items = event.has_items == 1 ? true : false;
    form.data.use_qrcode_balance = true;
    if (!event.has_items) {
        form.data.items = [
            {
                event_item_id: 0,
                units: 1,
                price: parseFloat(event.price),
                item_code: event.event_code,
                item_name: event.event_name
            }
        ];
    } else {
        if (event.event_code == 'T1') {
            form.data.items = [];
            form.data.use_qrcode_balance = false;
        } else {
            form.data.items = event.event_items.map((item) => {
                return {
                    event_item_id: item.event_item_id,
                    units: 0,
                    price: parseFloat(item.price),
                    item_code: item.item_code,
                    item_name: item.item_name
                };
            });
        }
    }
    return { form, eventcode, last_payment_info: event.last_payment_info };
};

export const actions: Actions = {
    default: async ({ request, locals }) => {
        console.log('locals :>> ', locals);

        if (!locals.user) {
            // show login page
        }
        const volunteer_id = locals.user?.id;

        const form = await superValidate(request, zod(collectionSchema));
        console.log('form :>> ', form);
        if (!form.valid) return fail(400, { form });
        const paymentInfo = form.data;
        // console.log('paymentInfo :>> ', paymentInfo);

        const {
            total_amount,
            guest_id,
            guest_sub_id,
            event_id,
            items,
            recharge_amt,
            recharge_payment_method
        } = paymentInfo;
        if (total_amount == 0) {
            error(400, 'Error: No amount to collect');
        }

        try {
            const timestamp = (Date.now() / 1000) | 0;
            const transactionBuilder = db.transaction();
            const new_balance_amount = await transactionBuilder.execute(async (transaction) => {
                // add recharge amount

                if (recharge_amt > 0) {
                    const { id: guest_recharge_id } = await transaction
                        .insertInto('transaction_log')
                        .values({
                            visitor_id: guest_id,
                            sub_visitor_id: guest_sub_id,
                            volunteer_id,
                            event_id,
                            trx_amount: recharge_amt,
                            trx_ts: timestamp,
                            payment_method: recharge_payment_method,
                            notes: 'recharge'
                        })
                        .returning(['id'])
                        .executeTakeFirstOrThrow();

                    if (recharge_payment_method.toLowerCase().trim() == 'cash') {
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
                // check if balance is there
                const { balance_amount } = await transaction
                    .selectFrom('transaction_log')
                    .select((eb) => eb.fn('ifnull', [eb.fn.sum('trx_amount'), sql`0`]).as('balance_amount'))
                    .where('visitor_id', '=', guest_id)
                    // .$call(log)
                    .executeTakeFirstOrThrow();
                // if balance
                // add payment entries
                if (parseFloat(balance_amount) >= parseFloat(total_amount)) {
                    const payments = items.map(async (item) => {
                        if (item.units) {
                            await transaction
                                .insertInto('transaction_log')
                                .values({
                                    visitor_id: guest_id,
                                    sub_visitor_id: guest_sub_id,
                                    volunteer_id,
                                    event_id,
                                    event_item_id: item.event_item_id,
                                    trx_amount: parseInt(item.units) * parseFloat(item.price) * -1,
                                    trx_ts: timestamp,
                                    payment_method: 'qrcode',
                                    notes: 'payment'
                                })
                                .executeTakeFirstOrThrow();
                        } else {
                            Promise.resolve();
                        }
                    });
                    await Promise.all(payments);
                    // return message('Payment collected successfully');
                } else {
                    throw new Error('Insufficient balance');
                }
                const { balance_amount: new_balance_amount } = await transaction
                    .selectFrom('transaction_log')
                    .select((eb) => eb.fn('ifnull', [eb.fn.sum('trx_amount'), sql`0`]).as('balance_amount'))
                    .where('visitor_id', '=', guest_id)
                    .executeTakeFirstOrThrow();

                return new_balance_amount;
            });

            return message(form, {
                text: 'Payment collected successfully',
                balance_amount: new_balance_amount
            });
        } catch (e) {
            error(400, 'Error: ' + e.message);
        }
    }
};
