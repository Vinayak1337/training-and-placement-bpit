import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const studentCreateSchema = z.object({
	student_id: z.string().min(1, 'Student ID is required').max(50),
	name: z.string().min(1, 'Name is required').max(255),
	department_branch_id: z
		.number()
		.int()
		.positive('Valid branch selection is required'),
	grade: z.string().max(5).optional().nullable(),
	percentage: z.coerce
		.number({ invalid_type_error: 'Percentage must be a number' })
		.min(0)
		.max(100)
		.optional()
		.nullable(),
	address: z.string().optional().nullable(),
	contact_no: z.string().max(20).optional().nullable(),
	email: z.string().email('Invalid email address').max(255),
	resume_url: z
		.string()
		.url({ message: 'Invalid URL' })
		.max(512)
		.optional()
		.nullable(),
	// Password is required on creation
	password: z.string().min(6, 'Password must be at least 6 characters') // Add complexity later if needed
});

// GET: Fetch all students, including branch details
// TODO: Implement pagination and filtering later if needed
export async function GET() {
	try {
		const students = await prisma.student.findMany({
			orderBy: {
				student_id: 'asc' // Order by student ID
			},
			include: {
				branch: true // Include the branch details
			}
		});
		// Exclude password hash by manually mapping
		const studentsWithoutPassword = students.map(student => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password_hash, ...rest } = student;
			return rest;
		});
		return NextResponse.json(studentsWithoutPassword);
	} catch (error) {
		console.error('Error fetching students:', error);
		return NextResponse.json(
			{ message: 'Failed to fetch students' },
			{ status: 500 }
		);
	}
}

// POST: Create a new student
// TODO: Add authentication check (Admin only)
export async function POST(request: NextRequest) {
	// Add authentication check
	const token = await getToken({ req: request });

	// Check if the user is authenticated and has the coordinator role
	if (!token || token.role !== 'coordinator') {
		return NextResponse.json(
			{ message: 'Unauthorized. Only coordinators can create students.' },
			{ status: 401 }
		);
	}

	try {
		const body = await request.json();

		// Validate input
		const validation = studentCreateSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{
					message: 'Invalid input',
					errors: validation.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const {
			student_id,
			name,
			department_branch_id,
			grade,
			percentage,
			address,
			contact_no,
			email,
			resume_url,
			password
		} = validation.data;

		// Check if student ID or email already exists
		const existingStudent = await prisma.student.findFirst({
			where: { OR: [{ student_id }, { email }] }
		});

		if (existingStudent) {
			const conflictField =
				existingStudent.student_id === student_id ? 'Student ID' : 'Email';
			return NextResponse.json(
				{ message: `${conflictField} already exists` },
				{ status: 409 } // Conflict
			);
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

		// Create new student
		const newStudent = await prisma.student.create({
			data: {
				student_id,
				name,
				department_branch_id,
				grade: grade || null,
				percentage: percentage, // Already number or null from zod coerce
				address: address || null,
				contact_no: contact_no || null,
				email,
				resume_url: resume_url || null,
				password_hash: hashedPassword
			},
			include: { branch: true } // Include branch in response
		});

		// Exclude password hash by manually creating the response object
		// Manually create the object to return, excluding the hash
		const responseData = {
			student_id: newStudent.student_id,
			name: newStudent.name,
			department_branch_id: newStudent.department_branch_id,
			grade: newStudent.grade,
			percentage: newStudent.percentage,
			address: newStudent.address,
			contact_no: newStudent.contact_no,
			email: newStudent.email,
			resume_url: newStudent.resume_url,
			branch: newStudent.branch // Assuming branch is included
		};

		return NextResponse.json(responseData, { status: 201 }); // 201 Created
	} catch (error: unknown) {
		console.error('Error creating student:', error);
		if (error instanceof Error) {
			if ('code' in error && error.code === 'P2002') {
				const meta = (error as { meta?: { target?: string[] } }).meta;
				const target = meta?.target;
				const field = Array.isArray(target)
					? target.join(', ')
					: 'Unique field';
				return NextResponse.json(
					{ message: `${field} already exists.` },
					{ status: 409 }
				);
			}
			if ('code' in error && error.code === 'P2003') {
				return NextResponse.json(
					{ message: 'Invalid Department/Branch ID provided.' },
					{ status: 400 }
				);
			}
		}
		return NextResponse.json(
			{ message: 'Failed to create student' },
			{ status: 500 }
		);
	}
}
