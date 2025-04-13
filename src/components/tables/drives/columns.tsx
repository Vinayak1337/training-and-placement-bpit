'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Drive } from '@/hooks/api/drives';


export type DriveColumnsProps = {
	onEdit: (drive: Drive) => void;
	onDelete: (driveId: number) => void;
	onViewApplicants?: (driveId: number) => void;
};


const formatDate = (dateString: string | null) => {
	if (!dateString) return 'N/A';
	return new Date(dateString).toLocaleDateString();
};


export const getDriveColumns = ({
	onEdit,
	onDelete,
	onViewApplicants
}: DriveColumnsProps): ColumnDef<Drive>[] => [
	{
		accessorKey: 'job_title',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Job Title <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		)
	},
	{
		accessorKey: 'company.name',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Company <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		)
	},
	{
		accessorKey: 'package_lpa',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Package (LPA) <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => {
			const packageLpa = row.original.package_lpa;
			return packageLpa !== null ? (
				`₹${packageLpa.toFixed(2)} LPA`
			) : (
				<span className='text-muted-foreground'>N/A</span>
			);
		}
	},
	{
		accessorKey: 'criteria',
		header: 'Eligibility',
		cell: ({ row }) => {
			const criteria = row.original.criteria;
			const minPercentage = criteria.min_percentage;
			const allowedBranches = criteria.allowed_branches.map(
				branch => branch.branch_name
			);

			return (
				<div className='space-y-1'>
					<p>{minPercentage !== null ? `Min ${minPercentage}%` : 'No min %'}</p>
					<div className='flex flex-wrap gap-1'>
						{allowedBranches.map((branch, i) => (
							<Badge key={i} variant='outline'>
								{branch}
							</Badge>
						))}
					</div>
				</div>
			);
		}
	},
	{
		accessorKey: 'drive_date',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Drive Date <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => formatDate(row.original.drive_date)
	},
	{
		accessorKey: 'application_deadline',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Deadline <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => formatDate(row.original.application_deadline)
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			const drive = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='ghost' className='h-8 w-8 p-0'>
							<span className='sr-only'>Open menu</span>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem onClick={() => onEdit(drive)}>
							Edit Drive
						</DropdownMenuItem>

						{onViewApplicants && (
							<DropdownMenuItem
								onClick={() => onViewApplicants(drive.drive_id)}>
								View Applicants
							</DropdownMenuItem>
						)}

						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(drive.drive_id)}
							className='text-red-600 focus:text-red-700 focus:bg-red-100'>
							Delete Drive
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		}
	}
];
