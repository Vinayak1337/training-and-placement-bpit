'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	ArrowLeft,
	Building,
	CalendarDays,
	Clock,
	Edit,
	Users,
	FileText,
	Trash2
} from 'lucide-react';
import { useGetDrive, useDeleteDrive } from '@/hooks/api/drives';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function DriveManagementPage() {
	const router = useRouter();
	const params = useParams();
	const driveId = parseInt(params.driveId as string);

	const { data: drive, isLoading } = useGetDrive(driveId);
	const deleteDrive = useDeleteDrive();

	const handleDelete = () => {
		if (
			confirm(
				'Are you sure you want to delete this drive? This action cannot be undone.'
			)
		) {
			deleteDrive.mutate(driveId, {
				onSuccess: () => {
					toast.success('Drive deleted successfully');
					router.push('/drives-management');
				},
				onError: error => {
					toast.error(`Failed to delete drive: ${error.message}`);
				}
			});
		}
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
						onClick={() => router.push('/drives-management')}>
						<ArrowLeft className='h-4 w-4 mr-2' />
						Back to Drives
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='container py-10'>
			<Button
				variant='outline'
				className='mb-6'
				onClick={() => router.push('/drives-management')}>
				<ArrowLeft className='h-4 w-4 mr-2' />
				Back to Drives
			</Button>

			<div className='flex justify-between items-start mb-6'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>{drive.job_title}</h1>
					<div className='flex items-center gap-2'>
						<Building className='h-4 w-4 text-muted-foreground' />
						<p className='text-muted-foreground'>{drive.company?.name}</p>
					</div>
				</div>

				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => router.push(`/drives-management/${driveId}/edit`)}>
						<Edit className='h-4 w-4 mr-2' />
						Edit
					</Button>
					<Button variant='destructive' size='sm' onClick={handleDelete}>
						<Trash2 className='h-4 w-4 mr-2' />
						Delete
					</Button>
				</div>
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

			<div className='flex flex-col sm:flex-row gap-4'>
				<Button
					className='w-full sm:w-auto'
					onClick={() =>
						router.push(`/drives-management/${driveId}/applications`)
					}>
					<Users className='h-4 w-4 mr-2' />
					Manage Applications
				</Button>

				<Button
					variant='outline'
					className='w-full sm:w-auto'
					onClick={() => router.push(`/application/${driveId}`)}>
					<FileText className='h-4 w-4 mr-2' />
					Preview Application Form
				</Button>
			</div>
		</div>
	);
}
