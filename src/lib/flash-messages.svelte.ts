import { getFlash } from 'sveltekit-flash-message';
import { page } from '$app/stores';
const flash = getFlash(page);

function showMessage(type: 'success' | 'error', message = 'Success') {
	$flash = { type, message };
}

export { showMessage };
