import { superValidate, message } from 'sveltekit-superforms/server';
// import {  } from 'sveltekit-flash-message/server';

import { error, fail, redirect } from '@sveltejs/kit';
import { assignQrCodeSchema } from '$lib/zod/schema';
import { db, log } from '$lib/server/db';
import { jsonBuildArrayObject } from '$lib/server/kyselyhelpers';
import { sql } from 'kysely';

import type { Actions, PageServerLoad } from './$types';
import type { installPolyfills } from '@sveltejs/kit/node/polyfills';
import { invalidateAll } from '$app/navigation';

export const load: PageServerLoad = async ({ params }) => {
	const form = await superValidate(assignQrCodeSchema);
	const { id } = params;
    console.log('id :>> ', id);
    console.log('isNumeric(id) :>> ', isNumeric(id));

	const userData = await db
		.selectFrom('visitor_registration as vr')
		.where((eb) =>
			eb(
				'master_user_id',
				'=',
				eb
					.selectFrom('visitor_registration')
					.$if(isNumeric(id), (eb) => eb.where('id', '=', parseInt(id)))
					.$if(!isNumeric(id), (eb) => eb.where('uid', '=', id))
					.select('master_user_id')
			)
		)
		.select((eb) =>
			eb
				.selectFrom('visitor_uids as vu')
				.whereRef('vu.visitor_id', '=', 'vr.id')
				.whereRef('vu.uid', '=', 'vr.uid')
				.select(['expired'])
				.limit(1)
				.as('expired')
		)
		.select((eb) =>
			eb
				.selectFrom('transaction_log')
				.whereRef('visitor_id', '=', 'vr.id')
				.select((eb) => eb.fn('ifnull', [eb.fn.sum('trx_amount'), sql`0`]))
				.as('balance_amount')
		)
		.selectAll('vr')
        .$call(log)
		.execute();
        console.log('userData :>> ', userData);
	return { form, userData };
};

function isNumeric(num) {
	return !isNaN(num);
}
function isNumber(input) {
	// Check if the input is a string
	if (typeof input !== 'string') {
		return 'Not a string';
	}

	// Try to convert the string to a number
	const number = parseFloat(input);

	// Check if the conversion is successful and the input is not an empty string
	if (!isNaN(number) && input.trim() !== '') {
		return true;
	} else {
		return false;
	}
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await locals.auth.validate();
		const { user } = session;
		const volunteer_id = user.userId;
		const event_id = user.current_event_id ?? 0;
		const form = await superValidate(request, assignQrCodeSchema);
		if (!form.valid) return fail(400, { form });
		const assignQrcodeInfo = form.data;
		// console.log('assignQrcodeInfo :>> ', assignQrcodeInfo);

		const { qrcode_value, visitor_id } = assignQrcodeInfo;
		// console.log('assignQrcodeInfo :>> ', assignQrcodeInfo);

		try {
			const timestamp = (Date.now() / 1000) | 0;
			const transactionBuilder = db.transaction();
			const uid_log_id = await transactionBuilder.execute(async (transaction) => {
				// visitor_uids;
				await transaction
					.updateTable('visitor_registration')
					.set({
						uid: qrcode_value
					})
					.where('id', '=', visitor_id)
					.executeTakeFirstOrThrow();
				let uid_log_id = await transaction
					.insertInto('visitor_uids')
					.values({
						visitor_id: visitor_id,
						assignment_ts: timestamp,
						uid: qrcode_value
					})
					.returning(['id'])
					.executeTakeFirstOrThrow();
				return uid_log_id;
			});
			// console.log('balances :>> ', balances);
			return message(form, {
				text: 'Qrcode Assigned.',
				uid_log_id,
				assignQrcodeInfo
			});
		} catch (e) {
			throw error(400, 'Error: ' + e.message);
		}
	},

};
