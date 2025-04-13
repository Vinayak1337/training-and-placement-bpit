import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

interface CloudinaryUploadResponse {
	secure_url: string;
	public_id: string;
	[key: string]: unknown;
}

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true
});

const CLOUDINARY_UPLOAD_PRESET = 'placement_portal_unsigned';

export async function GET() {
	return NextResponse.json({
		cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
		uploadPreset: CLOUDINARY_UPLOAD_PRESET,
		folder: 'student-resumes'
	});
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

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		return new Promise<Response>(async resolve => {
			try {
				const timestamp = Math.floor(Date.now() / 1000);
				const filename = `resume_${timestamp}`;

				const uploadResponse = await new Promise<CloudinaryUploadResponse>(
					(innerResolve, innerReject) => {
						const uploadStream = cloudinary.uploader.upload_stream(
							{
								folder: 'student-resumes',
								public_id: filename,
								resource_type: 'raw',
								format: 'pdf',
								unique_filename: true,
								use_filename: true,
								overwrite: true
							},
							(error, result) => {
								if (error) innerReject(error);
								else if (result)
									innerResolve(result as CloudinaryUploadResponse);
								else
									innerReject(new Error('No result returned from Cloudinary'));
							}
						);

						const readableInstanceStream = new Readable({
							read() {
								this.push(buffer);
								this.push(null);
							}
						});

						readableInstanceStream.pipe(uploadStream);
					}
				);

				console.log('Uploaded successfully:', uploadResponse);

				resolve(
					NextResponse.json({
						url: uploadResponse.secure_url,
						public_id: uploadResponse.public_id,
						success: true
					})
				);
			} catch (error) {
				console.error('Upload failed:', error);
				resolve(
					NextResponse.json(
						{ error: 'Upload failed', details: String(error) },
						{ status: 500 }
					)
				);
			}
		});
	} catch (error) {
		console.error('Server error:', error);
		return NextResponse.json(
			{ error: 'Server error', details: String(error) },
			{ status: 500 }
		);
	}
}
