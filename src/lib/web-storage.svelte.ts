import { web_storage } from 'svelte-web-storage'

interface scannersSettingsType {
	selectedCamera: string | undefined;
	zoomLevel: number;
    formats: string[];
}
interface eventType {
    event_code: string | undefined;
    event_name: string | undefined;
    since: number | undefined;
}
export const scannerSettings = web_storage<scannersSettingsType>('scannerSettings', {
	selectedCamera: undefined,
	zoomLevel: 2,
    formats: ['QR_CODE']
});

export const eventLS = web_storage<eventType>('eventLS', {
	event_code: '',
    event_name: '',
    since: 0,
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
