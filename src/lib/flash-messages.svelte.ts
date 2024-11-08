import { page as Page } from '$app/stores';
import { getFlash } from 'sveltekit-flash-message';
interface MessageParams {
	type?: string;
	title?: string;
	text?: string;
}

function showMessage(page: typeof Page, params: MessageParams) {
	const { type = 'error', title, text = 'error' } = params;
	const flash = getFlash(page);
	flash.set({ type: type as 'error' | 'success', message: { title: title || '', text } });
}

export { showMessage };
