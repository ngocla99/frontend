export class AlertController {
	private static instance: AlertController | null = null;
	static destroyFns: Array<() => void> = [];

	private constructor() {}

	static getInstance(): AlertController {
		if (!AlertController.instance) {
			AlertController.instance = new AlertController();
		}
		return AlertController.instance;
	}

	static destroyAll(): void {
		while (AlertController.destroyFns.length) {
			const onClose = AlertController.destroyFns.pop();
			if (onClose) {
				onClose();
			}
		}
	}

	static addDestroyFn(fn: () => void): void {
		AlertController.destroyFns.push(fn);
	}
}
