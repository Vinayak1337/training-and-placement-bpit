import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRATION_TIME = '1h';

if (!JWT_SECRET) {
	throw new Error(
		'JWT_SECRET environment variable is not defined. Authentication cannot proceed.'
	);
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ error: 'Email and password are required' },
				{ status: 400 }
			);
		}

		const coordinator = await prisma.coordinator.findUnique({
			where: { email: email.toLowerCase() }
		});

		if (!coordinator) {
			return NextResponse.json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			);
		}

		const isPasswordValid = await bcrypt.compare(
			password,
			coordinator.password_hash
		);

		if (!isPasswordValid) {
			return NextResponse.json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			);
		}

		const payload: jose.JWTPayload = {
			userId: coordinator.coordinator_id,
			email: coordinator.email,
			role: 'coordinator'
		};

		const token = await new jose.SignJWT(payload)
			.setProtectedHeader({ alg: JWT_ALGORITHM })
			.setIssuedAt()
			.setExpirationTime(JWT_EXPIRATION_TIME)
			.sign(secretKey);

		console.log('Generated token for coordinator:', {
			tokenLength: token.length,
			payload,
			expiresIn: JWT_EXPIRATION_TIME
		});

		const response = NextResponse.json(
			{
				message: 'Login successful',
				user: {
					id: coordinator.coordinator_id,
					email: coordinator.email,
					name: coordinator.name,
					role: 'coordinator'
				}
			},
			{ status: 200 }
		);

		response.cookies.set('auth_token', token, {
			httpOnly: false, // Set to false to allow client-side access
			secure: false, // Set to false for both HTTP and HTTPS access
			maxAge: 60 * 60,
			sameSite: 'lax',
			path: '/'
		});
		
		// Log the token being set for debugging
		console.log('Setting auth_token with cookie options:', {
			httpOnly: false,
			secure: false,
			maxAge: 60 * 60,
			sameSite: 'lax'
		});

		return response;
	} catch (error) {
		console.error('Coordinator Login Error:', error);
		return NextResponse.json(
			{ error: 'An unexpected error occurred during login.' },
			{ status: 500 }
		);
	}
}
