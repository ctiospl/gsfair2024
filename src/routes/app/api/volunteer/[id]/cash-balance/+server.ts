import type { RequestHandler } from './$types';
import {db, log} from '$lib/server/db.js';
import { json, error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({params}) => {
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
        throw error(400, 'DB error');
    }

};
