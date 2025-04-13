import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const driveUpdateSchema = z.object({
	job_title: z.string().min(1, 'Job title is required').max(255),
	package_lpa: z.coerce
		.number({ invalid_type_error: 'Package must be a number' })
		.min(0, 'Package cannot be negative')
		.optional()
		.nullable(),
	grade_offered: z.string().max(50).optional().nullable(),
	drive_date: z.string().optional().nullable(),
	application_deadline: z.string().optional().nullable(),
	description: z.string().optional().nullable()
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const driveId = parseInt(id);

	if (isNaN(driveId)) {
		return NextResponse.json(
			{ error: 'Invalid drive ID format' },
			{ status: 400 }
		);
	}

	const drive = await prisma.drive.findUnique({
		where: { drive_id: driveId },
		include: {
			company: true,
			criteria: {
				include: {
					allowed_branches: {
						include: {
							branch: true
						}
					}
				}
			}
		}
	});

	if (!drive) {
		return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
	}

	return NextResponse.json(drive);
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const driveId = parseInt(id);
		if (isNaN(driveId)) {
			return NextResponse.json(
				{ error: 'Invalid drive ID format' },
				{ status: 400 }
			);
		}

		const rawData = await request.json();
		const data = driveUpdateSchema.parse(rawData);

		const updatedDrive = await prisma.drive.update({
			where: { drive_id: driveId },
			data: {
				job_title: data.job_title,
				package_lpa: data.package_lpa,
				grade_offered: data.grade_offered,
				drive_date: data.drive_date ? new Date(data.drive_date) : null,
				application_deadline: data.application_deadline
					? new Date(data.application_deadline)
					: null,
				description: data.description
			}
		});

		return NextResponse.json(updatedDrive);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}

		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message || 'Failed to update drive' },
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
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const driveId = parseInt(id);
		if (isNaN(driveId)) {
			return NextResponse.json(
				{ error: 'Invalid drive ID format' },
				{ status: 400 }
			);
		}

		await prisma.drive.delete({
			where: { drive_id: driveId }
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message || 'Failed to delete drive' },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}
