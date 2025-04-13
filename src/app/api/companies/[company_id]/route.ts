import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const companyUpdateSchema = z.object({
	name: z.string().min(1, 'Company name is required').max(255),
	website: z.string().url('Invalid URL').max(255).optional().nullable(),
	contact_no: z.string().max(20).optional().nullable(),
	address: z.string().optional().nullable()
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ company_id: string }> }
) {
	const { company_id: id } = await params;
	const companyId = parseInt(id);

	if (isNaN(companyId)) {
		return NextResponse.json(
			{ error: 'Invalid company ID format' },
			{ status: 400 }
		);
	}

	const company = await prisma.company.findUnique({
		where: { company_id: companyId }
	});

	if (!company) {
		return NextResponse.json({ error: 'Company not found' }, { status: 404 });
	}

	return NextResponse.json(company);
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ company_id: string }> }
) {
	try {
		const { company_id: id } = await params;
		const companyId = parseInt(id);
		if (isNaN(companyId)) {
			return NextResponse.json(
				{ error: 'Invalid company ID format' },
				{ status: 400 }
			);
		}

		const rawData = await request.json();
		const data = companyUpdateSchema.parse(rawData);

		const updatedCompany = await prisma.company.update({
			where: { company_id: companyId },
			data: {
				name: data.name,
				website: data.website,
				contact_no: data.contact_no,
				address: data.address
			}
		});

		return NextResponse.json(updatedCompany);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}

		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message || 'Failed to update company' },
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
	{ params }: { params: Promise<{ company_id: string }> }
) {
	try {
		const { company_id: id } = await params;
		const companyId = parseInt(id);
		if (isNaN(companyId)) {
			return NextResponse.json(
				{ error: 'Invalid company ID format' },
				{ status: 400 }
			);
		}

		await prisma.company.delete({
			where: { company_id: companyId }
		});

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json(
				{ error: error.message || 'Failed to delete company' },
				{ status: 500 }
			);
		}

		return NextResponse.json(
			{ error: 'An unexpected error occurred' },
			{ status: 500 }
		);
	}
}
