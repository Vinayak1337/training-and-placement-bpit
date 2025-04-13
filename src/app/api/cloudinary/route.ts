import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true
});

export const maxDuration = 60;

interface CloudinaryResult {
	secure_url: string;
	public_id: string;
	bytes: number;
	format: string;
	resource_type: string;
	created_at: string;
}

interface CloudinaryError {
	error?: {
		message?: string;
		[key: string]: unknown;
	};
	response?: {
		data?: unknown;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 });
		}

		if (file.type !== 'application/pdf') {
			return NextResponse.json(
				{ error: 'Only PDF files are allowed' },
				{ status: 400 }
			);
		}

		if (file.size > 2 * 1024 * 1024) {
			return NextResponse.json(
				{ error: 'File size must be less than 2MB' },
				{ status: 400 }
			);
		}

		if (file.size === 0) {
			return NextResponse.json(
				{ error: 'Cannot upload an empty file' },
				{ status: 400 }
			);
		}

		console.log('About to upload file:', {
			fileName: file.name,
			fileType: file.type,
			fileSize: file.size
		});

		const buffer = await file.arrayBuffer();
		const base64String = Buffer.from(buffer).toString('base64');
		const fileUri = `data:${file.type};base64,${base64String}`;

		const result = await new Promise<CloudinaryResult>((resolve, reject) => {
			cloudinary.uploader.upload(
				fileUri,
				{
					folder: 'student-resumes',
					resource_type: 'auto',
					public_id: `${Date.now()}_${file.name.replace(/\.[^/.]+$/, '')}`,
					format: 'pdf',
					access_mode: 'public',
					type: 'upload',
					overwrite: true
				},
				(error, result) => {
					if (error) {
						console.error('Upload error:', error);
						reject(error);
					} else {
						console.log('Upload success:', result);
						resolve(result as CloudinaryResult);
					}
				}
			);
		});

		return NextResponse.json({
			success: true,
			url: result.secure_url
		});
	} catch (error) {
		console.error('Error uploading to Cloudinary:', error);

		let errorMessage = 'Failed to upload file';
		let errorDetails = null;

		if (error instanceof Error) {
			errorMessage = error.message;
			const cloudinaryError = error as unknown as CloudinaryError;
			errorDetails = cloudinaryError.error || cloudinaryError.response?.data;
		}

		return NextResponse.json(
			{
				error: errorMessage,
				details: errorDetails
			},
			{ status: 500 }
		);
	}
}
