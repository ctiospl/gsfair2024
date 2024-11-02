import {db, log} from '$lib/server/db.js'
import {sql} from 'kysely'
import {jsonArrayAgg, jsonBuildObject} from '$lib/server/kyselyhelpers.js'
export const load = (async ({parent}) => {
    const { user } = await parent();
    const members = await db.selectFrom("users as u")
                        .select(eb=>
                            (
                                eb.selectFrom("user_category as uc")
                                .select(jsonArrayAgg(
                                    jsonBuildObject({
                                        id:eb.ref("uc.categoryid"),
                                        // name:sql`(SELECT name FROM categories WHERE id=uc.categoryid)`
                                        name:eb.selectFrom("categories")
                                            .select("name")
                                            .where("id","=",eb.ref("uc.categoryid")),
                                        poc:eb.selectFrom("category_poc as cp")
                                            .select(eb=>eb.fn.count("id"))
                                            .where("category_id","=",eb.ref("uc.categoryid"))
                                            .where("user_id","=",eb.ref("uc.userid"))

                                    })

                                    ))
                                .where("u.id", "=", eb.ref("uc.userid"))
                            ).as('categories')
                        )
                        .select(eb=>
                            (
                                eb.selectFrom("category_poc as cp")
                                .select(jsonArrayAgg(
                                    jsonBuildObject({
                                        id:eb.ref("cp.category_id"),
                                        // name:sql`(SELECT name FROM categories WHERE id=uc.categoryid)`
                                        name:eb.selectFrom("categories")
                                            .select("name")
                                            .where("id","=",eb.ref("cp.category_id"))

                                    })

                                    ))
                                .where("u.id", "=", eb.ref("cp.user_id"))
                            ).as('poc')
                        )
                        .selectAll('u')
                        .orderBy('u.firstname', 'asc')

                        // .$call(log)
                        .execute();

    const contactList = members.reduce((acc,cur)=>{
        // get 1st letter of the firstname
        // add array of members with that letter to the accumulator
        // return accumulator
        const firstLetter = cur.firstname[0].toUpperCase();
        if(!acc[firstLetter]){
            acc[firstLetter] = [];
        }
        return {...acc, [firstLetter]:[...acc[firstLetter], cur]};

    },[])
    return { localStoragePrefix: 'members', members, contactList, user };
})
