import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const branchUpdateSchema = z.object({
	branch_name: z.string().min(1, 'Branch name is required').max(100)
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ branchId: string }> }
) {
	const { branchId: id } = await params;
	const branchId = parseInt(id);

	if (isNaN(branchId)) {
		return NextResponse.json(
			{ error: 'Invalid branch ID format' },
			{ status: 400 }
		);
	}

	const branch = await prisma.branch.findUnique({
		where: { branch_id: branchId }
	});

	if (!branch) {
		return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
	}

	return NextResponse.json(branch);
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ branchId: string }> }
) {
	try {
		const { branchId: id } = await params;
		const branchId = parseInt(id);
		if (isNaN(branchId)) {
			return NextResponse.json(
				{ error: 'Invalid branch ID format' },
				{ status: 400 }
			);
		}

		const rawData = await request.json();
		const data = branchUpdateSchema.parse(rawData);

		const updatedBranch = await prisma.branch.update({
			where: { branch_id: branchId },
			data: {
				branch_name: data.branch_name
			}
		});

		return NextResponse.json(updatedBranch);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}

		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message || 'Failed to update branch' },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ branchId: string }> }
) {
	try {
		const { branchId: id } = await params;
		const branchId = parseInt(id);
		if (isNaN(branchId)) {
			return NextResponse.json(
				{ error: 'Invalid branch ID format' },
				{ status: 400 }
			);
		}

		await prisma.branch.delete({
			where: { branch_id: branchId }
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message || 'Failed to delete branch' },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}
