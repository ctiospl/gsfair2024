import { db, log } from '$lib/server/db';

export async function getUserByUsername(username: string) {
    try {
        const user = await db
            .selectFrom('fry_users')
            .select([
                'id',
                'pk_userid',
                'username',
                'userfirstname',
                'userlastname',
                'useremail',
                'userpass',
                'salt'
            ])
            .where('username', '=', username)
            .executeTakeFirstOrThrow();
        return user;
    } catch (error) {
        return { error: (error as Error).message };
    }

}
