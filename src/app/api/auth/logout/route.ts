import { NextResponse } from 'next/server';

export async function POST() {
	try {
		const response = NextResponse.json(
			{ message: 'Logged out successfully' },
			{ status: 200 }
		);

		// Clear auth_token cookie (the one used in login routes)
		response.cookies.set({
			name: 'auth_token',
			value: '',
			httpOnly: false,
			secure: false,
			path: '/',
			maxAge: 0
		});
		
		// Also clear authToken for backward compatibility
		response.cookies.set({
			name: 'authToken',
			value: '',
			httpOnly: false,
			secure: false,
			path: '/',
			maxAge: 0
		});
		
		// Also clear next-auth.session-token
		response.cookies.set({
			name: 'next-auth.session-token',
			value: '',
			httpOnly: false,
			secure: false,
			path: '/',
			maxAge: 0
		});
		
		console.log('Logout: cleared all auth cookies');

		return response;
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.json({ message: 'Failed to logout' }, { status: 500 });
	}
}
