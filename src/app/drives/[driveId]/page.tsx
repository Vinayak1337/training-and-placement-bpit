'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	ArrowLeft,
	Building,
	CalendarDays,
	Clock,
	ExternalLink
} from 'lucide-react';
import { useGetDrive } from '@/hooks/api/drives';
import { formatDate } from '@/lib/utils';
import {
	PlacementStatus,
	useCreatePlacement,
	useGetPlacements
} from '@/hooks/api/placements';
import { toast } from 'react-hot-toast';

export default function DriveDetailsPage() {
	const router = useRouter();
	const params = useParams();
	const driveId = parseInt(params.driveId as string);
	const { data: session } = useSession();
	const studentId = session?.user?.id;

	const { data: drive, isLoading: driveLoading } = useGetDrive(driveId);
	const { data: myApplications, isLoading: applicationsLoading } =
		useGetPlacements({
			studentId: studentId || '',
			driveId: driveId
		});

	const createApplication = useCreatePlacement();
	const isLoading = driveLoading || applicationsLoading;

	const hasApplied = React.useMemo(() => {
		if (!myApplications || !Array.isArray(myApplications)) return false;
		return myApplications.some(app => app.drive_id === driveId);
	}, [myApplications, driveId]);

	const applicationStatus = React.useMemo(() => {
		if (!myApplications || !Array.isArray(myApplications)) return null;
		const application = myApplications.find(app => app.drive_id === driveId);
		return application ? application.status : null;
	}, [myApplications, driveId]);

	const handleApply = () => {
		if (!studentId) {
			toast.error('Please log in to apply');
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
					toast.success('Application submitted successfully');
				},
				onError: error => {
					toast.error(`Failed to apply: ${error.message}`);
				}
			}
		);
	};

	if (isLoading) {
		return (
			<div className='container py-10'>
				<div className='flex justify-center items-center h-96'>
					<div className='text-center'>
						<p className='text-muted-foreground'>Loading drive details...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!drive) {
		return (
			<div className='container py-10'>
				<div className='text-center py-10'>
					<p className='text-muted-foreground'>Drive not found</p>
					<Button
						variant='outline'
						className='mt-4'
						onClick={() => router.push('/drives')}>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Drives
					</Button>
				</div>
			</div>
		);
	}

	const getStatusBadge = () => {
		if (!applicationStatus) return null;

		let variant: 'outline' | 'default' | 'secondary' | 'destructive' =
			'outline';

		if (applicationStatus === PlacementStatus.Offer_Accepted) {
			variant = 'default';
		} else if (applicationStatus === PlacementStatus.Offered) {
			variant = 'secondary';
		} else if (applicationStatus === PlacementStatus.Not_Placed) {
			variant = 'destructive';
		}

		return (
			<Badge variant={variant}>
				{String(applicationStatus).replace(/_/g, ' ')}
			</Badge>
		);
	};

	return (
		<div className='container py-10'>
			<Button
				variant='outline'
				className='mb-6'
				onClick={() => router.push('/drives')}>
				<ArrowLeft className='h-4 w-4 mr-2' />
				Back to Drives
			</Button>

			<div className='flex flex-col sm:flex-row justify-between items-start mb-6'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>{drive.job_title}</h1>
					<div className='flex items-center gap-2'>
						<Building className='h-4 w-4 text-muted-foreground' />
						<p className='text-muted-foreground'>{drive.company?.name}</p>
					</div>
				</div>

				{applicationStatus && (
					<div className='mt-4 sm:mt-0'>
						<p className='text-sm text-muted-foreground mb-1'>
							Application Status
						</p>
						{getStatusBadge()}
					</div>
				)}
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
				<Card>
					<CardHeader>
						<CardTitle>Job Details</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<h3 className='font-medium mb-1'>Package</h3>
							<p>
								{drive.package_lpa
									? `₹${drive.package_lpa} LPA`
									: 'Not specified'}
							</p>
						</div>

						<div>
							<h3 className='font-medium mb-1'>Grade Offered</h3>
							<p>{drive.grade_offered || 'Not specified'}</p>
						</div>

						{drive.description && (
							<div>
								<h3 className='font-medium mb-1'>Description</h3>
								<p className='whitespace-pre-line'>{drive.description}</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Schedule Information</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex items-center gap-2'>
							<CalendarDays className='h-4 w-4 text-muted-foreground' />
							<div>
								<h3 className='font-medium'>Drive Date</h3>
								<p>
									{drive.drive_date
										? formatDate(drive.drive_date)
										: 'Not scheduled yet'}
								</p>
							</div>
						</div>

						<div className='flex items-center gap-2'>
							<Clock className='h-4 w-4 text-orange-600' />
							<div>
								<h3 className='font-medium'>Application Deadline</h3>
								<p
									className={
										drive.application_deadline ? 'text-orange-600' : ''
									}>
									{drive.application_deadline
										? formatDate(drive.application_deadline)
										: 'No deadline set'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>Eligibility Criteria</CardTitle>
				</CardHeader>
				<CardContent>
					{drive.criteria && (
						<div className='space-y-4'>
							<div>
								<h3 className='font-medium mb-1'>Minimum Percentage</h3>
								<p>
									{drive.criteria.min_percentage
										? `${drive.criteria.min_percentage}%`
										: 'No minimum percentage required'}
								</p>
							</div>

							{drive.criteria.allowed_branches &&
								drive.criteria.allowed_branches.length > 0 && (
									<div>
										<h3 className='font-medium mb-2'>Eligible Branches</h3>
										<div className='flex flex-wrap gap-2'>
											{drive.criteria.allowed_branches.map((branch, index) => {
												
												const branchName =
													typeof branch === 'object' && branch
														? branch.branch_name ||
														  (branch as { name?: string }).name ||
														  'Branch'
														: 'Branch';

												return (
													<Badge key={index} variant='outline'>
														{branchName}
													</Badge>
												);
											})}
										</div>
									</div>
								)}
						</div>
					)}
				</CardContent>
			</Card>

			<div className='flex gap-4'>
				{!hasApplied ? (
					<Button
						className='w-full sm:w-auto'
						onClick={handleApply}
						disabled={hasApplied || createApplication.isPending}>
						Apply Now
					</Button>
				) : (
					<Button
						variant='outline'
						className='w-full sm:w-auto'
						onClick={() => router.push(`/application/${driveId}`)}>
						<ExternalLink className='h-4 w-4 mr-2' />
						View Application
					</Button>
				)}
			</div>
		</div>
	);
}
