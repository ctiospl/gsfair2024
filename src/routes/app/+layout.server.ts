import { redirect } from '@sveltejs/kit';
export const load = async ({ locals }) => {
    // console.log('locals :>> ', locals);
    // console.log('locals.user :>> ', locals.user);
	if (!locals.user) {
		redirect(302, '/login');
	}
    return { user: locals.user};
};
