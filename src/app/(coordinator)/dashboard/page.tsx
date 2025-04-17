'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
import {
	Users,
	Briefcase,
	GraduationCap,
	BarChart3,
	Building,
	CalendarDays,
	TrendingUp,
	Clock
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Student, Drive, Placement, Branch, PlacementStatus } from '@/types';
import {
	fetchStudents,
	fetchDrives,
	fetchPlacements,
	fetchBranches
} from '@/services/api';
import { formatDate } from '@/lib/utils';

type NormalizedStudent = Student & {
	student_id?: string;
	department_branch_id?: number;
};

type NormalizedDrive = Drive & {
	drive_id?: string;
	company_id?: string;
	drive_date?: string;
	application_deadline?: string;
	job_title?: string;
	package_lpa?: number;
	company?: {
		name: string;
	};
};

type NormalizedPlacement = Omit<Placement, 'status'> & {
	student_id?: string;
	package_lpa_confirmed?: number;
	status: Placement['status'] | PlacementStatus;
};

type NormalizedBranch = Branch & {
	branch_id?: number;
	branch_name?: string;
};

function useAdminDashboardData() {
	const { data: studentsData = [] } = useQuery<NormalizedStudent[]>({
		queryKey: ['students'],
		queryFn: fetchStudents
	});

	const { data: drivesData = [] } = useQuery<NormalizedDrive[]>({
		queryKey: ['drives'],
		queryFn: fetchDrives
	});

	const { data: placementsData = [] } = useQuery<NormalizedPlacement[]>({
		queryKey: ['placements'],
		queryFn: fetchPlacements,
		staleTime: 0,
		refetchOnMount: true,
		refetchInterval: 2000
	});

	const { data: branchesData = [] } = useQuery<NormalizedBranch[]>({
		queryKey: ['branches'],
		queryFn: fetchBranches
	});

	const students = React.useMemo(() => studentsData || [], [studentsData]);
	const drives = React.useMemo(() => drivesData || [], [drivesData]);
	const placements = React.useMemo(
		() => placementsData || [],
		[placementsData]
	);
	const branches = React.useMemo(() => branchesData || [], [branchesData]);

	const totalStudents = students.length;
	const totalDrives = drives.length;
	const totalCompanies = React.useMemo(
		() =>
			drives.length
				? new Set(drives.map(drive => drive.company_id || drive.id)).size
				: 0,
		[drives]
	);
	const totalApplications = placements.length;

	const isPlacementAccepted = React.useCallback((p: NormalizedPlacement) => {
		return (
			p.status === PlacementStatus.Offer_Accepted ||
			p.status === PlacementStatus.Offered
		);
	}, []);

	const placedStudents = React.useMemo(() => {
		if (placements.length === 0) return 0;
		const placedStudentIds = new Set(
			placements
				.filter(isPlacementAccepted)
				.map(p => p.student_id || p.studentId)
		);
		return placedStudentIds.size;
	}, [placements, isPlacementAccepted]);

	const placementRate = React.useMemo(
		() =>
			totalStudents ? Math.round((placedStudents / totalStudents) * 100) : 0,
		[totalStudents, placedStudents]
	);

	const averagePackage = React.useMemo(() => {
		if (placements.length === 0) return 0;

		console.log('Calculating avg package with placements:', placements);

		const placedRecords = placements.filter(p => {
			const isRelevantStatus =
				p.status === PlacementStatus.Offer_Accepted ||
				p.status === PlacementStatus.Offered;

			// Get drive details if needed
			const driveId = p.driveId;
			const matchingDrive = drives.find(d => (d.drive_id || d.id) === driveId);
			const drivePackage = matchingDrive?.package_lpa;

			// Check if package exists in either field
			const hasPackage =
				(p.package_lpa_confirmed !== null &&
					p.package_lpa_confirmed !== undefined) ||
				(drivePackage !== null && drivePackage !== undefined);

			console.log(
				`Placement: status=${p.status}, package_confirmed=${
					p.package_lpa_confirmed
				}, drive_package=${drivePackage}, included=${
					isRelevantStatus && hasPackage
				}`
			);

			return isRelevantStatus && hasPackage;
		});

		console.log('Filtered placed records:', placedRecords);

		if (placedRecords.length === 0) return 0;

		const totalPackage = placedRecords.reduce((sum, record) => {
			const driveId = record.driveId;
			const matchingDrive = drives.find(d => (d.drive_id || d.id) === driveId);
			const drivePackage = matchingDrive?.package_lpa || 0;

			return sum + (record.package_lpa_confirmed ?? drivePackage);
		}, 0);

		console.log(
			`Total package: ${totalPackage}, Records: ${placedRecords.length}, Avg: ${
				totalPackage / placedRecords.length
			}`
		);

		return totalPackage / placedRecords.length;
	}, [placements, drives]);

	const upcomingDrives = React.useMemo(() => {
		if (drives.length === 0) return [];

		const today = new Date();

		return drives
			.filter(drive => {
				const driveDate = drive.drive_date || drive.driveDate;
				return driveDate && new Date(driveDate) >= today;
			})
			.sort((a, b) => {
				const aDate = a.drive_date || a.driveDate;
				const bDate = b.drive_date || b.driveDate;
				if (!aDate || !bDate) return 0;
				return new Date(aDate).getTime() - new Date(bDate).getTime();
			})
			.slice(0, 5);
	}, [drives]);

	const branchStats = React.useMemo(() => {
		if (branches.length === 0 || students.length === 0) return [];

		return branches.map(branch => {
			const branchStudents = students.filter(
				s => s.department_branch_id === branch.branch_id
			);
			const totalBranchStudents = branchStudents.length;

			const placedStudentIds = new Set(
				placements
					.filter(isPlacementAccepted)
					.map(p => p.student_id || p.studentId)
			);

			const placedBranchStudents = branchStudents.filter(s =>
				placedStudentIds.has(s.student_id || s.id)
			).length;

			const branchPlacementRate =
				totalBranchStudents > 0
					? Math.round((placedBranchStudents / totalBranchStudents) * 100)
					: 0;

			return {
				branch_id: branch.branch_id || Number(branch.id),
				branch_name: branch.branch_name || branch.name,
				total_students: totalBranchStudents,
				placed_students: placedBranchStudents,
				placement_rate: branchPlacementRate
			};
		});
	}, [branches, students, placements, isPlacementAccepted]);

	const statusCounts = React.useMemo(() => {
		if (placements.length === 0) return [];

		return Object.values(PlacementStatus).map(status => {
			const count = placements.filter(p => {
				if (typeof status === 'string' && typeof p.status === 'string') {
					return p.status === status;
				}
				return false;
			}).length;

			const percentage = totalApplications
				? Math.round((count / totalApplications) * 100)
				: 0;

			return {
				status: String(status),
				count,
				percentage
			};
		});
	}, [placements, totalApplications]);

	return {
		totalStudents,
		totalDrives,
		totalCompanies,
		totalApplications,
		placedStudents,
		placementRate,
		averagePackage,
		upcomingDrives,
		branchStats,
		statusCounts
	};
}

