import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const params = {
			timestamp: Math.round(new Date().getTime() / 1000),
			upload_preset: body.upload_preset || 'placement_portal_unsigned',
			folder: body.folder || 'student-resumes',
			...body.params
		};

		const signature = cloudinary.utils.api_sign_request(
			params,
			process.env.CLOUDINARY_API_SECRET as string
		);

		return NextResponse.json({
			success: true,
			...params,
			signature,
			api_key: process.env.CLOUDINARY_API_KEY,
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME || ''
		});
	} catch (err) {
		console.error('Error generating resume signature:', err);
		return NextResponse.json(
			{
				success: false,
				message: 'Server error, please try again'
			},
			{ status: 500 }
		);
	}
}
