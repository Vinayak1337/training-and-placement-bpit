'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetEligibleDrives, DRIVES_QUERY_KEY } from '@/hooks/api/drives';
import {
	useCreatePlacement,
	useGetPlacements,
	PLACEMENTS_QUERY_KEY
} from '@/hooks/api/placements';
import { PlacementStatus } from '@/hooks/api/placements';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';

export default function DrivesPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const studentId = session?.user?.id;
	const isLoading = status === 'loading';
	const [hasResume, setHasResume] = React.useState<boolean>(false);
	const [isInitialLoad, setIsInitialLoad] = React.useState(true);
	const queryClient = useQueryClient();

	// Initialize hooks BEFORE using their values in useEffect
	const { data: eligibleDrives, isLoading: isLoadingDrives } =
		useGetEligibleDrives(studentId || '');

	const { data: myApplications, isLoading: isLoadingApplications } =
		useGetPlacements({
			studentId: studentId || ''
		});

	const createApplication = useCreatePlacement();

	// Define fetchStudentData BEFORE using it in useEffect
	const fetchStudentData = React.useCallback(async () => {
		if (!studentId) return;

		try {
			const response = await fetch(`/api/students/${studentId}`);
			if (!response.ok) return;

			const student = await response.json();
			setHasResume(!!student.resume_url);
		} catch (error) {
			console.debug('Failed to fetch student data:', error);
		}
	}, [studentId]);

	// Handle resume check and redirect if not logged in
	React.useEffect(() => {
		if (status !== 'loading') {
			if (!studentId) {
				router.push('/student-login');
			} else {
				// Check for resume
				fetchStudentData();
			}
		}
	}, [status, studentId, router, fetchStudentData]);

	// Clear initial load state after data is fetched
	React.useEffect(() => {
		if (!isLoadingDrives && !isLoadingApplications && isInitialLoad) {
			setIsInitialLoad(false);
		}
	}, [isLoadingDrives, isLoadingApplications, isInitialLoad]);

	const handleApply = (driveId: number) => {
		if (!studentId) return;

		if (!hasResume) {
			toast.error('Please upload your resume before applying');
			router.push('/student-dashboard');
			return;
		}

		createApplication.mutate(
			{
				student_id: studentId,
				drive_id: driveId,
				status: PlacementStatus.Applied,
				placement_date: null,
				package_lpa_confirmed: null
			},
			{
				onSuccess: () => {
					toast.success('Application Submitted Successfully');

					// Force refetch data to update UI
					queryClient.invalidateQueries({
						queryKey: [PLACEMENTS_QUERY_KEY, { studentId: studentId }]
					});
					queryClient.invalidateQueries({
						queryKey: [PLACEMENTS_QUERY_KEY, { driveId: driveId }]
					});
					queryClient.invalidateQueries({
						queryKey: [DRIVES_QUERY_KEY, 'eligible', studentId]
					});
				},
				onError: error => {
					toast.error(`Application Failed: ${error.message}`);
				}
			}
		);
	};

	// Only show loading state during initial load to prevent infinite spinner
	if (
		isLoading ||
		(isInitialLoad && (isLoadingDrives || isLoadingApplications))
	) {
		return (
			<div className='flex justify-center items-center h-96'>
				<div className='text-center'>
					<p className='text-muted-foreground'>Loading drives...</p>
				</div>
			</div>
		);
	}

	if (
		!eligibleDrives ||
		!Array.isArray(eligibleDrives) ||
		eligibleDrives.length === 0
	) {
		return (
			<div className='pt-4'>
				<h1 className='text-2xl font-bold mb-6'>Available Placement Drives</h1>
				<Card>
					<CardContent className='p-6'>
						<p className='text-center text-muted-foreground py-8'>
							No eligible placement drives found at this time. Check back later
							or contact your placement coordinator.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<ErrorBoundary>
			<div className='pt-4'>
				<h1 className='text-2xl font-bold mb-6'>Available Placement Drives</h1>
				{isLoadingDrives && !isInitialLoad && (
					<div className='mb-4 text-sm text-muted-foreground'>
						Refreshing drives...
					</div>
				)}
				<div className='grid gap-6'>
					{eligibleDrives.map(drive => {
						// Check if the student has already applied to this drive
						const hasApplied = myApplications
							? myApplications.some(app => app.drive_id === drive.drive_id)
							: false;

						return (
							<Card key={drive.drive_id} className='overflow-hidden'>
								<CardHeader className='pb-4'>
									<div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
										<div>
											<CardTitle>{drive.job_title}</CardTitle>
											<CardDescription>
												{drive.company?.name || 'Unknown Company'}
											</CardDescription>
										</div>
										<Button
											onClick={() => handleApply(drive.drive_id)}
											disabled={
												createApplication.isPending || !hasResume || hasApplied
											}
											variant={hasApplied ? 'outline' : 'default'}
											className='w-full sm:w-auto'>
											{!hasResume
												? 'Upload Resume First'
												: hasApplied
												? 'Applied'
												: 'Apply Now'}
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
										<div>
											<p className='text-sm font-medium text-muted-foreground'>
												Package
											</p>
											<p>
												{drive.package_lpa
													? `₹${drive.package_lpa} LPA`
													: 'Not specified'}
											</p>
										</div>
										<div>
											<p className='text-sm font-medium text-muted-foreground'>
												Drive Date
											</p>
											<p>
												{drive.drive_date
													? formatDate(drive.drive_date)
													: 'To be announced'}
											</p>
										</div>
										<div>
											<p className='text-sm font-medium text-muted-foreground'>
												Application Deadline
											</p>
											<p>
												{drive.application_deadline
													? formatDate(drive.application_deadline)
													: 'Open'}
											</p>
										</div>
									</div>
									{drive.description && (
										<div className='mt-2'>
											<p className='text-sm font-medium text-muted-foreground'>
												Description
											</p>
											<p className='mt-1'>{drive.description}</p>
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</ErrorBoundary>
	);
}
