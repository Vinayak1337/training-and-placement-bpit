import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const branchCreateSchema = z.object({
	branch_name: z.string().min(1, 'Branch name is required').max(100)
});

export async function GET() {
	try {
		const branches = await prisma.branch.findMany({
			orderBy: {
				branch_name: 'asc'
			}
		});

		return NextResponse.json(branches);
	} catch (error) {
		console.error('Error fetching branches:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch branches' },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const rawData = await request.json();
		const data = branchCreateSchema.parse(rawData);

		const newBranch = await prisma.branch.create({
			data: {
				branch_name: data.branch_name
			}
		});

		return NextResponse.json(newBranch, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}

		if (error instanceof Error) {
			console.error('Error creating branch:', error);
			return NextResponse.json(
				{ error: error.message || 'Failed to create branch' },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}
