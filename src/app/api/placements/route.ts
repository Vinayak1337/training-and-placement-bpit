import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as z from 'zod';
import { PlacementStatus } from '@/hooks/api/placements';

const placementCreateSchema = z.object({
	student_id: z.string(),
	drive_id: z.number().int().positive(),
	status: z.nativeEnum(PlacementStatus).default(PlacementStatus.Applied),
	placement_date: z
		.string()
		.optional()
		.nullable()
		.refine(val => !val || !isNaN(Date.parse(val)), {
			message: 'Placement date must be a valid date string'
		}),
	package_lpa_confirmed: z.coerce.number().min(0).optional().nullable()
});

interface CriteriaBranch {
	branch_id: number;
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const driveId = searchParams.get('drive_id');
		const studentId = searchParams.get('student_id');
		const status = searchParams.get('status');

		const whereClause: {
			drive_id?: number;
			student_id?: string;
			status?: PlacementStatus;
		} = {};

		if (driveId) {
			whereClause.drive_id = parseInt(driveId, 10);
		}

		if (studentId) {
			whereClause.student_id = studentId;
		}

		if (
			status &&
			Object.values(PlacementStatus).includes(status as PlacementStatus)
		) {
			whereClause.status = status as PlacementStatus;
		}

		const placements = await prisma.placement.findMany({
			where: whereClause,
			orderBy: { application_date: 'desc' },
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

		return NextResponse.json(placements);
	} catch (error) {
		console.error('Error fetching placements:', error);
		return NextResponse.json(
			{ message: 'Failed to fetch placements' },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const validation = placementCreateSchema.safeParse(body);
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
			student_id,
			drive_id,
			status,
			placement_date,
			package_lpa_confirmed
		} = validation.data;

		const studentExists = await prisma.student.findUnique({
			where: { student_id }
		});
		if (!studentExists) {
			return NextResponse.json(
				{ message: 'Student not found' },
				{ status: 404 }
			);
		}

		const driveExists = await prisma.drive.findUnique({
			where: { drive_id }
		});
		if (!driveExists) {
			return NextResponse.json({ message: 'Drive not found' }, { status: 404 });
		}

		const existingApplication = await prisma.placement.findFirst({
			where: {
				student_id,
				drive_id
			}
		});
		if (existingApplication) {
			return NextResponse.json(
				{ message: 'This student has already applied for this drive' },
				{ status: 409 }
			);
		}

		const drive = await prisma.drive.findUnique({
			where: { drive_id },
			include: {
				criteria: {
					include: {
						allowed_branches: true
					}
				}
			}
		});

		if (!drive) {
			return NextResponse.json(
				{ message: 'Drive not found or has no criteria' },
				{ status: 404 }
			);
		}

		if (
			drive.criteria.min_percentage !== null &&
			studentExists.percentage !== null
		) {
			if (studentExists.percentage < drive.criteria.min_percentage) {
				return NextResponse.json(
					{
						message: `Student does not meet the minimum percentage requirement of ${drive.criteria.min_percentage}%`
					},
					{ status: 403 }
				);
			}
		}

		const allowedBranchIds = drive.criteria.allowed_branches.map(
			(cb: CriteriaBranch) => cb.branch_id
		);
		if (
			allowedBranchIds.length > 0 &&
			!allowedBranchIds.includes(studentExists.department_branch_id)
		) {
			return NextResponse.json(
				{ message: "Student's branch is not eligible for this drive" },
				{ status: 403 }
			);
		}

		const newPlacement = await prisma.placement.create({
			data: {
				student_id,
				drive_id,
				status,
				placement_date: placement_date ? new Date(placement_date) : null,
				package_lpa_confirmed:
					package_lpa_confirmed !== null ? package_lpa_confirmed : null
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

		return NextResponse.json(newPlacement, { status: 201 });
	} catch (error) {
		console.error('Error creating placement:', error);
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			return NextResponse.json(
				{ message: 'This student has already applied for this drive' },
				{ status: 409 }
			);
		}
		return NextResponse.json(
			{ message: 'Failed to create placement' },
			{ status: 500 }
		);
	}
}
