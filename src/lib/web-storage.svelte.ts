import { web_storage } from 'svelte-web-storage'

interface scannersSettingsType {
	selectedCamera: string | undefined;
	zoomLevel: number;
}
interface eventType {
    event_name: string | undefined;
    event_id: string | undefined;
}
export const scannerSettings = web_storage<scannersSettingsType>('scannerSettings', {
	selectedCamera: undefined,
	zoomLevel: 2
});

export const event = web_storage<eventType>('event', {
	event_name: undefined,
	event_id: undefined
});

// export let scannerSettings = {
//     get selectedCamera() {
//         return scanner.get('selectedCamera');
//     },
//     set selectedCamera(value) {
//         scanner.set('selectedCamera', value);
//     },
//     get zoomLevel() {
//         return scanner.get('zoomLevel');
//     },
//     set zoomLevel(value) {
//         scanner.set('zoomLevel', value);
//     }
// }
