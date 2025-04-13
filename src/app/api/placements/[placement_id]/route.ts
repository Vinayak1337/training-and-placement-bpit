import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as z from 'zod';
import { PlacementStatus } from '@/hooks/api/placements';

const placementUpdateSchema = z.object({
	status: z.nativeEnum(PlacementStatus),
	placement_date: z
		.string()
		.optional()
		.nullable()
		.refine(val => !val || !isNaN(Date.parse(val)), {
			message: 'Placement date must be a valid date string'
		}),
	package_lpa_confirmed: z.coerce
		.number()
		.min(0)
		.optional()
		.nullable()
		.refine(val => val === null || val === undefined || val >= 0, {
			message: 'Package LPA must be a non-negative number or null'
		})
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ placement_id: string }> }
) {
	const { placement_id } = await params;
	try {
		const placementId = parseInt(placement_id, 10);
		if (isNaN(placementId)) {
			return NextResponse.json(
				{ message: 'Invalid placement ID' },
				{ status: 400 }
			);
		}

		const placement = await prisma.placement.findUnique({
			where: { placement_id: placementId },
			include: {
				student: {
					include: {
						branch: true
					}
				},
				drive: {
					include: {
						company: true,
						criteria: true
					}
				}
			}
		});

		if (!placement) {
			return NextResponse.json(
				{ message: 'Placement not found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(placement);
	} catch (error) {
		console.error('Error fetching placement:', error);
		return NextResponse.json(
			{ message: 'Failed to fetch placement' },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ placement_id: string }> }
) {
	const { placement_id } = await params;
	try {
		const placementId = parseInt(placement_id, 10);
		if (isNaN(placementId)) {
			return NextResponse.json(
				{ message: 'Invalid placement ID' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validation = placementUpdateSchema.safeParse(body);

		if (!validation.success) {
			return NextResponse.json(
				{
					message: 'Invalid input',
					errors: validation.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const { status, placement_date, package_lpa_confirmed } = validation.data;

		const placementExists = await prisma.placement.findUnique({
			where: { placement_id: placementId },
			include: {
				drive: true
			}
		});

		if (!placementExists) {
			return NextResponse.json(
				{ message: 'Placement not found' },
				{ status: 404 }
			);
		}

		// If status is being changed to Offered and no package value provided, use the drive's package_lpa
		let finalPackageValue = package_lpa_confirmed;

		if (
			status === PlacementStatus.Offered &&
			(finalPackageValue === null || finalPackageValue === undefined) &&
			placementExists.drive?.package_lpa
		) {
			finalPackageValue = Number(placementExists.drive.package_lpa);
			console.log(
				`Auto-setting package to ${finalPackageValue} from drive package_lpa`
			);
		}

		const updatedPlacement = await prisma.placement.update({
			where: { placement_id: placementId },
			data: {
				status,
				placement_date: placement_date ? new Date(placement_date) : null,
				package_lpa_confirmed:
					finalPackageValue !== null ? finalPackageValue : null
			},
			include: {
				student: {
					include: {
						branch: true
					}
				},
				drive: {
					include: {
						company: true
					}
				}
			}
		});

		return NextResponse.json(updatedPlacement);
	} catch (error) {
		console.error('Error updating placement:', error);
		return NextResponse.json(
			{ message: 'Failed to update placement' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ placement_id: string }> }
) {
	const { placement_id } = await params;
	try {
		const placementId = parseInt(placement_id, 10);
		if (isNaN(placementId)) {
			return NextResponse.json(
				{ message: 'Invalid placement ID' },
				{ status: 400 }
			);
		}

		const placementExists = await prisma.placement.findUnique({
			where: { placement_id: placementId }
		});

		if (!placementExists) {
			return NextResponse.json(
				{ message: 'Placement not found' },
				{ status: 404 }
			);
		}

		await prisma.placement.delete({
			where: { placement_id: placementId }
		});

		return NextResponse.json(
			{ message: 'Placement deleted successfully' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error deleting placement:', error);
		return NextResponse.json(
			{ message: 'Failed to delete placement' },
			{ status: 500 }
		);
	}
}
