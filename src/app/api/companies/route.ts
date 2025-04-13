import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as z from 'zod';
import { type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const companySchema = z.object({
	name: z.string().min(1, 'Company name is required').max(255),
	contact_no: z
		.string()
		.max(20, 'Contact number too long')
		.optional()
		.nullable(),
	website: z
		.string()
		.url({ message: 'Invalid URL format' })
		.max(255)
		.optional()
		.nullable(),
	address: z.string().optional().nullable()
});

export async function GET(request: NextRequest) {
	const token = await getToken({ req: request });

	console.log('NextAuth token:', token ? 'Present' : 'Missing', token);

	
	if (!token || token.role !== 'coordinator') {
		return NextResponse.json(
			{ error: 'Unauthorized. Only coordinators can access company data.' },
			{ status: 401 }
		);
	}

	try {
		const companies = await prisma.company.findMany({
			orderBy: {
				name: 'asc'
			}
		});
		return NextResponse.json(companies);
	} catch (error) {
		console.error('Error fetching companies:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch companies' },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	const token = await getToken({ req: request });

	
	if (!token || token.role !== 'coordinator') {
		return NextResponse.json(
			{ error: 'Unauthorized. Only coordinators can create companies.' },
			{ status: 401 }
		);
	}

	try {
		const body = await request.json();

		const validation = companySchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{
					error: 'Invalid input',
					details: validation.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const { name, contact_no, website, address } = validation.data;

		const existingCompany = await prisma.company.findFirst({
			where: {
				name: {
					equals: name,
					mode: 'insensitive'
				}
			}
		});

		if (existingCompany) {
			return NextResponse.json(
				{ error: `Company '${name}' already exists` },
				{ status: 409 }
			);
		}

		const newCompany = await prisma.company.create({
			data: {
				name: name.trim(),
				contact_no: contact_no || null,
				website: website || null,
				address: address || null
			}
		});

		return NextResponse.json(newCompany, { status: 201 });
	} catch (error) {
		console.error('Error creating company:', error);
		if (error instanceof Error && 'code' in error && error.code === 'P2002') {
			return NextResponse.json(
				{
					error: `A company with this name or other unique field already exists.`
				},
				{ status: 409 }
			);
		}
		return NextResponse.json(
			{ error: 'Failed to create company due to a server error.' },
			{ status: 500 }
		);
	}
}
