import type { RequestHandler } from './$types';
import { db, log } from '$lib/server/db.js';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const { searchVal, type } = params;

	const visitors = await db
		.selectFrom('visitor_registration as vr')
		// .leftJoin('visitor_registration as vri', 'vri.master_user_id', 'vr.id')
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
		.$if(isNumeric(searchVal), (qb) => qb.where('vr.phone', 'like', `%${searchVal}%`))
		.$if(type === 'qrcode', (qb) => qb.where('vr.uid', '=', searchVal))
		.$if(!isNumeric(searchVal) && type !== 'qrcode', (qb) =>
			qb.where('vr.name', 'like', `%${searchVal}%`)
		)
		// .$call(log)

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
	return json(items);

    function isNumeric(num) {
			return !isNaN(num);
		}

	function isNummber(input) {
		// Check if the input is a string
		if (typeof input !== 'string') {
			return 'Not a string';
		}

		// Try to convert the string to a number
		const number = parseFloat(input);

		// Check if the conversion is successful and the input is not an empty string
		if (!isNaN(number) && input.trim() !== '') {
			return 'Number';
		} else {
			return 'String';
		}
	}

	return new Response();
};
