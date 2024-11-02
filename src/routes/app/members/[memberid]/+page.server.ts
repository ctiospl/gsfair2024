import {db, log} from '$lib/server/db.js'
import {jsonArrayAgg, jsonBuildObject} from '$lib/server/kyselyhelpers.js'
export const load = (async ({params}) => {
    const {memberid} = params;
    const memberInfo = await db.selectFrom("users as u")
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
                        .where("id","=",memberid)
                        // .$call(log)
                        .executeTakeFirst();

    return { localStoragePrefix: 'member', memberInfo};
})
