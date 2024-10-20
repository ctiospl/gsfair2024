import { z } from 'zod';

const phoneRegex = new RegExp(/^\d{10}$/);

export const assignDeliverySchema = z.object({
	delivery_executive_id: z.number().positive({ message: 'Cannot assign the delivery to nobody. Please select a delivery executive.' }),
	order_id: z.number(),
	delivery_notes: z.string().or(z.null()).optional()
});

export const addNewOrderSchema = z.object({
	shippingAddressId: z.number(),
	ordernotes: z.string().or(z.null()).optional(),
	orderitems: z.array(
		z.object({
			title: z.string(),
			pid: z.number(),
			qty: z.number(),
			price: z.number(),
			discount: z.number().optional().default(0),
			tax: z.number().optional().default(0),
			total: z.number(),
			lsi: z.number()
		})
	),
	shippingAddress: z.object({
		shipaddress1: z.string(),
		shipaddress2: z.string(),
		shipcity: z.string(),
		shipcompany: z.string(),
		shipcountry: z.string(),
		shipcountryid: z.number(),
		shipcustomerid: z.number(),
		shipdestination: z.string(),
		shipfirstname: z.string(),
		shipid: z.number(),
		shiplastname: z.string(),
		shiplastused: z.number(),
		shipphone: z.string(),
		shipstate: z.string(),
		shipstateid: z.number(),
		shipzip: z.string()
	}),
	customerInfo: z.object({
		customerid: z.number(),
		custconcompany: z.string(),
		custconfirstname: z.string(),
		custconlastname: z.string(),
		custconemail: z.string(),
		custconphone: z.string()
	})
});

export const updateProductsSchema = z.object({
	orderid: z.number(),
	ordernotes: z.string().or(z.null()).optional(),
	orderitems: z.array(
		z.object({
			orderprodid: z.number().optional(),
			title: z.string(),
			pid: z.number(),
			qty: z.number(),
			price: z.number(),
			discount: z.number().optional().default(0),
			tax: z.number().optional().default(0),
			total: z.number(),
			lsi: z.number(),
			order_address_id: z.number()
		})
	),
	delete_pids: z.array(z.number()).optional()
});

export const updatePaymentMethodSchema = z.object({
	orderid: z.number(),
	payment_module: z.string(),
	payment_method: z.string()
});

export const updateOrderStatusSchema = z.object({
	orderid: z.number(),
	status: z.number()
});

export const updateShippingSchema = z.object({
	orderid: z.number(),
	shipping_method: z.string(),
	shipping_amount: z.number()
});
