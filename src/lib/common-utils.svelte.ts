import { CurrentEvent, LoadingDialog } from '$lib/ui-item-states.svelte';

import { eventLS } from '$lib/web-storage.svelte.js';
import { page } from '$app/stores';
import { showMessage } from '$lib/flash-messages.svelte';

export async function SetEvent(eventCode: string, resetSince?: false) {
	LoadingDialog.open = true;
	const res = await fetch(`/app/api/events/${eventCode}`);
	const data = await res.json();
	if ('error' in data) {
		LoadingDialog.open = false;
		return showMessage(page, { type: 'error', text: data.message });
	}
	CurrentEvent.id = data.id;
	CurrentEvent.event_name = data.event_name;
	CurrentEvent.event_code = data.event_code;
	CurrentEvent.has_items = data.has_items;
	CurrentEvent.price = data.price;
	CurrentEvent.since = (Date.now() / 1000) | 0;

	CurrentEvent.event_items = data.event_items;
	eventLS.set({
        event_name: data.event_name,
        event_code: data.event_code,
        event_id: data.id,
        since: CurrentEvent.since

    })
	LoadingDialog.open = false;
	console.log('CurrentEvent :>> ', $state.snapshot(CurrentEvent));
}
