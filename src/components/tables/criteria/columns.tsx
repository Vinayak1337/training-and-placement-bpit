'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
	MoreHorizontal,
	ArrowUpDown,
	CheckCircle2,
	XCircle
} from 'lucide-react'; 

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
import { Criteria } from '@/hooks/api/criteria'; 


export type CriteriaColumnsProps = {
	onEdit: (criteria: Criteria) => void;
	onDelete: (criteriaId: number) => void;
};


export const getCriteriaColumns = ({
	onEdit,
	onDelete
}: CriteriaColumnsProps): ColumnDef<Criteria>[] => [
	{
		accessorKey: 'criteria_id',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				ID <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		)
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) =>
			row.original.description || (
				<span className='text-muted-foreground'>N/A</span>
			)
	},
	{
		accessorKey: 'min_percentage',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Min % <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => {
			const percentage = row.original.min_percentage;
			return percentage !== null ? (
				`${percentage.toFixed(2)}%`
			) : (
				<span className='text-muted-foreground'>N/A</span>
			);
		}
	},
	{
		accessorKey: 'allowed_branches',
		header: 'Allowed Branches',
		cell: ({ row }) => {
			const branches = row.original.allowed_branches;
			return (
				<div className='flex flex-wrap gap-1'>
					{branches && branches.length > 0 ? (
						branches.map(branch => (
							<Badge key={branch.branch_id} variant='secondary'>
								{branch.branch_name}
							</Badge>
						))
					) : (
						<span className='text-muted-foreground'>None</span>
					)}
				</div>
			);
		},
		
		enableSorting: false
	},
	{
		accessorKey: 'active_status',
		header: 'Status',
		cell: ({ row }) => {
			const isActive = row.original.active_status;
			return isActive ? (
				<span className='flex items-center text-green-600'>
					<CheckCircle2 className='mr-1 h-4 w-4' /> Active
				</span>
			) : (
				<span className='flex items-center text-red-600'>
					<XCircle className='mr-1 h-4 w-4' /> Inactive
				</span>
			);
		}
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			const criteria = row.original;

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
						<DropdownMenuItem onClick={() => onEdit(criteria)}>
							Edit Criteria
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(criteria.criteria_id)}
							className='text-red-600 focus:text-red-700 focus:bg-red-100'>
							Delete Criteria
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		}
	}
];
