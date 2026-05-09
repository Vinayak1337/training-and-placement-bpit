import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import {
	DEMO_BRANCH_NAME,
	DEMO_COORDINATOR,
	DEMO_STUDENT
} from '@/lib/demo-accounts';

export async function GET() {
	try {
		const [coordinator, student] = await Promise.all([
			prisma.coordinator.findUnique({
				where: { email: DEMO_COORDINATOR.email },
				select: { coordinator_id: true }
			}),
			prisma.student.findUnique({
				where: { student_id: DEMO_STUDENT.student_id },
				select: { student_id: true }
			})
		]);

		return NextResponse.json({
			coordinatorReady: Boolean(coordinator),
			studentReady: Boolean(student)
		});
	} catch (error) {
		console.error('Error reading demo setup status:', error);
		return NextResponse.json(
			{ message: 'Failed to read demo setup status' },
			{ status: 500 }
		);
	}
}

export async function POST() {
	try {
		const [coordinatorPasswordHash, studentPasswordHash] = await Promise.all([
			bcrypt.hash(DEMO_COORDINATOR.password, 10),
			bcrypt.hash(DEMO_STUDENT.password, 10)
		]);

		await prisma.$transaction(async tx => {
			const branch = await tx.branch.upsert({
				where: { branch_name: DEMO_BRANCH_NAME },
				update: {},
				create: { branch_name: DEMO_BRANCH_NAME }
			});

			await tx.coordinator.upsert({
				where: { email: DEMO_COORDINATOR.email },
				update: {
					name: DEMO_COORDINATOR.name,
					password_hash: coordinatorPasswordHash
				},
				create: {
					email: DEMO_COORDINATOR.email,
					name: DEMO_COORDINATOR.name,
					password_hash: coordinatorPasswordHash
				}
			});

			await tx.student.upsert({
				where: { student_id: DEMO_STUDENT.student_id },
				update: {
					name: DEMO_STUDENT.name,
					email: DEMO_STUDENT.email,
					department_branch_id: branch.branch_id,
					password_hash: studentPasswordHash
				},
				create: {
					student_id: DEMO_STUDENT.student_id,
					name: DEMO_STUDENT.name,
					department_branch_id: branch.branch_id,
					email: DEMO_STUDENT.email,
					password_hash: studentPasswordHash
				}
			});
		});

		return NextResponse.json({
			success: true,
			message: 'Demo accounts are ready'
		});
	} catch (error) {
		console.error('Error setting up demo accounts:', error);
		return NextResponse.json(
			{ success: false, message: 'Failed to set up demo accounts' },
			{ status: 500 }
		);
	}
}
