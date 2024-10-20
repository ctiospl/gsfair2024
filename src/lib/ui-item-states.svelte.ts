export type LeftMenuPanelType = {
	value: boolean;
};

export type LoadingDialogType = {
	value: boolean;
};

export type CashBalanceType = {
	value: number;
};


export const LeftMenuPanel: LeftMenuPanelType = $state({ value: false });
export const LoadingDialog: LoadingDialogType = $state({ value: false });
export const CashBalance: CashBalanceType = $state({ value: 0 });
