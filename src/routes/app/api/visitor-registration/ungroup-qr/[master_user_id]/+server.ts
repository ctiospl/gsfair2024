import { error, json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { db } from '$lib/server/db.js';

export const POST: RequestHandler = async ({ params, locals }) => {
    if (!locals.user) {
        error(401, 'Please login first');
    }
    const master_user_id = Number(params.master_user_id);

    try {
        await db
            .updateTable('visitor_registration')
            .set({ group_qr: 0 })
            .where('master_user_id', '=', master_user_id)
            .executeTakeFirstOrThrow();

        return json({
            text: "Visitors' QrCodes Un-Grouped Successful. All visitor now have their own balances."
        });
    } catch (e) {
        error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
    return new Response();
};