export default function AdminDashboard() {
	const router = useRouter();
	const {
		totalStudents,
		totalDrives,
		totalCompanies,
		totalApplications,
		placementRate,
		averagePackage,
		upcomingDrives,
		branchStats,
		statusCounts
	} = useAdminDashboardData();

	return (
		<div className='container py-10'>
			<h1 className='text-3xl font-bold mb-2'>Admin Dashboard</h1>
			<p className='text-muted-foreground mb-8'>
				Training & Placement Cell Overview
			</p>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>
									Total Students
								</p>
								<h3 className='text-2xl font-bold mt-1'>{totalStudents}</h3>
							</div>
							<Users className='h-8 w-8 text-primary/80' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>
									Placement Rate
								</p>
								<h3 className='text-2xl font-bold mt-1'>{placementRate}%</h3>
							</div>
							<TrendingUp className='h-8 w-8 text-green-600' />
						</div>
						<Progress value={placementRate} className='mt-3' />
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>
									Avg. Package
								</p>
								<h3 className='text-2xl font-bold mt-1'>
									₹{averagePackage.toFixed(2)} LPA
								</h3>
							</div>
							<BarChart3 className='h-8 w-8 text-primary/80' />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className='p-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-muted-foreground'>
									Companies Visited
								</p>
								<h3 className='text-2xl font-bold mt-1'>{totalCompanies}</h3>
							</div>
							<Building className='h-8 w-8 text-primary/80' />
						</div>
					</CardContent>
				</Card>
			</div>

			<h2 className='text-xl font-semibold mb-4'>
				Branch-wise Placement Statistics
			</h2>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
				{branchStats.map(stat => (
					<Card key={stat.branch_id}>
						<CardContent className='p-6'>
							<div className='flex justify-between items-center mb-2'>
								<h3 className='font-semibold'>{stat.branch_name}</h3>
								<Badge
									variant={
										stat.placement_rate >= 70
											? 'default'
											: stat.placement_rate >= 50
											? 'secondary'
											: 'outline'
									}>
									{stat.placement_rate}%
								</Badge>
							</div>

							<Progress value={stat.placement_rate} className='mb-2' />

							<div className='text-sm text-muted-foreground mt-2'>
								{stat.placed_students} out of {stat.total_students} students
								placed
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-lg'>Applications</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-3xl font-bold'>{totalApplications}</div>
						<div className='flex flex-col gap-2 mt-3'>
							{statusCounts.map(({ status, count, percentage }) => (
								<div
									key={status}
									className='flex items-center justify-between text-sm'>
									<span>{status.replace(/_/g, ' ')}</span>
									<span className='font-medium'>
										{count} ({percentage}%)
									</span>
								</div>
							))}
						</div>
					</CardContent>
					<CardFooter>
						<Button
							variant='outline'
							className='w-full'
							onClick={() => router.push('/placements')}>
							View All Applications
						</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-lg'>Placement Drives</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='text-3xl font-bold'>{totalDrives}</div>
						<div className='mt-3'>
							<div className='flex justify-between text-sm mb-1'>
								<span className='text-muted-foreground'>Ongoing/Upcoming</span>
								<span className='font-medium'>{upcomingDrives.length}</span>
							</div>
							<div className='flex justify-between text-sm'>
								<span className='text-muted-foreground'>Completed</span>
								<span className='font-medium'>
									{totalDrives - upcomingDrives.length}
								</span>
							</div>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							variant='outline'
							className='w-full'
							onClick={() => router.push('/drives-management')}>
							Manage Drives
						</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-lg'>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col gap-2'>
							<Button
								variant='outline'
								className='justify-start'
								onClick={() => router.push('/students')}>
								<Users className='h-4 w-4 mr-2' /> Manage Students
							</Button>
							<Button
								variant='outline'
								className='justify-start'
								onClick={() => router.push('/companies')}>
								<Building className='h-4 w-4 mr-2' /> Manage Companies
							</Button>
							<Button
								variant='outline'
								className='justify-start'
								onClick={() => router.push('/criteria')}>
								<GraduationCap className='h-4 w-4 mr-2' /> Manage Criteria
							</Button>
							<Button
								variant='outline'
								className='justify-start'
								onClick={() => router.push('/drives-management/new')}>
								<Briefcase className='h-4 w-4 mr-2' /> Add New Drive
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<h2 className='text-xl font-semibold mb-4'>Upcoming Drives</h2>
			{upcomingDrives.length > 0 ? (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{upcomingDrives.map(drive => (
						<Card key={drive.drive_id || drive.id}>
							<CardHeader className='pb-2'>
								<CardTitle className='text-lg'>
									{drive.job_title || drive.role}
								</CardTitle>
								<CardDescription className='flex items-center gap-1'>
									<Building className='h-4 w-4' />
									{drive.company?.name || drive.companyName}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='flex items-center gap-1 mt-1'>
									<CalendarDays className='h-4 w-4 text-gray-500' />
									<span className='text-sm'>
										Drive date:{' '}
										{formatDate(drive.drive_date || drive.driveDate)}
									</span>
								</div>
								{(drive.application_deadline || drive.registrationDeadline) && (
									<div className='flex items-center gap-1 mt-1'>
										<Clock className='h-4 w-4 text-orange-600' />
										<span className='text-sm text-orange-600'>
											Deadline:{' '}
											{formatDate(
												drive.application_deadline || drive.registrationDeadline
											)}
										</span>
									</div>
								)}
								{(drive.package_lpa || (drive.salary && drive.salary.ctc)) && (
									<div className='text-sm font-medium mt-1'>
										Package: ₹
										{drive.package_lpa || (drive.salary && drive.salary.ctc)}{' '}
										LPA
									</div>
								)}
							</CardContent>
							<CardFooter>
								<Button
									variant='outline'
									className='w-full'
									onClick={() =>
										router.push(
											`/drives-management/${drive.drive_id || drive.id}`
										)
									}>
									View Details
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			) : (
				<div className='text-center py-6 border rounded-md'>
					<p className='text-muted-foreground'>No upcoming drives scheduled.</p>
				</div>
			)}
		</div>
	);
}
