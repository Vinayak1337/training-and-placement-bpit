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

		// Use the same cookie name as the login routes
		response.cookies.set({
			name: 'auth_token',
			value: token,
			httpOnly: false,
			secure: false,
			path: '/',
			sameSite: 'lax', // Changed from strict to lax for better compatibility
			maxAge: 60 * 60
		});
		
		// Also set authToken for backward compatibility
		response.cookies.set({
			name: 'authToken',
			value: token,
			httpOnly: false,
			secure: false,
			path: '/',
			sameSite: 'lax',
			maxAge: 60 * 60
		});
		
		console.log('Set-token: cookies set with httpOnly and secure false');

		return response;
	} catch (error) {
		console.error('Set token error:', error);
		return NextResponse.json(
			{ message: 'Failed to set token' },
			{ status: 500 }
		);
	}
}
