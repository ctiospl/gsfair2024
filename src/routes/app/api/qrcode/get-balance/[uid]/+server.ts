import { db, log, sqlString } from '$lib/server/db.js';
import { error, json } from '@sveltejs/kit';

import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';

export const GET = async ({ params, locals }) => {
    if (!locals.user) {
        error(401, 'Please login first');
    }
    const { uid } = params;
    if (uid) {

        try {
            const {
                balance_amount,
                name,
                id,
                master_user_id,
                group_qr,
                master_balance_amount,
                master_uid,
                expired
            } = await db
                .selectFrom('visitor_registration as vr')
                .select(['id', 'name', 'master_user_id', 'group_qr'])
                .select((eb) =>
                    eb
                        .selectFrom('transaction_log')
                        .whereRef('visitor_id', '=', 'vr.id')
                        .select((eb) => eb.fn('ifnull', [eb.fn.sum('trx_amount'), sql`0`]).as('balance_amount'))
                        .as('balance_amount')
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
                        .whereRef('visitor_id', '=', 'vr.master_user_id')
                        .select((eb) => eb.fn('ifnull', [eb.fn.sum('trx_amount'), sql`0`]).as('balance_amount'))
                        .as('master_balance_amount')
                )
                .select((eb) =>
                    eb
                        .selectFrom('visitor_registration')
                        .whereRef('id', '=', 'vr.master_user_id')
                        .select(['uid'])
                        .as('master_uid')
                )
                .where('uid', '=', uid)
                .limit(1)
                .orderBy('id')
                .$call(sqlString)
                .executeTakeFirstOrThrow();
            if (expired) {
                return json({ error: 1, message: 'QR code expired. Please get a fresh one.' });
            }
            console.log('expired :>> ', expired);
            if (group_qr) {
                return json({
                    id: master_user_id,
                    sub_id: id,
                    name,
                    balance_amount: master_balance_amount,
                    uid: master_uid,
                    master_uid,
                    uuid: randomUUID()
                });
            } else {
                return json({ id, sub_id: id, name, balance_amount, uid, master_uid, uuid: randomUUID() });
            }
        } catch (e) {
            error(400, 'Error: ' + e.message);
        }
    } else {
        error(400, 'Missing uid');
    }
};
