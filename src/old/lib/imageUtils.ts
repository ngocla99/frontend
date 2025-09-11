// Advanced image processing utilities

export interface ImageCompressionOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	format?: "image/jpeg" | "image/webp" | "image/png";
}

export class ImageProcessor {
	static async compressImage(
		file: File | Blob,
		options: ImageCompressionOptions = {},
	): Promise<Blob> {
		const {
			maxWidth = 1200,
			maxHeight = 1200,
			quality = 0.8,
			format = "image/jpeg",
		} = options;

		return new Promise((resolve, reject) => {
			const img = new Image();
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				reject(new Error("Could not get canvas context"));
				return;
			}

			img.onload = () => {
				// Calculate new dimensions
				let { width, height } = img;

				if (width > maxWidth || height > maxHeight) {
					const ratio = Math.min(maxWidth / width, maxHeight / height);
					width *= ratio;
					height *= ratio;
				}

				canvas.width = width;
				canvas.height = height;

				// Enable image smoothing for better quality
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";

				// Draw and compress
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error("Failed to compress image"));
						}
					},
					format,
					quality,
				);
			};

			img.onerror = () => reject(new Error("Failed to load image"));
			img.src = URL.createObjectURL(file);
		});
	}

	static async createThumbnail(file: File | Blob, size = 150): Promise<Blob> {
		return ImageProcessor.compressImage(file, {
			maxWidth: size,
			maxHeight: size,
			quality: 0.7,
			format: "image/jpeg",
		});
	}

	static async loadImageFromUrl(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
			img.src = url;
		});
	}

	static async urlToBlob(url: string): Promise<Blob> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}
		return response.blob();
	}

	static blobToDataUrl(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () =>
				reject(new Error("Failed to convert blob to data URL"));
			reader.readAsDataURL(blob);
		});
	}

	static dataUrlToBlob(dataUrl: string): Blob {
		const arr = dataUrl.split(",");
		const mime = arr[0].match(/:(.*?);/)![1];
		const bstr = atob(arr[1]);
		let n = bstr.length;
		const u8arr = new Uint8Array(n);
		while (n--) {
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], { type: mime });
	}

	static async applyFilter(
		imageUrl: string,
		filter: "none" | "vintage" | "bw" | "sepia" | "vibrant",
	): Promise<string> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) {
				reject(new Error("Could not get canvas context"));
				return;
			}

			img.onload = () => {
				canvas.width = img.width;
				canvas.height = img.height;

				// Apply CSS filters via canvas
				const filters = {
					none: "",
					vintage: "sepia(0.5) contrast(1.2) brightness(1.1)",
					bw: "grayscale(1)",
					sepia: "sepia(1)",
					vibrant: "contrast(1.3) saturate(1.4) brightness(1.1)",
				};

				ctx.filter = filters[filter];
				ctx.drawImage(img, 0, 0);

				const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
				resolve(dataUrl);
			};

			img.onerror = () => reject(new Error("Failed to load image"));
			img.crossOrigin = "anonymous";
			img.src = imageUrl;
		});
	}

	static getImageDimensions(
		file: File | Blob,
	): Promise<{ width: number; height: number }> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				resolve({ width: img.naturalWidth, height: img.naturalHeight });
			};
			img.onerror = () => reject(new Error("Failed to load image"));
			img.src = URL.createObjectURL(file);
		});
	}

	static async generatePlaceholder(
		width: number,
		height: number,
	): Promise<string> {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (!ctx) throw new Error("Could not get canvas context");

		canvas.width = width;
		canvas.height = height;

		// Create gradient background
		const gradient = ctx.createLinearGradient(0, 0, width, height);
		gradient.addColorStop(0, "#f3f4f6");
		gradient.addColorStop(1, "#e5e7eb");

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		// Add subtle pattern
		ctx.strokeStyle = "#d1d5db";
		ctx.lineWidth = 1;
		for (let i = 0; i < width; i += 20) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, height);
			ctx.stroke();
		}

		return canvas.toDataURL("image/png");
	}
}
