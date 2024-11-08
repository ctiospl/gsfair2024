export type LeftMenuPanelType = {
    value: boolean;
};

export type LoadingDialogType = {
    open: boolean;
    text: string;
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
export let LoadingDialog: LoadingDialogType = $state({ open: false, text: '' });
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
export let QrScannerOnScan = $state({ value: async (scanResult: string) => { } });
export let QrScannerTitle = $state({ value: 'QR Code Scanner' });
export let QrScannerAutostart = $state({ value: false });
export let ConfirmDialogProps: ConfirmDialogType = $state({
    open: false,
    title: '',
    description: '',
    cancelButtonText: 'Cancel',
    confirmButtonText: 'Confirm',
    onConfirm: () => { },
    onCancel: () => {
        ConfirmDialogProps.open = false;
    }
});

export let PopupRouteProps = $state({
    route: '',
    title: '',
    open: false,
    params: {},
    nested: {
        open: false,
        route: '',
        title: '',
        params: {}
    }
})

export let selectedCameraId = $state({ value: '' });

type PaymentItem = {
    name: string;
    amount: number;
    units: number;
}

export let PopupPaymentProps = $state({
    open: false,
    title: '',
    items: [] as PaymentItem[],
    total_amount: 0,
    use_qrcode_balance: false,
    qrcode_balance: 0,
    guest_id: 0,
    guest_name: '',
    payment_method: '',
    recharge_amt: 0,
    recharge_payment_method: '',
    nested: {
        open: false,
    },
    qrcode_text: '',
    qrcode_message: '',
    onConfirm: async (param: string) => { }
});


export function ResetPopupPaymentProps() {
    PopupPaymentProps.title = '';
    PopupPaymentProps.items = [];
    PopupPaymentProps.total_amount = 0;
    PopupPaymentProps.use_qrcode_balance = false;
    PopupPaymentProps.qrcode_balance = 0;
    PopupPaymentProps.guest_id = 0;
    PopupPaymentProps.guest_name = '';
    PopupPaymentProps.payment_method = '';
    PopupPaymentProps.recharge_amt = 0;
    PopupPaymentProps.recharge_payment_method = '';
    PopupPaymentProps.nested = {
        open: false
    };
    PopupPaymentProps.qrcode_text = '';
    PopupPaymentProps.qrcode_message = '';
    PopupPaymentProps.onConfirm = async (param: string) => { };
}
