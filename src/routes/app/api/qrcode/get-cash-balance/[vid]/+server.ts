import { error, json } from '@sveltejs/kit';
import { db, log } from '$lib/server/db.js';
import { sql } from 'kysely';

export const GET = async ({ params }) => {

    const { vid } = params;

    if (vid) {
        try {
            const { balance_amount, firstname,lastname, id } = await db
							.selectFrom('users as u')
							.select(['id', 'firstname', 'lastname'])
							.select((eb) =>
								eb
									.selectFrom('volunteer_cash_log')
									.whereRef('volunteer_id', '=', 'u.id')
									.select((eb) => eb.fn('ifnull', [eb.fn.sum('trx_amount'), sql`0`]))
									.as('balance_amount')
							)
							.where('id', '=', vid)
							.limit(1)
							.orderBy('id')
							.$call(log)
							.executeTakeFirstOrThrow();
            return json({ id, firstname, lastname, balance_amount });
        } catch (e) {
            throw error(400, 'Error: ' + e.message);
        }
    } else {
        throw error(400, 'Missing vid');
    }

};
