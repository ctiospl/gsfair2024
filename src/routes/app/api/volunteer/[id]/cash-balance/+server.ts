import {db, log} from '$lib/server/db.js';
import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({params, locals}) => {
    if (!locals.user) {
        error(401, 'Please login first');
    }
    const {id} = params;
    try {
        let {balance} = await db
					.selectFrom('volunteer_cash_log')
					.where('volunteer_id', '=', id)
					.select((eb) => eb.fn.sum('trx_amount').as('balance'))
					.executeTakeFirstOrThrow();
        if(!balance){
            balance=0
        }
        return json({balance});
    } catch (e) {
        error(400, 'DB error');
    }

};
