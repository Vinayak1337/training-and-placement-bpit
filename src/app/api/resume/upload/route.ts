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

/**
 * Uploads a resume file to Cloudinary and returns the public URL
 */
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json(
				{
					success: false,
					message: 'No file provided'
				},
				{ status: 400 }
			);
		}

		if (file.type !== 'application/pdf') {
			return NextResponse.json(
				{
					success: false,
					message: 'Only PDF files are allowed'
				},
				{ status: 400 }
			);
		}

		if (file.size > 2 * 1024 * 1024) {
			return NextResponse.json(
				{
					success: false,
					message: 'File size must be less than 2MB'
				},
				{ status: 400 }
			);
		}

		if (file.size === 0) {
			return NextResponse.json(
				{
					success: false,
					message: 'Cannot upload an empty file'
				},
				{ status: 400 }
			);
		}

		const buffer = await file.arrayBuffer();
		const base64String = Buffer.from(buffer).toString('base64');
		const fileUri = `data:${file.type};base64,${base64String}`;

		const timestamp = Math.floor(Date.now() / 1000);
		const uniqueId = `resume_${timestamp}`;

		const result = await new Promise<CloudinaryResult>((resolve, reject) => {
			cloudinary.uploader.upload(
				fileUri,
				{
					folder: 'student-resumes',
					resource_type: 'auto',
					public_id: uniqueId,
					format: 'pdf',
					access_mode: 'public',
					type: 'upload',
					overwrite: true
				},
				(error, result) => {
					if (error) {
						reject(error);
					} else {
						resolve(result as CloudinaryResult);
					}
				}
			);
		});

		return NextResponse.json({
			success: true,
			url: result.secure_url,
			public_id: result.public_id
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error ? error.message : 'Failed to upload file'
			},
			{ status: 500 }
		);
	}
}
