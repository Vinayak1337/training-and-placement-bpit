import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface UseResumeUploadOptions {
	onSuccess?: (url: string) => void;
	onError?: (error: Error) => void;
}

interface UseResumeUploadReturn {
	uploadResume: (file: File) => Promise<string | null>;
	isUploading: boolean;
	error: Error | null;
}

/**
 * Hook for uploading resume files to Cloudinary
 *
 * @param options Optional callbacks for success/error handling
 * @returns Object with upload function and state
 */
export function useResumeUpload(
	options?: UseResumeUploadOptions
): UseResumeUploadReturn {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	/**
	 * Upload a resume file to Cloudinary and get the public URL
	 *
	 * @param file The File object to upload
	 * @returns The public URL of the uploaded file or null if upload failed
	 */
	const uploadResume = async (file: File): Promise<string | null> => {
		setError(null);
		setIsUploading(true);

		try {
			if (file.type !== 'application/pdf') {
				throw new Error('Only PDF files are allowed');
			}

			if (file.size > 2 * 1024 * 1024) {
				throw new Error('File size must be less than 2MB');
			}

			if (file.size === 0) {
				throw new Error('Cannot upload an empty file');
			}

			const formData = new FormData();
			formData.append('file', file);

			const response = await axios.post('/api/resume/upload', formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});

			if (!response.data.success) {
				throw new Error(response.data.message || 'Failed to upload resume');
			}

			const { url } = response.data;

			if (options?.onSuccess) {
				options.onSuccess(url);
			}

			return url;
		} catch (err) {
			let errorMessage = 'Unknown error occurred during upload';

			if (axios.isAxiosError(err) && err.response) {
				const responseData = err.response.data;
				errorMessage = responseData.message || err.message || errorMessage;
			} else if (err instanceof Error) {
				errorMessage = err.message;
			}

			const error = new Error(errorMessage);
			setError(error);

			if (options?.onError) {
				options.onError(error);
			}

			toast.error(errorMessage);

			return null;
		} finally {
			setIsUploading(false);
		}
	};

	return {
		uploadResume,
		isUploading,
		error
	};
}
