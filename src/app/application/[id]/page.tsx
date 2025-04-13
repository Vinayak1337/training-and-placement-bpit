'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, BuildingIcon, ArrowLeft, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PlacementStatus } from '@/hooks/api/placements';

interface ApplicationData {
	placement_id: number;
	student_id: string;
	drive_id: number;
	status: PlacementStatus;
	application_date: string;
	last_updated: string | null;
	placement_date: string | null;
	package_lpa_confirmed: number | null;
	drive: {
		drive_id: number;
		job_title: string;
		description: string | null;
		drive_date: string | null;
		application_deadline: string | null;
		package_lpa: number | null;
		grade_offered: string | null;
		company: {
			company_id: number;
			name: string;
			website: string | null;
			description: string | null;
		};
	};
}

export default function ApplicationDetailPage() {
	const router = useRouter();
	const params = useParams();
	const { data: session, status } = useSession();
	const applicationId = parseInt(params.id as string);
	const [application, setApplication] = React.useState<ApplicationData | null>(
		null
	);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		if (status === 'unauthenticated') {
			router.push('/student-login');
			return;
		}

		if (!applicationId || status === 'loading') return;

		const fetchApplicationDetails = async () => {
			try {
				setLoading(true);
				const response = await fetch(`/api/placements/${applicationId}`);

				if (!response.ok) {
					throw new Error('Failed to fetch application details');
				}

				const data = await response.json();

				
				if (data.student_id !== session?.user?.id) {
					router.push('/student-dashboard');
					return;
				}

				setApplication(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchApplicationDetails();
	}, [applicationId, router, session, status]);

	
	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'Not specified';
		return new Date(dateString).toLocaleDateString();
	};

	
	const getStatusBadge = (status: PlacementStatus) => {
		switch (status) {
			case PlacementStatus.Applied:
				return <Badge variant='outline'>Applied</Badge>;
			case PlacementStatus.Shortlisted:
				return <Badge variant='secondary'>Shortlisted</Badge>;
			case PlacementStatus.Interview_Scheduled:
				return <Badge variant='secondary'>Interview Scheduled</Badge>;
			case PlacementStatus.Offered:
				return <Badge variant='secondary'>Offered</Badge>;
			case PlacementStatus.Offer_Accepted:
				return <Badge className='bg-green-600'>Offer Accepted</Badge>;
			case PlacementStatus.Offer_Rejected:
				return <Badge variant='destructive'>Offer Rejected</Badge>;
			case PlacementStatus.Not_Placed:
				return <Badge variant='destructive'>Not Placed</Badge>;
			default:
				return <Badge variant='outline'>{status}</Badge>;
		}
	};

	if (loading) {
		return (
			<div className='container py-10'>
				<div className='flex justify-center items-center h-64'>
					<div className='text-center'>
						<p className='text-muted-foreground'>
							Loading application details...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (error || !application) {
		return (
			<div className='container py-10'>
				<div className='text-center py-10'>
					<p className='text-muted-foreground'>
						{error || 'Application not found'}
					</p>
					<Button
						variant='outline'
						className='mt-4'
						onClick={() => router.push('/student-dashboard')}>
						Back to Dashboard
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='container py-10'>
			<div className='flex items-center mb-6'>
				<Button
					variant='ghost'
					className='mr-2 p-2'
					onClick={() => router.push('/student-dashboard')}>
					<ArrowLeft className='h-4 w-4' />
				</Button>
				<div>
					<h1 className='text-2xl font-bold'>Application Details</h1>
					<p className='text-muted-foreground'>
						Your application for{' '}
						{application.drive?.job_title || 'this position'}
					</p>
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<div className='md:col-span-2'>
					<Card>
						<CardHeader>
							<CardTitle>{application.drive?.job_title}</CardTitle>
							<CardDescription className='flex items-center gap-1'>
								<BuildingIcon className='h-4 w-4' />
								{application.drive?.company?.name || 'Company'}
							</CardDescription>
						</CardHeader>

						<CardContent className='space-y-4'>
							<div>
								<h3 className='font-medium mb-2'>Job Details</h3>
								{application.drive?.description ? (
									<p className='text-sm'>{application.drive.description}</p>
								) : (
									<p className='text-sm text-muted-foreground'>
										No details provided
									</p>
								)}
							</div>

							<Separator />

							<div className='space-y-2'>
								<h3 className='font-medium mb-2'>Application Status</h3>
								<div className='flex items-center gap-2'>
									<span className='text-muted-foreground'>Current Status:</span>
									{getStatusBadge(application.status)}
								</div>
							</div>

							<Separator />

							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<div>
									<h3 className='font-medium mb-2'>Important Dates</h3>
									<div className='space-y-2'>
										<div className='flex items-center gap-2'>
											<Calendar className='h-4 w-4 text-gray-500' />
											<span className='text-sm'>
												Applied on: {formatDate(application.application_date)}
											</span>
										</div>

										{application.drive?.drive_date && (
											<div className='flex items-center gap-2'>
												<Calendar className='h-4 w-4 text-gray-500' />
												<span className='text-sm'>
													Drive date: {formatDate(application.drive.drive_date)}
												</span>
											</div>
										)}

										{application.last_updated && (
											<div className='flex items-center gap-2'>
												<Clock className='h-4 w-4 text-gray-500' />
												<span className='text-sm'>
													Last updated: {formatDate(application.last_updated)}
												</span>
											</div>
										)}
									</div>
								</div>

								<div>
									<h3 className='font-medium mb-2'>Offer Details</h3>
									{application.status === PlacementStatus.Offered ||
									application.status === PlacementStatus.Offer_Accepted ? (
										<div className='space-y-2'>
											{application.package_lpa_confirmed ? (
												<div className='flex items-center gap-2'>
													<span className='text-sm font-medium'>
														Package: ₹{application.package_lpa_confirmed} LPA
													</span>
												</div>
											) : application.drive?.package_lpa ? (
												<div className='flex items-center gap-2'>
													<span className='text-sm'>
														Expected package: ₹{application.drive.package_lpa}{' '}
														LPA
													</span>
												</div>
											) : null}

											{application.placement_date && (
												<div className='flex items-center gap-2'>
													<Calendar className='h-4 w-4 text-gray-500' />
													<span className='text-sm'>
														Placement date:{' '}
														{formatDate(application.placement_date)}
													</span>
												</div>
											)}
										</div>
									) : (
										<p className='text-sm text-muted-foreground'>
											No offer information available
										</p>
									)}
								</div>
							</div>
						</CardContent>

						<CardFooter>
							<Button
								variant='outline'
								className='w-full'
								onClick={() => router.push('/student-dashboard')}>
								Back to Dashboard
							</Button>
						</CardFooter>
					</Card>
				</div>

				<div>
					<Card>
						<CardHeader>
							<CardTitle className='text-lg'>Company Information</CardTitle>
						</CardHeader>
						<CardContent>
							{application.drive?.company ? (
								<div className='space-y-4'>
									<div>
										<h3 className='text-sm font-medium'>
											{application.drive.company.name}
										</h3>
										{application.drive.company.website && (
											<a
												href={application.drive.company.website}
												target='_blank'
												rel='noopener noreferrer'
												className='text-sm text-blue-500 hover:underline'>
												Visit Website
											</a>
										)}
									</div>

									{application.drive.company.description && (
										<p className='text-sm'>
											{application.drive.company.description}
										</p>
									)}
								</div>
							) : (
								<p className='text-sm text-muted-foreground'>
									Company information not available
								</p>
							)}
						</CardContent>
					</Card>

					{application.drive?.grade_offered && (
						<Card className='mt-4'>
							<CardHeader>
								<CardTitle className='text-lg'>Position Details</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>
											Grade/Position:
										</span>
										<span className='text-sm font-medium'>
											{application.drive.grade_offered}
										</span>
									</div>
									{application.drive.package_lpa && (
										<div className='flex justify-between'>
											<span className='text-sm text-muted-foreground'>
												Package:
											</span>
											<span className='text-sm font-medium'>
												₹{application.drive.package_lpa} LPA
											</span>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
