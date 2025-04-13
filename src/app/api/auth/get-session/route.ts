import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET() {
	try {
		
		let token;
		try {
			const cookieStore = await cookies();
			token = cookieStore.get('authToken')?.value;
		} catch (cookieError) {
			console.error('Error accessing cookies:', cookieError);
			return NextResponse.json(
				{ message: 'Error accessing session data', authenticated: false },
				{ status: 500 }
			);
		}

		if (!token) {
			return NextResponse.json(
				{ message: 'Not authenticated', authenticated: false },
				{ status: 401 }
			);
		}

		const JWT_SECRET = process.env.JWT_SECRET;
		if (!JWT_SECRET) {
			console.error('JWT_SECRET is not defined in environment variables');
			return NextResponse.json(
				{ message: 'Server configuration error', authenticated: false },
				{ status: 500 }
			);
		}

		const secret = new TextEncoder().encode(JWT_SECRET);

		try {
			const { payload } = await jwtVerify(token, secret);

			return NextResponse.json({
				authenticated: true,
				user: {
					id: payload.userId,
					email: payload.email,
					role: payload.role
				}
			});
		} catch (jwtError) {
			console.error('JWT Verification Failed:', jwtError);
			return NextResponse.json(
				{ message: 'Session expired', authenticated: false },
				{ status: 401 }
			);
		}
	} catch (error) {
		console.error('Get session error:', error);
		return NextResponse.json(
			{ message: 'Failed to get session', authenticated: false },
			{ status: 500 }
		);
	}
}
