export type LeftMenuPanelType = {
	value: boolean;
};

export type LoadingDialogType = {
	value: boolean;
};

export type CashBalanceType = {
	value: number;
};

type eventItem = {
	id: number;
	item_name: string;
	item_code: string;
	price: number;
};

export type CurrentEventType = {
	id: number;
	event_name: string;
	event_code: string;
	has_items: boolean;
	price: number;
	event_items?: eventItem[];
    since: number;
};

export type PopupQrScannerOpenedType = {
	value: boolean;
};

export type QrScannerOnScanType = {
	value: (uid: string) => Promise<void>;
};

export type QrScannerTitleType = {
	value: string;
};

export type QrScannerAutostartType = {
	value: boolean;
};
export type ConfirmDialogType = {
	open: boolean;
	title: string;
	description: string;
	cancelButtonText: string;
	confirmButtonText: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export let LeftMenuPanel: LeftMenuPanelType = $state({ value: false });
export let LoadingDialog: LoadingDialogType = $state({ value: false });
export let CashBalance: CashBalanceType = $state({ value: 0 });
export let CurrentEvent: CurrentEventType = $state({
	id: 0,
	event_name: '',
	event_code: '',
	has_items: false,
	price: 0,
    since: 0,
	event_items: []
});
export let PopupQrScannerOpened: PopupQrScannerOpenedType = $state({ value: false });
export let QrScannerOnScan = $state({ value: async (scanResult: string) => {} });
export let QrScannerTitle = $state({ value: 'QR Code Scanner' });
export let QrScannerAutostart = $state({ value: false });
export let ConfirmDialogProps: ConfirmDialogType = $state({
	open: false,
	title: '',
	description: '',
	cancelButtonText: 'Cancel',
	confirmButtonText: 'Confirm',
	onConfirm: () => {},
	onCancel: () => {
		ConfirmDialogProps.open = false;
	}
});

export let PopupRouteProps = $state({
    route:'',
    title: '',
    open: false
})
