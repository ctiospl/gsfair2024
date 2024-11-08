import { z } from 'zod';

const phoneRegex = new RegExp(/^\d{10}$/);
export const authSchema = z.object({
	username: z
		.string()
		.min(5, { message: 'Must be 5 or more characters long' })
		.max(31, { message: 'Max 31 characters long' })
		.regex(/^[a-z0-9_-]{4,31}$/, 'Invalid username')
		.refine((s) => !s.includes(' '), 'No Spaces Allowed!'),
	password: z
		.string()
		.min(8, { message: 'Must be 8 or more characters long' })
		.max(128, { message: 'Max 128 characters long' })
		.refine((s) => !s.includes(' '), 'No Spaces Allowed!'),
	firstname: z.string().min(1, { message: 'First Name is required' }),
	lastname: z.string().min(1, { message: 'Last Name is required' }),
	email: z.string().email(),
	phone: z.string().regex(phoneRegex, 'Invalid Number!')
});

export const loginSchema = z.object({
	username: z.string(),
	password: z.string()
});

export const resetAuthSchema = z.object({
	phone: z.string().regex(phoneRegex, 'Invalid Number!')
});
export const newPasswordSchema = z
	.object({
		password: z
			.string()
			.min(8, { message: 'Must be 8 or more characters long' })
			.max(128, { message: 'Max 128 characters long' })
			.refine((s) => !s.includes(' '), 'No Spaces Allowed!'),
		confirmPassword: z
			.string()
			.min(8, { message: 'Must be 8 or more characters long' })
			.max(128, { message: 'Max 128 characters long' })
			.refine((s) => !s.includes(' '), 'No Spaces Allowed!')
	})
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				code: 'custom',
				message: 'The passwords did not match',
				path: ['confirmPassword']
			});
		}
	});


export const cashSettlementSchema = z.object({
	volunteer_id: z.string(),
	settlement_amount: z.number()
});
export const cashIssueSchema = z.object({
	volunteer_id: z.string(),
	issue_amount: z.number()
});

export const refundIssueSchema = z.object({
	visitor_id: z.number(),
	refund_amount: z.number()
});

export const balanceTransferScheme = z.object({
	transferFromId: z.number(),
	transferToId: z.number(),
	from_balance: z.number()
});

export const visitorQrCodeSchema = z.object({
	visitor_id: z.number(),
	qrcode_value: z.number()
});

export const assignQrCodeSchema = z.object({
	visitor_id: z.number(),
	qrcode_value: z.string()
});


export const guestSchema = z.array(
	z.object({
		name: z.string().refine((val) => val.length > 0, { message: 'Name cannot be empty' }),
		is_child: z.boolean().default(false),
		recharge_amt: z.number().default(0).optional(),
		from_gs: z.boolean().default(false),
		group_qr: z.boolean().default(false),
		is_volunteer: z.boolean().default(false),
		is_guest: z.boolean().default(false)
	})
);

export const visitorSchema = z.object({
	name: z.string().refine((val) => val.length > 0, { message: 'Name cannot be empty' }),
	number_of_guests: z.number(),
	guests: guestSchema,
	email: z.union([z.literal(''), z.string().email()]).optional(),
	phone: z.string().regex(phoneRegex, 'Invalid Number!'),
	area: z.string().default('').optional(),
	payment_method: z.string(),
	payment_status: z.boolean(),
	payment_amount: z.number(),
	eventId: z.number(),
	is_child: z.boolean().default(false),
	recharge_amt: z.number().default(0).optional(),
	registration_amount: z.number(),
	from_gs: z.boolean().default(false),
	group_qr: z.boolean().default(false),
	hear_about_us: z.string().default('').optional(),
	is_volunteer: z.boolean().default(false),
	is_guest: z.boolean().default(false)
});


export const rechargeSchema = z.object({
	recharge_amt: z.number(),
	payment_method: z.string(),
	uid: z.string(),
	event_id: z.number(),
	uuid: z.string()
});

export const collectionItemsSchema = z.array(
	z.object({
		units: z.number().default(0),
		price: z.number(),
		event_item_id: z.number(),
		item_code: z.string(),
		item_name: z.string()
	})
);

export const collectionSchema = z.object({
	payment_method: z.string(),
	total_amount: z.number(),
	guest_id: z.number(),
    guest_sub_id: z.number(),
	is_child: z.boolean(),
	volunteer_id: z.number(),
	event_id: z.number(),
	has_items: z.boolean(),
	items: collectionItemsSchema,
	recharge_amt: z.number().default(0).optional(),
	recharge_payment_method: z.string().default('').optional(),
	use_qrcode_balance: z.boolean().default(false).optional()
});

export const setEventSchema = z.object({
	volunteer_id: z.string(),
	event_code: z.string()
});
