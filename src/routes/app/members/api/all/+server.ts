import {db, log} from '$lib/server/db.js'
import { json } from '@sveltejs/kit';

export const GET = async () => {
    const members = await db
        .selectFrom('users')
        .select(['id', 'firstname', 'lastname','email'])
        .orderBy('firstname', 'asc')
        // .$call(log)
        .execute();

        return json(members);
    // return new Response();
};
