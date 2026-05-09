import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PlacementStatus } from '@/hooks/api/placements';
import { isAuthResponse, requireCoordinator } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	const auth = await requireCoordinator(request);
	if (isAuthResponse(auth)) return auth;

	try {
		// Get all placements with Offered status that have null package_lpa_confirmed
		const offeredPlacements = await prisma.placement.findMany({
			where: {
				status: PlacementStatus.Offered,
				package_lpa_confirmed: null
			},
			include: {
				drive: true
			}
		});

		console.log(
			`Found ${offeredPlacements.length} placements with Offered status and null package`
		);

		// Update each placement with the drive's package_lpa
		const updateResults = await Promise.all(
			offeredPlacements.map(async placement => {
				if (placement.drive?.package_lpa) {
					await prisma.placement.update({
						where: {
							placement_id: placement.placement_id
						},
						data: {
							package_lpa_confirmed: Number(placement.drive.package_lpa)
						}
					});
					return {
						placement_id: placement.placement_id,
						previous_package: null,
						new_package: Number(placement.drive.package_lpa),
						success: true
					};
				}
				return {
					placement_id: placement.placement_id,
					previous_package: null,
					new_package: null,
					success: false,
					reason: 'No drive package found'
				};
			})
		);

		// Also update "Offer_Accepted" placements that might have null packages
		const acceptedPlacements = await prisma.placement.findMany({
			where: {
				status: PlacementStatus.Offer_Accepted,
				package_lpa_confirmed: null
			},
			include: {
				drive: true
			}
		});

		console.log(
			`Found ${acceptedPlacements.length} placements with Offer_Accepted status and null package`
		);

		const acceptedUpdateResults = await Promise.all(
			acceptedPlacements.map(async placement => {
				if (placement.drive?.package_lpa) {
					await prisma.placement.update({
						where: {
							placement_id: placement.placement_id
						},
						data: {
							package_lpa_confirmed: Number(placement.drive.package_lpa)
						}
					});
					return {
						placement_id: placement.placement_id,
						previous_package: null,
						new_package: Number(placement.drive.package_lpa),
						success: true
					};
				}
				return {
					placement_id: placement.placement_id,
					previous_package: null,
					new_package: null,
					success: false,
					reason: 'No drive package found'
				};
			})
		);

		// Combine results
		const allResults = [...updateResults, ...acceptedUpdateResults];
		const successCount = allResults.filter(r => r.success).length;

		return NextResponse.json({
			message: `Successfully updated ${successCount} out of ${allResults.length} placements`,
			results: allResults
		});
	} catch (error) {
		console.error('Error updating placements:', error);
		return NextResponse.json(
			{ error: 'Failed to update placements' },
			{ status: 500 }
		);
	}
}

export async function GET() {
	return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}
