'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { Calendar, BuildingIcon, GraduationCap, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetEligibleDrives, Drive } from '@/hooks/api/drives';
import {
	Placement,
	PlacementStatus,
	useCreatePlacement,
	useGetPlacements
} from '@/hooks/api/placements';
import toast from 'react-hot-toast';
import { ResumeUpload } from '@/components/ui/resume-upload';

function StudentResumeManager() {
	const { data: session } = useSession();
	const studentId = session?.user?.id;
	const [isUploading, setIsUploading] = React.useState(false);
	const [resumeUrl, setResumeUrl] = React.useState<string | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);

	React.useEffect(() => {
		if (!studentId) return;

		async function fetchStudentData() {
			setIsLoading(true);
			try {
				if (typeof studentId !== 'string' || !studentId.trim()) {
					setIsLoading(false);
					return;
				}

				const response = await fetch(`/api/students/${studentId}`, {
					credentials: 'include'
				});
				if (!response.ok) {
					setIsLoading(false);
					toast.error(`Error fetching student data: ${response.status}`);
					return;
				}

				const student = await response.json();

				if (student && student.resume_url) {
					setResumeUrl(student.resume_url);
				}
			} catch {
				toast.error('Failed to fetch student data');
			} finally {
				setIsLoading(false);
			}
		}

		fetchStudentData();
	}, [studentId]);

	const handleResumeUpload = async (cloudinaryUrl: string) => {
		if (!studentId) return;

		setIsUploading(true);

		try {
			const updateResponse = await fetch(`/api/students/${studentId}/resume`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ resume_url: cloudinaryUrl })
			});

			if (!updateResponse.ok) {
				const errorData = await updateResponse.json();
				throw new Error(errorData.message || 'Failed to update student record');
			}

			setResumeUrl(cloudinaryUrl);
			toast.success('Resume uploaded and saved to your profile');
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to update resume record'
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleViewResume = () => {
		if (resumeUrl) {
			window.open(resumeUrl, '_blank');
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Resume Management</CardTitle>
					<CardDescription>Loading your resume data...</CardDescription>
				</CardHeader>
				<CardContent className='flex items-center justify-center p-6'>
					<div className='flex flex-col items-center space-y-2'>
						<Loader2 className='h-8 w-8 animate-spin text-primary' />
						<p className='text-sm text-muted-foreground'>
							Loading resume data...
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='relative border-primary/20 shadow-md overflow-hidden gap-3'>
			<div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2'></div>
			<CardHeader className='pb-2 bg-primary/5 relative'>
				<div className='flex items-center justify-between'>
					<div>
						<CardTitle className='flex items-center gap-2'>
							<GraduationCap className='h-5 w-5 text-primary' />
							Resume Management
						</CardTitle>
						<CardDescription>
							Upload your resume for placement applications
						</CardDescription>
					</div>
					{resumeUrl && (
						<Badge className='bg-green-600 text-black border-green-700 hover:bg-green-700'>
							Resume Uploaded
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className='relative'>
				{resumeUrl ? (
					<div className='space-y-4'>
						<div className='bg-muted/50 rounded-lg p-4 border border-muted-foreground/10'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<div className='bg-primary/10 p-2 rounded-full'>
										<GraduationCap className='h-5 w-5 text-primary' />
									</div>
									<div>
										<p className='font-medium'>Resume</p>
										<p className='text-xs text-muted-foreground'>
											{resumeUrl.split('/').pop() || 'Your resume'}
										</p>
									</div>
								</div>
								<Button
									size='sm'
									variant='outline'
									onClick={handleViewResume}
									className='border-primary/20 hover:bg-primary/5'>
									View
								</Button>
							</div>
						</div>

						<ResumeUpload
							initialUrl={resumeUrl}
							onUploadSuccess={handleResumeUpload}
							disabled={isUploading}
							autoOpen={false}
						/>
					</div>
				) : (
					<div className='space-y-4'>
						<div className='bg-amber-50 rounded-lg p-4 border border-amber-200'>
							<div className='flex gap-3'>
								<div className='mt-0.5 text-amber-500 text-lg'>⚠️</div>
								<div>
									<p className='font-medium text-amber-800'>Resume Required</p>
									<p className='text-sm text-amber-700 mt-1'>
										You must upload your resume to apply for placement drives.
									</p>
								</div>
							</div>
						</div>

						<div className='mt-4'>
							<p className='text-sm text-muted-foreground mb-3'>
								Upload your resume in PDF format (max 2MB):
							</p>
							<ResumeUpload
								onUploadSuccess={handleResumeUpload}
								disabled={isUploading}
								autoOpen={false}
							/>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export default function StudentDashboard() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const studentId = session?.user?.id;
	const isLoading = status === 'loading';
	const [hasResume, setHasResume] = React.useState<boolean>(false);

	React.useEffect(() => {
		if (status !== 'loading' && !studentId) {
			router.push('/student-login');
		}
	}, [status, studentId, router]);

	React.useEffect(() => {
		if (!studentId) return;

		async function fetchStudentResume() {
			try {
				const response = await fetch(`/api/students/${studentId}`, {
					credentials: 'include'
				});

				if (!response.ok) {
					return;
				}

				const student = await response.json();
				setHasResume(!!student?.resume_url);
			} catch {
				setHasResume(false);
			}
		}

		fetchStudentResume();
	}, [studentId]);

	const { data: eligibleDrives, isLoading: isLoadingDrives } =
		useGetEligibleDrives(studentId || '');
	const { data: myApplications, isLoading: isLoadingApplications } =
		useGetPlacements({
			studentId: studentId || ''
		});

	const createApplication = useCreatePlacement();

	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-96'>
				<div className='text-center'>
					<p className='text-muted-foreground'>Loading dashboard...</p>
				</div>
			</div>
		);
	}

	const handleApply = (driveId: number) => {
		if (!hasResume) {
			toast.error('Please upload your resume before applying');
			return;
		}

		createApplication.mutate(
			{
				student_id: studentId!,
				drive_id: driveId,
				status: PlacementStatus.Applied,
				placement_date: null,
				package_lpa_confirmed: null
			},
			{
				onSuccess: () => {
					toast.success('Application Submitted');
				},
				onError: error => {
					toast.error(`Application Failed: ${error.message}`);
				}
			}
		);
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

	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'Not specified';
		return new Date(dateString).toLocaleDateString();
	};

	const renderEligibilityCriteria = (drive: Drive) => {
		const criteria = drive.criteria;
		const branches = criteria.allowed_branches.map(
			branch => branch.branch_name
		);

		return (
			<div className='text-sm'>
				<div className='flex items-center gap-1 mt-1'>
					<GraduationCap className='h-4 w-4 text-gray-500' />
					<span>
						{criteria.min_percentage
							? `Min. ${criteria.min_percentage}% required`
							: 'No percentage requirement'}
					</span>
				</div>
				<div className='flex flex-wrap gap-1 mt-1'>
					{branches.map((branch: string, i: number) => (
						<Badge key={i} variant='outline' className='text-xs'>
							{branch}
						</Badge>
					))}
				</div>
			</div>
		);
	};

	const renderApplications = (applications: Placement[] | undefined) => {
		if (!applications || applications.length === 0) {
			return (
				<div className='text-center py-10'>
					<p className='text-muted-foreground'>
						You haven&apos;t applied to any drives yet.
					</p>
				</div>
			);
		}

		return (
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{applications.map(application => (
					<Card key={application.placement_id} className='flex flex-col h-full'>
						<CardHeader className='pb-2'>
							<CardTitle className='text-lg'>
								{application.drive.job_title}
							</CardTitle>
							<CardDescription className='flex items-center gap-1'>
								<BuildingIcon className='h-4 w-4' />
								{application.drive.company.name}
							</CardDescription>
						</CardHeader>
						<CardContent className='flex-grow'>
							<div className='text-sm mb-4'>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Status:</span>
									{getStatusBadge(application.status)}
								</div>
								<div className='flex justify-between mt-2'>
									<span className='text-muted-foreground'>Applied On:</span>
									<span>{formatDate(application.application_date)}</span>
								</div>
								{application.drive.drive_date && (
									<div className='flex justify-between mt-2'>
										<span className='text-muted-foreground'>Drive Date:</span>
										<span>{formatDate(application.drive.drive_date)}</span>
									</div>
								)}
								{application.drive.package_lpa && (
									<div className='flex justify-between mt-2'>
										<span className='text-muted-foreground'>Package:</span>
										<span>₹{application.drive.package_lpa} LPA</span>
									</div>
								)}
							</div>
						</CardContent>
						<CardFooter className='mt-auto'>
							<Button
								variant='outline'
								className='w-full'
								onClick={() => router.push(`/drives/${application.drive_id}`)}
								title='View drive details'>
								View Drive
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>
		);
	};

	const renderEligibleDrives = (drives: Drive[] | undefined) => {
		if (!drives || drives.length === 0) {
			return (
				<div className='text-center py-10'>
					<p className='text-muted-foreground'>
						No eligible drives available at the moment.
					</p>
				</div>
			);
		}

		// Get list of drive IDs the student has already applied to
		const appliedDriveIds = myApplications
			? myApplications.map(app => app.drive_id)
			: [];

		return (
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{drives.map(drive => {
					const hasApplied = appliedDriveIds.includes(drive.drive_id);

					return (
						<Card key={drive.drive_id} className='flex flex-col h-full'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-lg'>{drive.job_title}</CardTitle>
								<CardDescription className='flex items-center gap-1'>
									<BuildingIcon className='h-4 w-4' />
									{drive.company.name}
								</CardDescription>
							</CardHeader>
							<CardContent className='flex-grow'>
								<div className='space-y-2'>
									{renderEligibilityCriteria(drive)}

									<div className='flex items-center gap-1 mt-2'>
										<Calendar className='h-4 w-4 text-gray-500' />
										<span className='text-sm'>
											{drive.drive_date
												? `Drive: ${formatDate(drive.drive_date)}`
												: 'Drive date not specified'}
										</span>
									</div>

									{drive.application_deadline && (
										<div className='text-sm text-orange-600 font-medium mt-1'>
											Apply before: {formatDate(drive.application_deadline)}
										</div>
									)}

									{drive.package_lpa && (
										<div className='text-sm font-semibold mt-1'>
											Package: ₹{drive.package_lpa} LPA
										</div>
									)}

									{drive.description && (
										<div className='text-sm mt-2 text-gray-600 line-clamp-3'>
											{drive.description}
										</div>
									)}
								</div>
							</CardContent>
							<CardFooter className='mt-auto'>
								<Button
									onClick={() => handleApply(drive.drive_id)}
									className='w-full'
									disabled={
										createApplication.isPending || !hasResume || hasApplied
									}
									variant={hasApplied ? 'outline' : 'default'}>
									{!hasResume
										? 'Upload Resume First'
										: hasApplied
										? 'Applied'
										: 'Apply Now'}
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>
		);
	};

	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-3xl font-bold tracking-tight'>Student Dashboard</h2>
				<p className='text-muted-foreground'>
					Welcome, {session?.user?.name || 'Student'}! Manage your applications
					and track your placement journey.
				</p>
			</div>

			<StudentResumeManager />

			<Tabs defaultValue='applications' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='applications'>My Applications</TabsTrigger>
					<TabsTrigger value='eligibleDrives'>Eligible Drives</TabsTrigger>
				</TabsList>
				<TabsContent value='applications' className='space-y-4'>
					<div className='grid gap-4'>
						<h3 className='text-lg font-medium'>Your Applications</h3>
						{isLoadingApplications ? (
							<div className='text-center py-10'>
								<p className='text-muted-foreground'>Loading applications...</p>
							</div>
						) : (
							renderApplications(
								Array.isArray(myApplications) ? myApplications : []
							)
						)}
					</div>
				</TabsContent>
				<TabsContent value='eligibleDrives' className='space-y-4'>
					<div className='grid gap-4'>
						<h3 className='text-lg font-medium'>Available Drives</h3>
						{isLoadingDrives ? (
							<div className='text-center py-10'>
								<p className='text-muted-foreground'>Loading drives...</p>
							</div>
						) : (
							renderEligibleDrives(
								Array.isArray(eligibleDrives) ? eligibleDrives : []
							)
						)}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
