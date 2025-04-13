import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ student_id: string }> }
) {
	const { student_id } = await params;
	try {
		const studentId = student_id;

		const student = await prisma.student.findUnique({
			where: { student_id: studentId },
			include: { branch: true }
		});

		if (!student) {
			return NextResponse.json(
				{ message: 'Student not found' },
				{ status: 404 }
			);
		}

		const branchId = student.department_branch_id;
		const percentage = student.percentage || 0;

		const currentDate = new Date();

		const eligibleDrives = await prisma.drive.findMany({
			where: {
				OR: [
					{
						application_deadline: {
							gte: currentDate
						}
					},
					{
						application_deadline: null
					}
				],

				criteria: {
					OR: [
						{ min_percentage: { lte: percentage } },
						{ min_percentage: null }
					],

					allowed_branches: {
						some: {
							branch_id: branchId
						}
					}
				},

				NOT: {
					placements: {
						some: {
							student_id: studentId
						}
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
			},
			orderBy: {
				application_deadline: 'asc'
			}
		});

		return NextResponse.json(eligibleDrives);
	} catch (error) {
		return NextResponse.json(
			{
				message: `Failed to fetch eligible drives: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`
			},
			{ status: 500 }
		);
	}
}
