import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
	try {
		const existingStudent = await prisma.student.findUnique({
			where: { student_id: 'TEST001' }
		});

		if (existingStudent) {
			return NextResponse.json(
				{ message: 'Test student already exists' },
				{ status: 200 }
			);
		}

		let branch = await prisma.branch.findFirst();

		if (!branch) {
			branch = await prisma.branch.create({
				data: {
					branch_name: 'Computer Science'
				}
			});
		}

		const hashedPassword = await bcrypt.hash('password123', 10);

		const student = await prisma.student.create({
			data: {
				student_id: 'TEST001',
				name: 'Test Student',
				department_branch_id: branch.branch_id,
				email: 'student@test.com',
				password_hash: hashedPassword
			},
			include: {
				branch: true
			}
		});

		return NextResponse.json(
			{
				message: 'Student seeded successfully',
				student: {
					id: student.student_id,
					email: student.email,
					name: student.name,
					branch: student.branch.branch_name
				},
				credentials: {
					student_id: 'TEST001',
					password: 'password123'
				}
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error seeding student:', error);
		return NextResponse.json(
			{ message: 'Failed to seed student', error: (error as Error).message },
			{ status: 500 }
		);
	}
}
