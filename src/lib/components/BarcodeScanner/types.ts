export type Point = {
	x: number;
	y: number;
};

export type CameraSettings = {
	torch: boolean;
	constraints: MediaTrackConstraints;
	shouldStream: boolean;
};

export type ScannerProps = {
	constraints?: MediaTrackConstraints;
	formats?: BarcodeFormat[];
	paused?: boolean;
	torch?: boolean;
	track?: (codes: DetectedBarcode[], ctx: CanvasRenderingContext2D | null) => void;
	onDetect?: (detail: any) => void;
	onCameraOn?: (detail: { detail: MediaTrackCapabilities }) => void;
	onCameraOff?: () => void;
	onError?: (detail: { detail: Error }) => void;
	autostart?: boolean;
};
