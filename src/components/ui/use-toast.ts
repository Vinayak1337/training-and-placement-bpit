'use client';

import { toast as reactToastify } from 'react-toastify';

type ToastProps = {
	title?: string;
	description?: string;
	variant?: 'default' | 'destructive';
};


export function useToast() {
	const toast = ({ title, description, variant = 'default' }: ToastProps) => {
		const message = title
			? description
				? `${title}: ${description}`
				: title
			: description;

		if (!message) return;

		if (variant === 'destructive') {
			return reactToastify.error(message, {
				position: 'top-right',
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true
			});
		}

		return reactToastify.success(message, {
			position: 'top-right',
			autoClose: 5000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true
		});
	};

	return { toast };
}
