'use client';

import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import axios from 'axios';

interface ProfileImageUploadProps {
	onUploadSuccess?: (url: string) => void;
	currentImageUrl?: string;
	disabled?: boolean;
}

export function ProfileImageUpload({
	onUploadSuccess,
	currentImageUrl,
	disabled = false
}: ProfileImageUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [imageUrl, setImageUrl] = useState<string>(currentImageUrl || '');
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Only image files are allowed');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error('File size must be less than 5MB');
			return;
		}

		setIsUploading(true);

		try {
			const signatureResponse = await axios.post('/api/cloudinary/signature', {
				upload_preset: 'uploadProfilePicture',
				folder: 'profile-pictures'
			});

			if (!signatureResponse.data.success) {
				throw new Error('Failed to get upload signature');
			}

			const { timestamp, signature, api_key, cloud_name } =
				signatureResponse.data;

			const formData = new FormData();
			formData.append('file', file);
			formData.append('upload_preset', 'uploadProfilePicture');
			formData.append('folder', 'profile-pictures');
			formData.append('api_key', api_key);
			formData.append('timestamp', timestamp);
			formData.append('signature', signature);

			const cloudinaryResponse = await axios.post(
				`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
				formData
			);

			if (cloudinaryResponse.data.secure_url) {
				const uploadedUrl = cloudinaryResponse.data.secure_url;
				setImageUrl(uploadedUrl);

				if (onUploadSuccess) {
					onUploadSuccess(uploadedUrl);
				}

				toast.success('Profile picture uploaded successfully!');
			} else {
				throw new Error('Failed to get upload URL');
			}
		} catch (error) {
			console.error('Upload error:', error);
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to upload profile picture'
			);
		} finally {
			setIsUploading(false);

			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const handleButtonClick = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className='flex flex-col items-center gap-4'>
			<div className='relative h-24 w-24 overflow-hidden rounded-full bg-gray-100'>
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt='Profile'
						fill
						sizes='96px'
						className='object-cover'
					/>
				) : (
					<div className='flex h-full w-full items-center justify-center bg-gray-200'>
						<Camera className='h-8 w-8 text-gray-500' />
					</div>
				)}

				{isUploading && (
					<div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
						<Loader2 className='h-8 w-8 animate-spin text-white' />
					</div>
				)}
			</div>

			<input
				type='file'
				ref={fileInputRef}
				onChange={handleFileChange}
				accept='image/*'
				className='hidden'
				aria-label='Upload Profile Picture'
			/>

			<Button
				type='button'
				variant='outline'
				size='sm'
				onClick={handleButtonClick}
				disabled={disabled || isUploading}>
				{isUploading
					? 'Uploading...'
					: imageUrl
					? 'Change Picture'
					: 'Upload Picture'}
			</Button>
		</div>
	);
}
