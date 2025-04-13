import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch a specific drive-criteria connection

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ drive_id: string; criteria_id: string }> }
) {
	const { drive_id, criteria_id } = await params;
	const driveId = parseInt(drive_id);
	const criteriaId = parseInt(criteria_id);

	if (isNaN(driveId) || isNaN(criteriaId)) {
		return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
	}

	const drive = await prisma.drive.findFirst({
		where: {
			drive_id: driveId,
			criteria_id: criteriaId
		},
		include: {
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
		return NextResponse.json(
			{ error: 'Drive-Criteria connection not found' },
			{ status: 404 }
		);
	}

	return NextResponse.json(drive);
}

// PUT: Update a drive-criteria connection

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ drive_id: string; criteria_id: string }> }
) {
	try {
		const { drive_id, criteria_id } = await params;
		const driveId = parseInt(drive_id);
		const criteriaId = parseInt(criteria_id);

		if (isNaN(driveId) || isNaN(criteriaId)) {
			return NextResponse.json(
				{ error: 'Invalid drive ID or criteria ID format' },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const {
			job_title,
			package_lpa,
			grade_offered,
			drive_date,
			application_deadline,
			description
		} = body;

		const updatedDrive = await prisma.drive.update({
			where: {
				drive_id: driveId
			},
			data: {
				job_title,
				package_lpa,
				grade_offered,
				drive_date,
				application_deadline,
				description,
				criteria: {
					connect: {
						criteria_id: criteriaId
					}
				}
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
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json(
			{ error: 'Something went wrong' },
			{ status: 500 }
		);
	}
}

// DELETE: Remove a criteria from a drive

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ drive_id: string; criteria_id: string }> }
) {
	try {
		const { drive_id, criteria_id } = await params;
		const driveId = parseInt(drive_id);
		const criteriaId = parseInt(criteria_id);

		if (isNaN(driveId) || isNaN(criteriaId)) {
			return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
		}

		await prisma.drive.delete({
			where: {
				drive_id: driveId,
				criteria_id: criteriaId
			}
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json(
				{
					error: error.message || 'Failed to delete drive-criteria connection'
				},
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}
