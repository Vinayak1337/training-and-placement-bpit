import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { token } = body;

		if (!token) {
			return NextResponse.json(
				{ message: 'Token is required' },
				{ status: 400 }
			);
		}

		const response = NextResponse.json(
			{ message: 'Token set successfully' },
			{ status: 200 }
		);

		response.cookies.set({
			name: 'authToken',
			value: token,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			sameSite: 'strict',
			maxAge: 60 * 60
		});

		return response;
	} catch (error) {
		console.error('Set token error:', error);
		return NextResponse.json(
			{ message: 'Failed to set token' },
			{ status: 500 }
		);
	}
}
