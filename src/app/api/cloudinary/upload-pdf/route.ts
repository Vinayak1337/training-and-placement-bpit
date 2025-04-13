import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

interface CloudinaryUploadResult {
	secure_url: string;
	public_id: string;
	resource_type: string;
}

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true
});

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json(
				{
					success: false,
					message: 'No file uploaded'
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

		const buffer = Buffer.from(await file.arrayBuffer());

		const tempFilePath = join('/tmp', `${randomUUID()}.pdf`);

		await writeFile(tempFilePath, buffer);

		const uploadResult = await new Promise<CloudinaryUploadResult>(
			(resolve, reject) => {
				cloudinary.uploader.upload(
					tempFilePath,
					{
						upload_preset: 'student-resumes',
						resource_type: 'raw',

						public_id: `pdf-${Math.round(
							new Date().getTime() / 1000
						)}-${randomUUID().substring(0, 8)}`
					},
					(error, result) => {
						unlink(tempFilePath).catch(err =>
							console.error('Failed to delete temp file:', err)
						);

						if (error) {
							reject(error);
						} else if (result) {
							resolve(result as unknown as CloudinaryUploadResult);
						} else {
							reject(new Error('No result from upload'));
						}
					}
				);
			}
		);

		return NextResponse.json({
			success: true,
			url: uploadResult.secure_url,
			public_id: uploadResult.public_id,
			resource_type: uploadResult.resource_type
		});
	} catch (error) {
		console.error('Error uploading PDF:', error);

		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
}

export const config = {
	api: {
		bodyParser: false,

		responseLimit: '4mb'
	}
};
