export type LeftMenuPanelType = {
	value: boolean;
};

export type LoadingDialogType = {
	value: boolean;
};


export const LeftMenuPanel: LeftMenuPanelType = $state({ value: false });
export const LoadingDialog: LoadingDialogType = $state({ value: false });
