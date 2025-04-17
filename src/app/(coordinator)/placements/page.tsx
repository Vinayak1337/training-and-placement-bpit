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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Building, Search, CalendarClock, Filter } from 'lucide-react';
import { PlacementStatus, useGetPlacements } from '@/hooks/api/placements';
import { useGetDrives } from '@/hooks/api/drives';
import { useGetStudents } from '@/hooks/api/students';

export default function PlacementsPage() {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = React.useState('');
	const [statusFilter, setStatusFilter] = React.useState<string>('all');
	const [driveFilter, setDriveFilter] = React.useState<string>('all');

	const { data: placements, isLoading: isLoadingPlacements } =
		useGetPlacements();
	const { data: drives, isLoading: isLoadingDrives } = useGetDrives();
	const { data: students, isLoading: isLoadingStudents } = useGetStudents();

	const filteredPlacements = React.useMemo(() => {
		if (!placements || !Array.isArray(placements)) return [];

		return placements.filter(placement => {
			if (statusFilter !== 'all' && placement.status !== statusFilter) {
				return false;
			}

			if (
				driveFilter !== 'all' &&
				placement.drive_id.toString() !== driveFilter
			) {
				return false;
			}

			if (searchQuery) {
				const student =
					students && Array.isArray(students)
						? students.find(s => s.student_id === placement.student_id)
						: undefined;

				const drive =
					drives && Array.isArray(drives)
						? drives.find(d => d.drive_id === placement.drive_id)
						: undefined;

				const studentName = student?.name || '';
				const companyName = drive?.company?.name || '';
				const jobTitle = drive?.job_title || '';

				const searchLower = searchQuery.toLowerCase();

				return (
					studentName.toLowerCase().includes(searchLower) ||
					companyName.toLowerCase().includes(searchLower) ||
					jobTitle.toLowerCase().includes(searchLower)
				);
			}

			return true;
		});
	}, [placements, statusFilter, driveFilter, searchQuery, students, drives]);

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

	const getStudentName = (studentId: string) => {
		return (
			students?.find(s => s.student_id === studentId)?.name || 'Unknown Student'
		);
	};

	const getDriveDetails = (driveId: number) => {
		const drive = drives?.find(d => d.drive_id === driveId);
		return {
			jobTitle: drive?.job_title || 'Unknown Position',
			companyName: drive?.company?.name || 'Unknown Company'
		};
	};

	const isLoading = isLoadingPlacements || isLoadingDrives || isLoadingStudents;

	return (
		<div className='container py-10'>
			<div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>Placement Applications</h1>
					<p className='text-muted-foreground'>
						View and manage all placement applications
					</p>
				</div>
				<Button
					variant='outline'
					onClick={() => router.push('/')}
					className='mt-4 md:mt-0'>
					Back to Dashboard
				</Button>
			</div>

			{/* Filters */}
			<Card className='mb-6'>
				<CardHeader className='pb-3'>
					<CardTitle className='text-lg'>Filters & Search</CardTitle>
					<CardDescription>
						Filter applications by status, drive, or search by student/company
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<div className='relative'>
							<Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
							<Input
								placeholder='Search by student or company...'
								className='pl-8'
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
							/>
						</div>

						<Select
							value={statusFilter}
							onValueChange={value => setStatusFilter(value)}>
							<SelectTrigger>
								<Filter className='h-4 w-4 mr-2' />
								<SelectValue placeholder='Filter by status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Statuses</SelectItem>
								{Object.values(PlacementStatus).map(status => (
									<SelectItem key={status} value={status}>
										{status.replace(/_/g, ' ')}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={driveFilter}
							onValueChange={value => setDriveFilter(value)}>
							<SelectTrigger>
								<Building className='h-4 w-4 mr-2' />
								<SelectValue placeholder='Filter by drive' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Drives</SelectItem>
								{drives?.map(drive => (
									<SelectItem
										key={drive.drive_id}
										value={drive.drive_id.toString()}>
										{drive.company.name} - {drive.job_title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{isLoading ? (
				<div className='text-center py-20'>
					<p className='text-muted-foreground'>Loading applications...</p>
				</div>
			) : filteredPlacements.length === 0 ? (
				<div className='text-center py-20 border rounded-lg'>
					<p className='text-muted-foreground'>No applications found</p>
					{(searchQuery || statusFilter !== 'all' || driveFilter !== 'all') && (
						<Button
							variant='outline'
							className='mt-4'
							onClick={() => {
								setSearchQuery('');
								setStatusFilter('all');
								setDriveFilter('all');
							}}>
							Clear Filters
						</Button>
					)}
				</div>
			) : (
				<Card>
					<CardContent className='p-0'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Student</TableHead>
									<TableHead>Company & Position</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Application Date</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredPlacements.map(placement => {
									const { jobTitle, companyName } = getDriveDetails(
										placement.drive_id
									);
									return (
										<TableRow key={placement.placement_id}>
											<TableCell className='font-medium'>
												{getStudentName(placement.student_id)}
											</TableCell>
											<TableCell>
												<div className='flex flex-col'>
													<span>{companyName}</span>
													<span className='text-muted-foreground text-sm'>
														{jobTitle}
													</span>
												</div>
											</TableCell>
											<TableCell>{getStatusBadge(placement.status)}</TableCell>
											<TableCell>
												<div className='flex items-center'>
													<CalendarClock className='h-4 w-4 mr-2 text-muted-foreground' />
													{formatDate(placement.application_date)}
												</div>
											</TableCell>
											<TableCell>
												<Button
													variant='ghost'
													size='sm'
													onClick={() =>
														router.push(
															`/drives-management/${placement.drive_id}/applications`
														)
													}>
													View Details
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
