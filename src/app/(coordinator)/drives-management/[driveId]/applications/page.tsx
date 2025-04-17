'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
	ArrowLeft,
	User,
	GraduationCap,
	Mail,
	Phone,
	FileText,
	Clock
} from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import {
	PlacementStatus,
	useGetPlacements,
	useUpdatePlacement
} from '@/hooks/api/placements';
import { useGetDrive } from '@/hooks/api/drives';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function DriveApplicationsPage() {
	const router = useRouter();
	const params = useParams();
	const driveId = parseInt(params.driveId as string);

	const { data: drive, isLoading: driveLoading } = useGetDrive(driveId);
	const { data: placements, isLoading: placementsLoading } = useGetPlacements({
		driveId
	});
	const updatePlacement = useUpdatePlacement();

	const handleStatusChange = (
		placementId: number,
		newStatus: PlacementStatus
	) => {
		updatePlacement.mutate(
			{
				placementId,
				data: {
					status: newStatus,
					placement_date: null,
					package_lpa_confirmed: null
				}
			},
			{
				onSuccess: () => {
					toast.success('Application status updated');
				},
				onError: error => {
					toast.error(`Error updating status: ${error.message}`);
				}
			}
		);
	};

	const isLoading = driveLoading || placementsLoading;

	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-96'>
				<div className='text-center'>
					<p className='text-muted-foreground'>Loading applications...</p>
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

			<div className='mb-6'>
				<h1 className='text-3xl font-bold mb-2'>{drive.job_title}</h1>
				<p className='text-muted-foreground'>
					Applications for {drive.company.name}
				</p>
			</div>

			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>Drive Details</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div>
							<p className='text-sm font-medium text-muted-foreground'>
								Drive Date
							</p>
							<p>
								{drive.drive_date ? formatDate(drive.drive_date) : 'Not set'}
							</p>
						</div>
						<div>
							<p className='text-sm font-medium text-muted-foreground'>
								Package
							</p>
							<p>{drive.package_lpa ? `₹${drive.package_lpa} LPA` : '-'}</p>
						</div>
						<div>
							<p className='text-sm font-medium text-muted-foreground'>
								Application Deadline
							</p>
							<p>
								{drive.application_deadline
									? formatDate(drive.application_deadline)
									: 'Not set'}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Applicants</CardTitle>
					<CardDescription>
						{Array.isArray(placements) ? placements.length : 0} applications
						received
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!Array.isArray(placements) || placements.length === 0 ? (
						<div className='text-center py-6'>
							<p className='text-muted-foreground'>
								No applications received yet
							</p>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Student</TableHead>
										<TableHead>Branch</TableHead>
										<TableHead>Percentage</TableHead>
										<TableHead>Applied On</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Resume</TableHead>
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{placements.map(placement => (
										<TableRow key={placement.placement_id}>
											<TableCell>
												<div className='font-medium'>
													{placement.student.name}
												</div>
												<div className='flex items-center gap-1 text-sm text-muted-foreground'>
													<User className='h-3 w-3' />
													{placement.student.student_id}
												</div>
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-1'>
													<GraduationCap className='h-4 w-4 text-muted-foreground' />
													{placement.student.branch?.branch_name || 'Unknown'}
												</div>
											</TableCell>
											<TableCell>
												{placement.student.percentage
													? `${placement.student.percentage}%`
													: '-'}
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-1'>
													<Clock className='h-4 w-4 text-muted-foreground' />
													{formatDate(placement.application_date)}
												</div>
											</TableCell>
											<TableCell>
												<Select
													value={placement.status}
													onValueChange={value =>
														handleStatusChange(
															placement.placement_id,
															value as PlacementStatus
														)
													}
													disabled={updatePlacement.isPending}>
													<SelectTrigger className='w-[180px]'>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{Object.values(PlacementStatus).map(status => (
															<SelectItem key={status} value={status}>
																{status.replace(/_/g, ' ')}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												{placement.student.resume_url ? (
													<Button
														variant='outline'
														size='sm'
														onClick={() =>
															window.open(
																placement.student.resume_url || '#',
																'_blank'
															)
														}>
														<FileText className='h-4 w-4 mr-2' />
														View
													</Button>
												) : (
													<Badge variant='outline'>No Resume</Badge>
												)}
											</TableCell>
											<TableCell>
												<div className='flex gap-2'>
													<Button
														variant='outline'
														size='sm'
														onClick={() =>
															window.open(
																`mailto:${placement.student.email}`,
																'_blank'
															)
														}>
														<Mail className='h-4 w-4' />
													</Button>
													{placement.student.contact_no && (
														<Button
															variant='outline'
															size='sm'
															onClick={() =>
																window.open(
																	`tel:${placement.student.contact_no}`,
																	'_blank'
																)
															}>
															<Phone className='h-4 w-4' />
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
