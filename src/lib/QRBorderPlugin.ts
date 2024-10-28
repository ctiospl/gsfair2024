// QRBorderPlugin.ts

export type Position = 'top' | 'bottom' | 'left' | 'right';

export interface Decoration {
	type: 'text' | 'image';
	value: string;
	style?: string;
}

export interface BorderOptions {
	color: string;
	thickness: number;
	dasharray?: string;
	round?: number; // Value between 0 and 1 for corner roundness
	borderInner?: BorderOptions;
	borderOuter?: BorderOptions;
	decorations?: { [key in Position]?: Decoration };
}

export interface SizeOptions {
	width: number;
	height: number;
}

export function QRBorderPlugin(options: BorderOptions) {
	return (svg: SVGSVGElement, sizeOptions: SizeOptions) => {
		const { width, height } = sizeOptions;

		const createRectElement = (): SVGRectElement => {
			return document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		};

		const setAttributes = (element: Element, attributes: { [key: string]: string | number }) => {
			Object.keys(attributes).forEach((key) => {
				element.setAttribute(key, `${attributes[key]}`);
			});
		};

		const getRectAttributes = (
			width: number,
			height: number,
			options: BorderOptions,
			round: number
		) => {
			const size = Math.min(width, height);
			const rx = Math.max(0, (size / 2) * round - options.thickness / 2);
			return {
				fill: 'none',
				x: (width - size + options.thickness) / 2,
				y: (height - size + options.thickness) / 2,
				width: size - options.thickness,
				height: size - options.thickness,
				stroke: options.color,
				'stroke-width': options.thickness,
				'stroke-dasharray': options.dasharray || '',
				rx: rx
			};
		};

		// Main border rectangle
		const rect = createRectElement();
		const rectAttributes = getRectAttributes(width, height, options, options.round || 0);
		setAttributes(rect, rectAttributes);
		svg.appendChild(rect);

		// Inner border
		if (options.borderInner) {
			const innerRect = createRectElement();
			const innerOptions = options.borderInner;
			const innerAttributes = getRectAttributes(width, height, innerOptions, options.round || 0);

			// Adjust positions for inner border
			innerAttributes.x = +innerAttributes.x - innerOptions.thickness + options.thickness;
			innerAttributes.y = +innerAttributes.y - innerOptions.thickness + options.thickness;
			innerAttributes.width =
				+innerAttributes.width + 2 * (innerOptions.thickness - options.thickness);
			innerAttributes.height =
				+innerAttributes.height + 2 * (innerOptions.thickness - options.thickness);
			innerAttributes.rx = Math.max(
				0,
				+innerAttributes.rx + innerOptions.thickness - options.thickness
			);

			setAttributes(innerRect, innerAttributes);
			svg.appendChild(innerRect);
		}

		// Outer border
		if (options.borderOuter) {
			const outerRect = createRectElement();
			const outerAttributes = getRectAttributes(
				width,
				height,
				options.borderOuter,
				options.round || 0
			);
			setAttributes(outerRect, outerAttributes);
			svg.appendChild(outerRect);
		}

		// Decorations
		if (options.decorations) {
			for (const position in options.decorations) {
				const decoration = options.decorations[position as Position];
				if (decoration) {
					if (decoration.type === 'text') {
						addTextDecoration({
							svg,
							position: position as Position,
							thickness: options.thickness,
							value: decoration.value,
							style: decoration.style,
							width,
							height,
							round: options.round || 0
						});
					} else if (decoration.type === 'image') {
						addImageDecoration({
							svg,
							position: position as Position,
							thickness: options.thickness,
							value: decoration.value,
							style: decoration.style,
							width,
							height
						});
					}
				}
			}
		}
	};
}

interface TextDecorationOptions {
	svg: SVGSVGElement;
	position: Position;
	thickness: number;
	value: string;
	style?: string;
	width: number;
	height: number;
	round: number;
}

function addTextDecoration(options: TextDecorationOptions) {
	const { svg, position, thickness, value, style, width, height, round } = options;

	// Create <defs> if not present
	let defs = svg.querySelector('defs');
	if (!defs) {
		defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		svg.appendChild(defs);
	}

	// Create a path for the text to follow
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	const size = Math.min(width, height);
	const cornerRadius = ((size - thickness) / 2) * round;
	let transform = '';
	let flip = false;
	let rotate = 0;

	switch (position) {
		case 'top':
			// No transformation needed
			break;
		case 'right':
			rotate = 90;
			break;
		case 'bottom':
			flip = true;
			break;
		case 'left':
			rotate = 90;
			flip = true;
			break;
	}

	if (rotate) {
		transform += `rotate(${rotate}, ${width / 2}, ${height / 2}) `;
	}
	if (flip) {
		transform += `scale(1 -1) translate(0 ${-height}) `;
	}

	path.setAttribute('id', `${position}-text-path`);
	path.setAttribute('transform', transform);

	// Define the path data
	const x = (width - size + thickness) / 2;
	const y = (height - size + thickness) / 2 + cornerRadius;
	const d = `
    M${x},${y}
    a${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},${-cornerRadius}
    h${size - thickness - 2 * cornerRadius}
    a${cornerRadius},${cornerRadius} 0 0 1 ${cornerRadius},${cornerRadius}
  `;
	path.setAttribute('d', d.trim());

	defs.appendChild(path);

	// Create the text element
	const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	if (style) {
		text.setAttribute('style', style);
	}

	// Create the textPath
	const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
	textPath.setAttribute('href', `#${position}-text-path`);
	textPath.setAttribute('startOffset', '50%');
	textPath.setAttribute('text-anchor', 'middle');
	textPath.setAttribute('alignment-baseline', 'central');
	textPath.textContent = value;

	text.appendChild(textPath);
	svg.appendChild(text);
}

interface ImageDecorationOptions {
	svg: SVGSVGElement;
	position: Position;
	thickness: number;
	value: string;
	style?: string;
	width: number;
	height: number;
}

function addImageDecoration(options: ImageDecorationOptions) {
	const { svg, position, thickness, value, style, width, height } = options;

	const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
	const size = Math.min(width, height);

	let x = (width - size + thickness) / 2;
	let y = (height - size + thickness) / 2;

	const imageSize = size - thickness;

	switch (position) {
		case 'top':
			x += (imageSize - thickness) / 2;
			break;
		case 'right':
			x += imageSize - thickness;
			y += (imageSize - thickness) / 2;
			break;
		case 'bottom':
			x += (imageSize - thickness) / 2;
			y += imageSize - thickness;
			break;
		case 'left':
			y += (imageSize - thickness) / 2;
			break;
	}

	image.setAttribute('href', value);
	image.setAttribute('x', `${x}`);
	image.setAttribute('y', `${y}`);
	if (style) {
		image.setAttribute('style', style);
	}
	svg.appendChild(image);
}
