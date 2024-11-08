import type { PageServerLoad } from './$types';

export const load = (async ({ params, fetch }) => {
	const { uid } = params;
    const res = await fetch(`/app/api/qrcode/get-cash-balance/${uid}`);
    const balanceData = await res.json();
    return { uid, ...balanceData };

}) satisfies PageServerLoad;
