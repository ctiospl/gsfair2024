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

export const addAdvancePackingSchema = z.object({
	pid: z.number(),
	qty: z.number(),
	for_fba: z.boolean(),
	req_by: z.string(),
	sku: z.string(),
	lsi: z.number()
});

export const cancelAdvancePackingSchema = z.object({
	pid: z.number(),
	adv_req_id: z.number(),
	qty: z.number()
});

// export type LoginSchema = typeof loginSchema;
export const processingActiveDataSchema = z.object({
	addToRack: z
		.object({
			product_id: z.number(),
			processing_id: z.number(),
			rack_id: z.string(),
			batch_id: z.string(),
			rack_qty: z.number(),
			wasteage: z.number(),
			wasteage_percentage: z.string()
		})
		.optional(),
	cancel: z
		.object({
			lot_no: z.string()
		})
		.optional()
});
export const packingDataSchema = z.object({
	addNew: z
		.object({
			pid: z.number(),
			to_pack_qty: z.number(),
			package_type: z.string(),
			lot_no: z.string().or(z.null()).optional(),
			uuid: z.string().uuid(),
			adv_req_id: z.number(),
			is_advance: z.boolean(),
			for_fba: z.boolean(),
			elements_rack_info: z.array(
				z.object({
					pid: z.number(),
					rack_info: z.array(
						z.object({
							rack_id: z.string(),
							rack_qty: z.number(),
							batch_id: z.string()
						})
					)
				})
			),
			total_packed_units: z.number()
		})
		.optional(),
	addToRack: z
		.object({
			rack_id: z.string(),
			batch_id: z.string(),
			rack_qty: z.number(),
			uuid: z.string().uuid()
		})
		.optional(),
	cancel: z
		.object({
			lot_no: z.string(),
			balance_to_pack: z.number(),
			uuid: z.string().uuid(),
			is_advance: z.boolean(),
			adv_req_id: z.number()
		})
		.optional()
});

export const packingAddToRackDataSchema = z.object({
	rack_id: z.string(),
	batch_id: z.string(),
	rack_qty: z.number(),
	uuid: z.string().uuid(),
	type: z.string(),
	pid: z.number(),
	adv_req_id: z.number()
});
export const packingHistorySchema = z.object({
	addToRack: z
		.object({
			rack_id: z.string(),
			batch_id: z.string(),
			rack_qty: z.number(),
			uuid: z.string().uuid(),
			type: z.string(),
			pid: z.number(),
			adv_req_id: z.number()
		})
		.optional(),
	cancelLotNo: z
		.object({
			lot_no: z.string(),
			balance_to_pack: z.number(),
			uuid: z.string().uuid(),
			is_advance: z.boolean(),
			adv_req_id: z.number(),
			type: z.string(),
			pid: z.number()
		})
		.optional()
});

export const packingCancelLotNoSchema = z.object({
	rack_id: z.string(),
	batch_id: z.string(),
	rack_qty: z.number(),
	uuid: z.string().uuid(),
	type: z.string(),
	pid: z.number(),
	adv_req_id: z.number(),
	lot_no: z.string(),
	balance_to_pack: z.number(),
	is_advance: z.boolean()
});

export const packingLogSchema = z.object({
	lot_no: z.string(),
	userid: z.number(),
	packed_ts: z.number(),
	pid: z.number(),
	uuid: z.string().uuid()
});

export const getPurchaseInfoSchema = z.object({
	purchase_id: z.string()
});

export const searchQuerySchema = z.object({
	query: z.string(),
	type: z.string().optional(),
	marketplace: z.string().optional()
});

export const processingDataSchema = z.object({
	product_id: z.number(),
	in_qty: z.number().optional().default(0),
	out_qty: z.number().optional().default(0),
	processing_status: z.string(),
	output_log_id: z.number().optional(),
	rack_log_id: z.number().optional(),
	wastage_log_id: z.number().optional(),
	ts: z.number()
});

const rawMaterialRackInfo = z.object({
	rack_id: z.string(),
	batch_id: z.string(),
	qty: z.number()
});

const rawMaterial = z.object({
	pid: z.number(),
	rack_info: z.array(rawMaterialRackInfo),
	qty: z.number()
});

export const processingStartDataSchema = z.object({
	rawMaterials: z.array(rawMaterial),
	pid: z.number()
});

export const registerSchema = z.object({
	name: z.string().min(2),
	email: z.string().email()
});

export const profileSchema = z.object({
	name: z.string().min(2),
	age: z.number().gte(16).default(18)
});
