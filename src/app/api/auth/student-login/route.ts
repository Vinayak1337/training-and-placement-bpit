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
			httpOnly: true,
			secure: process.env.NODE_ENV !== 'development',
			maxAge: 60 * 60, 
			sameSite: 'lax',
			path: '/'
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
