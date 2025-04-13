'use client';

import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Copy, Download, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';

interface CloudinaryUploadProps {
	onUploadSuccess?: (url: string) => void;
	disabled?: boolean;
	autoOpen?: boolean;
}

export function CloudinaryUpload({
	onUploadSuccess,
	disabled = false,
	autoOpen = false
}: CloudinaryUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [fileUrl, setFileUrl] = useState<string>('');
	const fileInputRef = useRef<HTMLInputElement>(null);
	const effectRan = useRef(false);

	const handleButtonClick = () => {
		fileInputRef.current?.click();
	};

	
	useEffect(() => {
		if (autoOpen && !effectRan.current && !disabled) {
			setTimeout(() => {
				handleButtonClick();
				effectRan.current = true;
			}, 500);
		}
	}, [autoOpen, disabled]);

	
	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		
		if (file.type !== 'application/pdf') {
			toast.error('Only PDF files are allowed');
			return;
		}

		if (file.size > 2 * 1024 * 1024) {
			toast.error('File size must be less than 2MB');
			return;
		}

		
		if (file.size === 0) {
			toast.error('Cannot upload an empty file');
			return;
		}

		setIsUploading(true);

		try {
			
			
			const formData = new FormData();
			formData.append('file', file);

			
			console.log('Uploading PDF to server API...');
			const uploadResponse = await axios.post(
				'/api/cloudinary/upload-pdf',
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				}
			);

			if (!uploadResponse.data.success) {
				throw new Error(uploadResponse.data.message || 'Failed to upload PDF');
			}

			console.log('Server response:', uploadResponse.data);

			
			const uploadedUrl = uploadResponse.data.url;
			if (!uploadedUrl) {
				throw new Error('No URL provided in response');
			}

			setFileUrl(uploadedUrl);

			
			if (onUploadSuccess) {
				onUploadSuccess(uploadedUrl);
			}

			toast.success('Resume uploaded successfully!');
			console.log('PDF URL:', uploadedUrl);
		} catch (error) {
			console.error('Upload error:', error);

			
			if (axios.isAxiosError(error) && error.response) {
				console.error('API error details:', error.response.data);
				const errorMessage = error.response.data?.message || error.message;
				toast.error(`Upload failed: ${errorMessage}`);
			} else {
				toast.error(
					error instanceof Error ? error.message : 'Failed to upload resume'
				);
			}
		} finally {
			setIsUploading(false);
			
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const handleCopyUrl = () => {
		if (fileUrl) {
			navigator.clipboard.writeText(fileUrl);
			toast.success('URL copied to clipboard');
		}
	};

	const handleOpenPdf = async () => {
		if (!fileUrl) return;

		try {
			
			const proxyUrl = fileUrl.replace('/upload/', '/pdf-proxy/');
			window.open(proxyUrl, '_blank');

			toast.success('PDF opened in a new tab');
		} catch (error) {
			console.error('Error opening PDF:', error);
			toast.error('Error opening PDF. Try the download button.');
		}
	};

	const handleDownloadPdf = async () => {
		if (!fileUrl) return;

		try {
			
			const downloadUrl = `/api/pdf-proxy/download?url=${encodeURIComponent(
				fileUrl
			)}`;

			
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = fileUrl.split('/').pop() || 'resume.pdf';
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toast.success('Download started');
		} catch (error) {
			console.error('Error downloading PDF:', error);
			toast.error('Error downloading PDF');
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
				) : (
					'Upload Resume (PDF only)'
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
