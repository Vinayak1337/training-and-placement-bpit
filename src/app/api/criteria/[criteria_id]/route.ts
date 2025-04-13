import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const criteriaUpdateSchema = z.object({
	description: z.string().max(255).optional().nullable(),
	min_percentage: z.coerce
		.number({ invalid_type_error: 'Percentage must be a number' })
		.min(0, 'Percentage cannot be negative')
		.max(100, 'Percentage cannot exceed 100')
		.optional()
		.nullable(),
	active_status: z.boolean().optional(),
	branch_ids: z.array(z.number().int().positive()).optional()
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ criteria_id: string }> }
) {
	const { criteria_id: id } = await params;
	const criteriaId = parseInt(id);

	if (isNaN(criteriaId)) {
		return NextResponse.json(
			{ error: 'Invalid criteria ID format' },
			{ status: 400 }
		);
	}

	const criteria = await prisma.criteria.findUnique({
		where: { criteria_id: criteriaId },
		include: {
			allowed_branches: {
				include: {
					branch: true
				}
			}
		}
	});

	if (!criteria) {
		return NextResponse.json({ error: 'Criteria not found' }, { status: 404 });
	}

	return NextResponse.json(criteria);
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ criteria_id: string }> }
) {
	try {
		const { criteria_id: id } = await params;
		const criteriaId = parseInt(id);
		if (isNaN(criteriaId)) {
			return NextResponse.json(
				{ error: 'Invalid criteria ID format' },
				{ status: 400 }
			);
		}

		const rawData = await request.json();
		const data = criteriaUpdateSchema.parse(rawData);

		const updatedCriteria = await prisma.criteria.update({
			where: { criteria_id: criteriaId },
			data: {
				description: data.description,
				min_percentage: data.min_percentage,
				active_status: data.active_status,
				allowed_branches: {
					deleteMany: {},
					create:
						data.branch_ids?.map(branchId => ({
							branch_id: branchId
						})) || []
				}
			},
			include: {
				allowed_branches: {
					include: {
						branch: true
					}
				}
			}
		});

		return NextResponse.json(updatedCriteria);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}

		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message || 'Failed to update criteria' },
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
	{ params }: { params: Promise<{ criteria_id: string }> }
) {
	try {
		const { criteria_id: id } = await params;
		const criteriaId = parseInt(id);
		if (isNaN(criteriaId)) {
			return NextResponse.json(
				{ error: 'Invalid criteria ID format' },
				{ status: 400 }
			);
		}

		await prisma.criteria.delete({
			where: { criteria_id: criteriaId }
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message || 'Failed to delete criteria' },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}
