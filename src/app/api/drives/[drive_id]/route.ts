import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as z from 'zod';

const driveUpdateSchema = z.object({
	company_id: z.number().int().positive('Company ID is required'),
	criteria_id: z.number().int().positive('Criteria ID is required'),
	job_title: z.string().min(1, 'Job title is required').max(255),
	package_lpa: z.coerce.number().min(0).optional().nullable(),
	grade_offered: z.string().max(50).optional().nullable(),
	drive_date: z
		.string()
		.optional()
		.nullable()
		.transform(val => (val && val.trim() === '' ? null : val)),
	application_deadline: z
		.string()
		.optional()
		.nullable()
		.transform(val => (val && val.trim() === '' ? null : val)),
	description: z.string().optional().nullable()
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ drive_id: string }> }
) {
	const { drive_id } = await params;
	try {
		const driveId = parseInt(drive_id, 10);
		if (isNaN(driveId)) {
			return NextResponse.json(
				{ message: 'Invalid drive ID' },
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
			return NextResponse.json({ message: 'Drive not found' }, { status: 404 });
		}

		return NextResponse.json(drive);
	} catch (error) {
		return NextResponse.json(
			{
				message: `Failed to fetch drive: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			},
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ drive_id: string }> }
) {
	const { drive_id } = await params;
	try {
		const driveId = parseInt(drive_id, 10);
		if (isNaN(driveId)) {
			return NextResponse.json(
				{ message: 'Invalid drive ID' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const validation = driveUpdateSchema.safeParse(body);

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
			company_id,
			criteria_id,
			job_title,
			package_lpa,
			grade_offered,
			drive_date,
			application_deadline,
			description
		} = validation.data;

		const driveExists = await prisma.drive.findUnique({
			where: { drive_id: driveId },
			include: { placements: true }
		});

		if (!driveExists) {
			return NextResponse.json({ message: 'Drive not found' }, { status: 404 });
		}

		const companyExists = await prisma.company.findUnique({
			where: { company_id }
		});
		if (!companyExists) {
			return NextResponse.json(
				{ message: 'Company not found' },
				{ status: 404 }
			);
		}

		const criteriaExists = await prisma.criteria.findUnique({
			where: { criteria_id }
		});
		if (!criteriaExists) {
			return NextResponse.json(
				{ message: 'Criteria not found' },
				{ status: 404 }
			);
		}

		const updatedDrive = await prisma.drive.update({
			where: { drive_id: driveId },
			data: {
				company_id,
				criteria_id,
				job_title,
				package_lpa: package_lpa !== null ? package_lpa : null,
				grade_offered: grade_offered || null,
				drive_date: drive_date ? new Date(drive_date) : null,
				application_deadline: application_deadline
					? new Date(application_deadline)
					: null,
				description: description || null
			},
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

		return NextResponse.json(updatedDrive);
	} catch (error) {
		if (error instanceof Error && 'code' in error) {
			if (error.code === 'P2003') {
				return NextResponse.json(
					{ message: 'Invalid reference: company_id or criteria_id not found' },
					{ status: 400 }
				);
			}
		}

		return NextResponse.json(
			{ message: 'Failed to update drive' },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ drive_id: string }> }
) {
	const { drive_id } = await params;
	try {
		const driveId = parseInt(drive_id, 10);
		if (isNaN(driveId)) {
			return NextResponse.json(
				{ message: 'Invalid drive ID' },
				{ status: 400 }
			);
		}

		const driveExists = await prisma.drive.findUnique({
			where: { drive_id: driveId },
			include: { placements: true }
		});

		if (!driveExists) {
			return NextResponse.json({ message: 'Drive not found' }, { status: 404 });
		}

		if (driveExists.placements.length > 0) {
			return NextResponse.json(
				{
					message:
						'Cannot delete drive with existing applications. Remove applications first.'
				},
				{ status: 400 }
			);
		}

		await prisma.drive.delete({
			where: { drive_id: driveId }
		});

		return NextResponse.json(
			{ message: 'Drive deleted successfully' },
			{ status: 200 }
		);
	} catch (error) {
		return NextResponse.json(
			{
				message: `Failed to delete drive: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			},
			{ status: 500 }
		);
	}
}
