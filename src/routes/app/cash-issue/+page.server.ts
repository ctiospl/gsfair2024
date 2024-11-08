import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

import { cashIssueSchema } from '$lib/zod/schema';
import { db } from '$lib/server/db';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(cashIssueSchema));
    return { form };
};


export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) {
            error(401, 'Please login first');
        }
        const issuing_volunteer_id = locals.user.id;
        const event_id = locals.user.current_event_id ?? 0;
        const form = await superValidate(request, zod(cashIssueSchema));
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
            error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    }
}
