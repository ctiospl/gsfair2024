import type { Actions, PageServerLoad } from './$types';
import { db, log } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';

import { assignQrCodeSchema } from '$lib/zod/schema';
import { sql } from 'kysely';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ params, locals }) => {
    if (!locals.user) {
        error(401, 'Please login first');
    }
    const form = await superValidate(zod(assignQrCodeSchema));
    const { id } = params;
    console.log('id :>> ', id);
    console.log('isNumeric(id) :>> ', isNumeric(id));

    const userData = await db
        .selectFrom('visitor_registration as vr')
        .where((eb) =>
            eb(
                'master_user_id',
                '=',
                eb
                    .selectFrom('visitor_registration')
                    .$if(isNumeric(id), (eb) => eb.where('id', '=', parseInt(id)))
                    .$if(!isNumeric(id), (eb) => eb.where('uid', '=', id))
                    .select('master_user_id')
            )
        )
        .select((eb) =>
            eb
                .selectFrom('visitor_uids as vu')
                .whereRef('vu.visitor_id', '=', 'vr.id')
                .whereRef('vu.uid', '=', 'vr.uid')
                .select(['expired'])
                .limit(1)
                .as('expired')
        )
        .select((eb) =>
            eb
                .selectFrom('transaction_log')
                .whereRef('visitor_id', '=', 'vr.id')
                .select((eb) => eb.fn<number>('ifnull', [eb.fn.sum('trx_amount'), sql`0`]).as('balance_amount'))
                .as('balance_amount')
        )
        .selectAll('vr')
        .$call(log)
        .execute();
    console.log('userData :>> ', userData);
    return { form, userData };
};

function isNumeric(num: string | number): boolean {
    return !isNaN(Number(num));
}

export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) {
            error(401, 'Please login first');
        }
        const volunteer_id = locals.user.id;
        const form = await superValidate(request, zod(assignQrCodeSchema));
        if (!form.valid) return fail(400, { form });
        const assignQrcodeInfo = form.data;

        const { qrcode_value, visitor_id } = assignQrcodeInfo;

        try {
            const timestamp = (Date.now() / 1000) | 0;
            const transactionBuilder = db.transaction();
            const uid_log_id = await transactionBuilder.execute(async (transaction) => {
                // visitor_uids;
                await transaction
                    .updateTable('visitor_registration')
                    .set({
                        uid: qrcode_value
                    })
                    .where('id', '=', visitor_id)
                    .executeTakeFirstOrThrow();

                let uid_log_id = await transaction
                    .insertInto('visitor_uids')
                    .values({
                        visitor_id: visitor_id,
                        assignment_ts: timestamp,
                        uid: qrcode_value,
                        volunteer_id,
                    })
                    .returning(['id'])
                    .executeTakeFirstOrThrow();
                return uid_log_id;
            });

            return message(form, {
                text: 'Qrcode Assigned.',
                uid_log_id,
                assignQrcodeInfo
            });
        } catch (e) {
            throw error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    }
};
