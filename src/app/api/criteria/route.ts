import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as z from 'zod';
import { type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Prisma } from '@prisma/client';


const criteriaSchema = z.object({
	description: z.string().max(255).optional().nullable(),
	min_percentage: z.coerce 
		.number({ invalid_type_error: 'Percentage must be a number' })
		.min(0, 'Percentage cannot be negative')
		.max(100, 'Percentage cannot exceed 100')
		.optional()
		.nullable(),
	active_status: z.boolean().default(true),
	
	branch_ids: z
		.array(z.number().int().positive())
		.min(1, 'At least one branch must be selected')
});

interface Branch {
	branch_id: number;
	branch_name: string;
}

type CriteriaBranch = {
	branch: Branch;
};


export async function GET() {
	try {
		const criteria = await prisma.criteria.findMany({
			orderBy: {
				criteria_id: 'asc'
			},
			include: {
				
				allowed_branches: {
					include: {
						branch: true 
					}
				}
			}
		});

		
		const formattedCriteria = criteria.map(c => ({
			...c,
			min_percentage: c.min_percentage ? Number(c.min_percentage) : null,
			allowed_branches: c.allowed_branches.map(
				(cb: CriteriaBranch) => cb.branch
			) 
		}));

		return NextResponse.json(formattedCriteria);
	} catch (error) {
		console.error('Error fetching criteria:', error);
		return NextResponse.json(
			{ message: 'Failed to fetch criteria' },
			{ status: 500 }
		);
	}
}



export async function POST(request: NextRequest) {
	
	const token = await getToken({ req: request });

	
	if (!token || token.role !== 'coordinator') {
		return NextResponse.json(
			{ message: 'Unauthorized. Only coordinators can create criteria.' },
			{ status: 401 }
		);
	}

	try {
		const body = await request.json();

		
		const validation = criteriaSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{
					message: 'Invalid input',
					errors: validation.error.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const { description, min_percentage, active_status, branch_ids } =
			validation.data;

		
		const newCriteria = await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				
				const createdCriteria = await tx.criteria.create({
					data: {
						description: description || null,
						min_percentage: min_percentage, 
						active_status
					}
				});

				
				await tx.criteriaBranch.createMany({
					data: branch_ids.map(branchId => ({
						criteria_id: createdCriteria.criteria_id,
						branch_id: branchId
					}))
				});

				
				const result = await tx.criteria.findUnique({
					where: { criteria_id: createdCriteria.criteria_id },
					include: {
						allowed_branches: { include: { branch: true } }
					}
				});

				if (!result) {
					
					throw new Error(
						'Failed to fetch newly created criteria after transaction.'
					);
				}

				
				return {
					...result,
					allowed_branches: result.allowed_branches.map(
						(cb: CriteriaBranch) => cb.branch
					)
				};
			}
		);

		return NextResponse.json(newCriteria, { status: 201 }); 
	} catch (error) {
		console.error('Error creating criteria:', error);
		
		if (error instanceof Error && 'code' in error && error.code === 'P2003') {
			return NextResponse.json(
				{
					message:
						'Invalid branch ID provided. Please ensure all selected branches exist.'
				},
				{ status: 400 } 
			);
		}
		return NextResponse.json(
			{ message: 'Failed to create criteria' },
			{ status: 500 }
		);
	}
}
