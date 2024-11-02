import { superValidate, message } from 'sveltekit-superforms/server';
// import {  } from 'sveltekit-flash-message/server';

import { error, fail, redirect } from '@sveltejs/kit';
import { balanceTransferScheme } from '$lib/zod/schema';
import { db, log } from '$lib/server/db';
import { jsonBuildArrayObject } from '$lib/server/kyselyhelpers';
import { sql } from 'kysely';

import type { Actions, PageServerLoad } from './$types';
import type { installPolyfills } from '@sveltejs/kit/node/polyfills';
import { invalidateAll } from '$app/navigation';

export const load: PageServerLoad = async () => {
	const form = await superValidate(balanceTransferScheme);
	return { form };
};


export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth.validate();
		const { user } = session;
		const volunteer_id = user.userId;
		const event_id = user.current_event_id ?? 0;
		const form = await superValidate(request, balanceTransferScheme);
		if (!form.valid) return fail(400, { form });
		const transferInfo = form.data;
        // console.log('transferInfo :>> ', transferInfo);

		const { transferFromId, transferToId, from_balance } = transferInfo;

         try {
            const timestamp = (Date.now() / 1000) | 0;
            const transactionBuilder = db.transaction();
            const balances = await transactionBuilder.execute(async (transaction) => {
							// const { from_balance } = await transaction
							// 	.selectFrom('transaction_log')
							// 	.where('visitor_id', '=', transferFromId)
							// 	.groupBy('visitor_id')
							// 	.select((eb) => [eb.fn.sum('trx_amount').as('from_balance')])
							// 	.executeTakeFirstOrThrow();
							const { id: log_ref_id } = await transaction
								.insertInto('transaction_log')
								.values({
									volunteer_id,
									visitor_id: transferFromId,
									trx_ts: timestamp,
									trx_amount: -from_balance,
									notes: 'transfer'
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
									log_ref_id
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
            // console.log('balances :>> ', balances);
            return message(form, {
							text: 'Balance Transfer Successful.',
							balances
						});

        } catch (e) {
            throw error(400, 'Error: ' + e.message);
        }
    }
}
