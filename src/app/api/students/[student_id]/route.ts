import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as z from 'zod';

const studentUpdateSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255),
	department_branch_id: z.number().int().positive(),
	grade: z.string().max(10).optional().nullable(),
	percentage: z.coerce.number().min(0).max(100).optional(),
	address: z.string().optional().nullable(),
	contact_no: z.string().max(20).optional().nullable(),
	email: z.string().email('Invalid email address').max(255),
	resume_url: z
		.string()
		.url({ message: 'Invalid URL' })
		.max(512)
		.optional()
		.nullable()
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ student_id: string }> }
) {
	try {
		const { student_id: studentId } = await params;

		const student = await prisma.student.findUnique({
			where: { student_id: studentId },
			include: { branch: true }
		});

		if (!student) {
			return NextResponse.json(
				{ message: 'Student not found' },
				{ status: 404 }
			);
		}

		// Explicitly remove password_hash from response
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { password_hash, ...studentData } = student;
		return NextResponse.json(studentData);
	} catch (error) {
		console.error('Error fetching student:', error);
		return NextResponse.json(
			{ message: 'Failed to fetch student' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ student_id: string }> }
) {
	try {
		const { student_id: studentId } = await params;
		const body = await request.json();

		const validation = studentUpdateSchema.safeParse(body);
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
			name,
			department_branch_id,
			grade,
			percentage,
			address,
			contact_no,
			email,
			resume_url
		} = validation.data;

		const existingStudent = await prisma.student.findUnique({
			where: { student_id: studentId }
		});

		if (!existingStudent) {
			return NextResponse.json(
				{ message: 'Student not found' },
				{ status: 404 }
			);
		}

		if (email && email !== existingStudent.email) {
			const emailConflict = await prisma.student.findUnique({
				where: { email }
			});
			if (emailConflict) {
				return NextResponse.json(
					{ message: `Email '${email}' is already in use by another student.` },
					{ status: 409 }
				);
			}
		}

		const updatedStudent = await prisma.student.update({
			where: { student_id: studentId },
			data: {
				name,
				department_branch_id,
				grade: grade || null,
				percentage: percentage,
				address: address || null,
				contact_no: contact_no || null,
				email,
				resume_url: resume_url || null
			},
			include: { branch: true }
		});

		const { ...studentData } = updatedStudent;
		return NextResponse.json(studentData);
	} catch (error: unknown) {
		console.error('Error updating student:', error);
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
			{ message: 'Failed to update student' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ student_id: string }> }
) {
	try {
		const { student_id: studentId } = await params;

		const existingStudent = await prisma.student.findUnique({
			where: { student_id: studentId },
			include: { placements: true }
		});

		if (!existingStudent) {
			return NextResponse.json(
				{ message: 'Student not found' },
				{ status: 404 }
			);
		}

		if (existingStudent.placements && existingStudent.placements.length > 0) {
			return NextResponse.json(
				{
					message:
						'Cannot delete student because they have existing placement applications or records. Please remove those first or deactivate the student.'
				},
				{ status: 409 }
			);
		}

		await prisma.student.delete({
			where: { student_id: studentId }
		});

		return NextResponse.json(
			{ message: 'Student deleted successfully' },
			{ status: 200 }
		);
	} catch (error: unknown) {
		console.error('Error deleting student:', error);
		return NextResponse.json(
			{ message: 'Failed to delete student' },
			{ status: 500 }
		);
	}
}
