import type { PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db, log } from '$lib/server/db';
import { jsonBuildArrayObject, jsonArrayFrom } from '$lib/server/kyselyhelpers';
import { sql } from 'kysely';

export const load = (async ({ locals }) => {
	const session = await locals.auth.validate();
	const { user } = session;
    console.log('user :>> ', user);
	const volunteer_id = user.userId;
    const transactions = await db
			.selectFrom('transaction_log as tl')
			.leftJoin('visitor_registration as vr', 'vr.id', 'tl.visitor_id')
			.leftJoin('category_events as ce', 'ce.id', 'tl.event_id')
			.leftJoin('event_items as ei', 'ei.id', 'tl.event_item_id')
			.where('tl.volunteer_id', '=', volunteer_id)
			.where('tl.notes', 'in', ['payment', 'recharge', 'refund', 'registration', 'reversal'])
			.orderBy('trx_ts', 'desc')
			.select((eb) => [
				'tl.id',
				'tl.trx_ts',
				'tl.trx_amount',
				'tl.notes',
				'vr.name',
				'vr.uid',
				'tl.event_id',
				'tl.event_item_id',
				'ce.event_name',
				'ei.item_name',
				// jsonArrayFrom(
				// 	eb
				// 		.selectFrom('visitor_registration as vri')
				// 		.whereRef('vri.master_user_id', '=', 'tl.visitor_id')
				// 		.select(['vri.uid'])
				// 		.orderBy('id')
				// ).as('group_uids'),
				eb
					.selectFrom('visitor_registration as vri')
					.whereRef('vri.master_user_id', '=', 'tl.visitor_id')
					.where('vri.group_qr', '=', 1)
					.select(eb.fn('group_concat', ['vri.uid']))
					.orderBy('id')
					.as('group_uids'),
				eb
					.selectFrom('transaction_log as tli')
					.whereRef('tli.log_ref_id', '=', 'tl.id')
					.where('tli.notes', '=', 'reversal')
					.select((eb2) => eb2.fn('ifnull', [eb2.fn.count('tli.id'), sql`0`])).as('reversal_count')
			])
			.limit(15)
			// .$call(log)
			.execute();

    console.log('transactions :>> ', JSON.stringify(transactions, null, 2));
	return { transactions };
}) satisfies PageServerLoad;
