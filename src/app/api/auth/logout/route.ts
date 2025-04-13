import { NextResponse } from 'next/server';

export async function POST() {
	try {
		const response = NextResponse.json(
			{ message: 'Logged out successfully' },
			{ status: 200 }
		);

		response.cookies.set({
			name: 'authToken',
			value: '',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			path: '/',
			maxAge: 0
		});

		return response;
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.json({ message: 'Failed to logout' }, { status: 500 });
	}
}
