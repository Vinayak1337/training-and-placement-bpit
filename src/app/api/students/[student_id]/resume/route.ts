import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { canAccessStudent, isAuthResponse, requireAnyUser } from '@/lib/api-auth';

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ student_id: string }> }
) {
	const { student_id } = await params;
	try {
		const auth = await requireAnyUser(request);
		if (isAuthResponse(auth)) return auth;

		const studentId = student_id;

		if (!canAccessStudent(auth, studentId)) {
			return NextResponse.json(
				{ message: 'Forbidden: You can only update your own resume' },
				{ status: 403 }
			);
		}

		const { resume_url } = await request.json();

		if (!resume_url) {
			return NextResponse.json(
				{ message: 'Resume URL is required' },
				{ status: 400 }
			);
		}

		const student = await prisma.student.findUnique({
			where: { student_id: studentId }
		});

		if (!student) {
			return NextResponse.json(
				{ message: 'Student not found' },
				{ status: 404 }
			);
		}

		const updatedStudent = await prisma.student.update({
			where: { student_id: studentId },
			data: { resume_url }
		});

		return NextResponse.json({
			message: 'Resume URL updated successfully',
			resume_url: updatedStudent.resume_url
		});
	} catch (error) {
		console.error('Error updating resume URL:', error);
		return NextResponse.json(
			{ message: 'Failed to update resume URL' },
			{ status: 500 }
		);
	}
}
