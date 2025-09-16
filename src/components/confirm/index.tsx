// https://github.com/ant-design/ant-design/blob/master/components/modal/confirm.tsx
import type React from "react";
import { createRoot } from "react-dom/client";
import { AlertConfirmation } from "./alert-confirmation";
import { AlertController } from "./alert-controller";

export type ConfirmConfig = {
	open?: boolean;
	type?: "warning" | "confirm" | "error";
	title?: string | React.ReactNode;
	description?: string | React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	onConfirm?: () => void;
	onCancel?: () => void;
	onClose?: () => void;
};

type ConfirmInstance = {
	destroy: () => void;
	update: (
		configUpdate:
			| Partial<ConfirmConfig>
			| ((prevConfig: ConfirmConfig) => ConfirmConfig),
	) => void;
};

export default function confirm(config: ConfirmConfig): ConfirmInstance {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	AlertController.getInstance();

	let currentConfig: ConfirmConfig = { ...config, onClose, open: true };

	function render(props: ConfirmConfig): void {
		/**
		 * Sync render blocks React event. Let's make this async.
		 */
		setTimeout(() => {
			root.render(<AlertConfirmation {...props} />);
		});
	}

	// Remove store dialog in global state after close
	function destroy(): void {
		for (let i = 0; i < AlertController.destroyFns.length; i++) {
			const fn = AlertController.destroyFns[i];
			if (fn === onClose) {
				AlertController.destroyFns.splice(i, 1);
				break;
			}
		}
		document.body.removeChild(container);
	}

	function onClose(): void {
		currentConfig = {
			...currentConfig,
			open: false,
		};
		render(currentConfig);
		destroy();
	}

	function update(
		configUpdate:
			| Partial<ConfirmConfig>
			| ((prevConfig: ConfirmConfig) => ConfirmConfig),
	): void {
		if (typeof configUpdate === "function") {
			currentConfig = configUpdate(currentConfig);
		} else {
			currentConfig = {
				...currentConfig,
				...configUpdate,
			};
		}
		render(currentConfig);
	}

	render(currentConfig);

	AlertController.destroyFns.push(onClose);

	return {
		destroy: onClose,
		update,
	};
}
