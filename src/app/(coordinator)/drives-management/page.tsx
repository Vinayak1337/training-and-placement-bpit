'use client';

import * as React from 'react';
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
import { Building, Calendar, Plus, Users, Edit, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGetDrives, useDeleteDrive } from '@/hooks/api/drives';
import { useGetPlacements } from '@/hooks/api/placements';
import { toast } from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

export default function DrivesManagementPage() {
	const router = useRouter();
	const { data: drives, isLoading } = useGetDrives();
	const { data: placements } = useGetPlacements();
	const deleteDrive = useDeleteDrive();

	
	const applicationsByDrive = React.useMemo(() => {
		if (!placements || !Array.isArray(placements)) return {};

		const counts: Record<number, number> = {};
		placements.forEach(placement => {
			counts[placement.drive_id] = (counts[placement.drive_id] || 0) + 1;
		});

		return counts;
	}, [placements]);

	const handleDeleteDrive = (driveId: number) => {
		if (window.confirm('Are you sure you want to delete this drive?')) {
			deleteDrive.mutate(driveId, {
				onSuccess: () => {
					toast.success('Drive deleted successfully');
				},
				onError: error => {
					toast.error(`Error deleting drive: ${error.message}`);
				}
			});
		}
	};

	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-96'>
				<div className='text-center'>
					<p className='text-muted-foreground'>Loading drives...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='container py-10'>
			<div className='flex justify-between items-center mb-6'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>Drives Management</h1>
					<p className='text-muted-foreground'>
						Manage placement drives and track applications
					</p>
				</div>
				<Button onClick={() => router.push('/drives-management/new')}>
					<Plus className='h-4 w-4 mr-2' />
					Add New Drive
				</Button>
			</div>

			{!drives || drives.length === 0 ? (
				<Card>
					<CardContent className='p-6'>
						<div className='text-center py-6'>
							<p className='text-muted-foreground mb-4'>
								No placement drives found
							</p>
							<Button onClick={() => router.push('/drives-management/new')}>
								<Plus className='h-4 w-4 mr-2' />
								Create Your First Drive
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Placement Drives</CardTitle>
						<CardDescription>
							Total {drives.length} drives created
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Drive</TableHead>
									<TableHead>Company</TableHead>
									<TableHead>Date</TableHead>
									<TableHead>Package</TableHead>
									<TableHead>Applications</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{drives.map(drive => (
									<TableRow key={drive.drive_id}>
										<TableCell className='font-medium'>
											{drive.job_title}
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-1'>
												<Building className='h-4 w-4 text-muted-foreground' />
												{drive.company.name}
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-1'>
												<Calendar className='h-4 w-4 text-muted-foreground' />
												{drive.drive_date
													? formatDate(drive.drive_date)
													: 'Not set'}
											</div>
										</TableCell>
										<TableCell>
											{drive.package_lpa ? `₹${drive.package_lpa} LPA` : '-'}
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-1'>
												<Users className='h-4 w-4 text-muted-foreground' />
												<Badge variant='outline'>
													{applicationsByDrive[drive.drive_id] || 0}
												</Badge>
											</div>
										</TableCell>
										<TableCell>
											<div className='flex items-center gap-2'>
												<Button
													variant='ghost'
													size='icon'
													onClick={() =>
														router.push(
															`/drives-management/${drive.drive_id}/applications`
														)
													}>
													<Users className='h-4 w-4' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													onClick={() =>
														router.push(
															`/drives-management/${drive.drive_id}/edit`
														)
													}>
													<Edit className='h-4 w-4' />
												</Button>
												<Button
													variant='ghost'
													size='icon'
													onClick={() => handleDeleteDrive(drive.drive_id)}>
													<Trash className='h-4 w-4' />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
