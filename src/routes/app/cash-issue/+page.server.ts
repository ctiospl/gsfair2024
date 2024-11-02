import { superValidate, message } from 'sveltekit-superforms/server';
// import {  } from 'sveltekit-flash-message/server';

import { error, fail, redirect } from '@sveltejs/kit';
import { cashIssueSchema } from '$lib/zod/schema';
import { db, log } from '$lib/server/db';
import { sql } from 'kysely';

import type { Actions, PageServerLoad } from './$types';
import type { installPolyfills } from '@sveltejs/kit/node/polyfills';
import { invalidateAll } from '$app/navigation';

export const load: PageServerLoad = async () => {
	const form = await superValidate(cashIssueSchema);
	return { form };
};


export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth.validate();
		const { user } = session;
		const issuing_volunteer_id = user.userId;
		const event_id = user.current_event_id ?? 0;
		const form = await superValidate(request, cashIssueSchema);
		if (!form.valid) return fail(400, { form });
		const volunteerInfo = form.data;

		const { volunteer_id, issue_amount } = volunteerInfo;

         try {
            const timestamp = (Date.now() / 1000) | 0;
            const transactionBuilder = db.transaction();
            const issue_id = await transactionBuilder.execute(async (transaction) => {
                const { id: ref_log_id } = await transaction
									.insertInto('volunteer_cash_log')
									.values({
										volunteer_id,
                                        trx_amount: issue_amount,
                                        trx_ts: timestamp,
                                        notes: 'cash issued'

									})
									.returning(['id'])
									.executeTakeFirstOrThrow();

                const { id: issue_id } = await transaction
									.insertInto('cash_issue_log')
									.values({
										volunteer_id: volunteer_id,
										issued_by: issuing_volunteer_id,
										cash_amount: issue_amount,
										trx_ts: timestamp,
										trx_log_id: ref_log_id
									})
									.returning(['id'])
									.executeTakeFirstOrThrow();
                return issue_id;

            });
            return message(form, {
							text: 'Cash issued successfully',
							issue_id
						});
        } catch (e) {
            throw error(400, 'Error: ' + e.message);
        }
    }
}
