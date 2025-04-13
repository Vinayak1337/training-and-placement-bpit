import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
	try {
		const existingCoordinator = await prisma.coordinator.findUnique({
			where: { email: 't&p@bpit.edu.in' }
		});

		if (existingCoordinator) {
			return NextResponse.json(
				{ message: 'Coordinator already exists' },
				{ status: 200 }
			);
		}

		const hashedPassword = await bcrypt.hash('t&p@2027', 10);

		const coordinator = await prisma.coordinator.create({
			data: {
				email: 't&p@bpit.edu.in',
				name: 'T&P Coordinator',
				password_hash: hashedPassword
			}
		});

		return NextResponse.json(
			{
				message: 'Coordinator seeded successfully',
				coordinator: {
					id: coordinator.coordinator_id,
					email: coordinator.email,
					name: coordinator.name
				}
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error seeding coordinator:', error);
		return NextResponse.json(
			{ message: 'Failed to seed coordinator' },
			{ status: 500 }
		);
	}
}
