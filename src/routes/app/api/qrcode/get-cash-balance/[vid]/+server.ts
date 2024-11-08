import { error, json } from '@sveltejs/kit';

import { db } from '$lib/server/db.js';
import { sql } from 'kysely';

export const GET = async ({ params, locals }) => {
    if (!locals.user) {
        error(401, 'Please login first');
    }
    const { vid } = params;

    if (vid) {
        try {
            const { balance_amount, firstname, lastname, id } = await db
                .selectFrom('users as u')
                .select(['id', 'firstname', 'lastname'])
                .select((eb) =>
                    eb
                        .selectFrom('volunteer_cash_log')
                        .whereRef('volunteer_id', '=', 'u.id')
                        .select((eb) => eb.fn('ifnull', [eb.fn.sum('trx_amount'), sql`0`]).as('balance_amount'))
                        .as('balance_amount')
                )
                .where('id', '=', vid)
                .limit(1)
                .orderBy('id')
                .executeTakeFirstOrThrow();
            return json({ id, firstname, lastname, balance_amount });
        } catch (e: unknown) {
            error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
        }
    } else {
        error(400, 'Missing vid');
    }

};
