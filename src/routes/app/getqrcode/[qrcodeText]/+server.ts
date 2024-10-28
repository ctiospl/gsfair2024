import type { RequestHandler } from './$types';
import QRCode from 'qrcode';

export const GET: RequestHandler = async ({ params }) => {
	const { qrcodeText } = params;
	const qrCode = await QRCode.toDataURL(qrcodeText);
	const base64Response = await fetch(qrCode);

	return new Response(await base64Response.blob(), {
		status: 200,
		statusText: 'OK',
		headers: {
			'Content-Type': 'image/png'
		}
	});
};
