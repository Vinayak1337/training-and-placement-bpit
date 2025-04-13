import { NextResponse } from 'next/server';

export async function POST() {
	try {
		return NextResponse.json(
			{
				error:
					'Direct server-side upload is not available. Please use client-side CldUploadWidget from next-cloudinary package.'
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error('Error during direct upload setup:', error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : 'Upload failed' },
			{ status: 500 }
		);
	}
}
