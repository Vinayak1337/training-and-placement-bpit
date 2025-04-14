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
		
		
		const { student_id, password } = body;

		if (!student_id || !password) {
			return NextResponse.json(
				{ error: 'Student ID and password are required' },
				{ status: 400 }
			);
		}

		const student = await prisma.student.findUnique({
			where: { student_id }
		});

		if (!student) {
			
			return NextResponse.json(
				{ error: 'Invalid credentials' },
				{ status: 401 } 
			);
		}

		
		if (!student.password_hash) {
			console.error(`Student ${student_id} has no password hash set.`);
			return NextResponse.json(
				{ error: 'Login configuration error for this account.' },
				{ status: 500 } 
			);
		}

		const isPasswordValid = await bcrypt.compare(
			password,
			student.password_hash
		);

		if (!isPasswordValid) {
			return NextResponse.json(
				{ error: 'Invalid credentials' },
				{ status: 401 }
			);
		}

		
		const payload: jose.JWTPayload = {
			userId: student.student_id,
			email: student.email, 
			role: 'student'
			
		};

		
		const token = await new jose.SignJWT(payload)
			.setProtectedHeader({ alg: JWT_ALGORITHM })
			.setIssuedAt()
			.setExpirationTime(JWT_EXPIRATION_TIME)
			.sign(secretKey);

		const response = NextResponse.json(
			{
				message: 'Login successful',
				user: {
					id: student.student_id,
					email: student.email,
					name: student.name,
					role: 'student'
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
		console.log('Student login: Setting auth_token with cookie options:', {
			httpOnly: false,
			secure: false,
			maxAge: 60 * 60,
			sameSite: 'lax'
		});

		return response;
	} catch (error) {
		console.error('Student Login Error:', error);
		return NextResponse.json(
			{ error: 'An unexpected error occurred during login.' },
			{ status: 500 }
		);
	}
}
