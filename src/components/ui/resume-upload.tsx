'use client';

import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useResumeUpload } from '@/hooks/useResumeUpload';
import { Copy, Download, ExternalLink, Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

interface ResumeUploadProps {
	onUploadSuccess?: (url: string) => void;
	initialUrl?: string;
	disabled?: boolean;
	autoOpen?: boolean;
}

export function ResumeUpload({
	onUploadSuccess,
	initialUrl = '',
	disabled = false,
	autoOpen = false
}: ResumeUploadProps) {
	const [fileUrl, setFileUrl] = useState<string>(initialUrl);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Log initial URL for debugging
	useEffect(() => {
		console.log('ResumeUpload initialized with URL:', initialUrl);
		if (initialUrl) {
			setFileUrl(initialUrl);
		}
	}, [initialUrl]);

	const { uploadResume, isUploading } = useResumeUpload({
		onSuccess: url => {
			setFileUrl(url);
			if (onUploadSuccess) {
				onUploadSuccess(url);
			}
			toast.success('Resume uploaded successfully!');
		}
	});

	const handleButtonClick = () => {
		fileInputRef.current?.click();
	};

	useEffect(() => {
		if (autoOpen && fileInputRef.current && !disabled && !fileUrl) {
			setTimeout(() => {
				handleButtonClick();
			}, 500);
		}
	}, [autoOpen, disabled, fileUrl]);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		await uploadResume(file);

		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleCopyUrl = () => {
		if (fileUrl) {
			navigator.clipboard.writeText(fileUrl);
			toast.success('URL copied to clipboard');
		}
	};

	const handleOpenPdf = () => {
		if (fileUrl) {
			window.open(fileUrl, '_blank');
			toast.success('PDF opened in a new tab');
		}
	};

	const handleDownloadPdf = () => {
		if (fileUrl) {
			const link = document.createElement('a');
			link.href = fileUrl;
			link.download = fileUrl.split('/').pop() || 'resume.pdf';
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toast.success('Download started');
		}
	};

	return (
		<div className='space-y-4'>
			<input
				type='file'
				ref={fileInputRef}
				onChange={handleFileChange}
				accept='application/pdf'
				className='hidden'
				aria-label='Upload Resume'
			/>

			<Button
				type='button'
				variant='outline'
				onClick={handleButtonClick}
				disabled={disabled || isUploading}
				className='w-full'>
				{isUploading ? (
					<>
						<Loader2 className='h-4 w-4 mr-2 animate-spin' /> Uploading...
					</>
				) : fileUrl ? (
					<>
						<Upload className='h-4 w-4 mr-2' /> Update Resume
					</>
				) : (
					<>
						<Upload className='h-4 w-4 mr-2' /> Upload Resume (PDF only)
					</>
				)}
			</Button>

			{fileUrl && (
				<div className='relative'>
					<Input value={fileUrl} readOnly className='pr-24' />
					<div className='absolute right-1 top-1/2 -translate-y-1/2 flex space-x-1'>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							onClick={handleCopyUrl}
							className='h-7 w-7'>
							<Copy className='h-3.5 w-3.5' />
						</Button>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							onClick={handleOpenPdf}
							className='h-7 w-7'>
							<ExternalLink className='h-3.5 w-3.5' />
						</Button>
						<Button
							type='button'
							variant='ghost'
							size='icon'
							onClick={handleDownloadPdf}
							className='h-7 w-7'>
							<Download className='h-3.5 w-3.5' />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
