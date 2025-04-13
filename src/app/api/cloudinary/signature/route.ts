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

		const timestamp = Math.round(new Date().getTime() / 1000);

		const paramsToSign = {
			timestamp,
			...body
		};

		console.log('Signing parameters:', paramsToSign);

		const signature = cloudinary.utils.api_sign_request(
			paramsToSign,
			process.env.CLOUDINARY_API_SECRET as string
		);

		return NextResponse.json({
			success: true,
			signature,
			api_key: process.env.CLOUDINARY_API_KEY,
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
			...paramsToSign
		});
	} catch (err) {
		console.error('Error generating signature:', err);
		return NextResponse.json(
			{
				success: false,
				message: 'Server error, please try again'
			},
			{ status: 500 }
		);
	}
}
