import type { PageServerLoad } from './$types';
import {db, log} from '$lib/server/db.js';
import { error } from '@sveltejs/kit';
export const load = (async () => {
    try {
        const visitors = await db
					.selectFrom('visitor_registration as vr')
					.selectAll('vr')
					.select((eb) =>
						eb
							.selectFrom('visitor_registration as vri')
							.select('vri.name')
							.whereRef('id', '=', 'vr.master_user_id')
							.as('alongWith')
					)
					.select((eb) =>
						eb
							.selectFrom('visitor_registration as vri')
							.select('vri.phone')
							.whereRef('id', '=', 'vr.master_user_id')
							.as('master_user_phone')
					)

					.execute();
                    // console.log('visitors :>> ', visitors);

        let items = visitors.map((visitor) => {
					let alongWith =
						visitor.alongWith && visitor.id != visitor.master_user_id
							? ` (with ${visitor.alongWith})`
							: '';
					return {
						title: `${visitor.name}${alongWith}`,
						subtitle: `${visitor.payment_method}: ${visitor.payment_status}`,
						text: `Payment Status: ${visitor.payment_status}`,
						...visitor
					};
				});
                // console.log('items :>> ', items);
        return { items };

    } catch (e) {
        throw error(400, 'Error: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
}) satisfies PageServerLoad;
