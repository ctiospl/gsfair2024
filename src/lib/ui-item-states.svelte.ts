export type LeftMenuPanelType = {
	value: boolean;
};

export type LoadingDialogType = {
	value: boolean;
};

export type CashBalanceType = {
	value: number;
};

export type CurrentEventIdType = {
	value: number;
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



export let LeftMenuPanel: LeftMenuPanelType = $state({ value: false });
export let LoadingDialog: LoadingDialogType = $state({ value: false });
export let CashBalance: CashBalanceType = $state({ value: 0 });
export let CurrentEventId: CurrentEventIdType = $state({ value: 0 });
export let PopupQrScannerOpened: PopupQrScannerOpenedType = $state({ value: false });
export let QrScannerOnScan = $state({ value: () => {} });
export let QrScannerTitle = $state({ value: 'QR Code Scanner'});
export let QrScannerAutostart = $state({ value: false });
