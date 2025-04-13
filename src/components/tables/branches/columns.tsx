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
import { Branch } from '@/hooks/api/branches'; 


export type BranchColumnsProps = {
	onEdit: (branch: Branch) => void;
	onDelete: (branchId: number) => void;
};


export const getBranchColumns = ({
	onEdit,
	onDelete
}: BranchColumnsProps): ColumnDef<Branch>[] => [
	{
		accessorKey: 'branch_id',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				ID
				<ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		)
	},
	{
		accessorKey: 'branch_name',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Branch Name
				<ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		)
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			const branch = row.original;

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
						<DropdownMenuItem
							onClick={() => navigator.clipboard.writeText(branch.branch_name)} 
						>
							Copy Branch Name
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => onEdit(branch)}>
							Edit Branch
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDelete(branch.branch_id)}
							className='text-red-600 focus:text-red-700 focus:bg-red-100' 
						>
							Delete Branch
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		}
	}
];
