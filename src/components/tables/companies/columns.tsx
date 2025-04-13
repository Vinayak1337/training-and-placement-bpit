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
import { Company } from '@/hooks/api/companies';


export type CompanyColumnsProps = {
	onEdit: (company: Company) => void;
	onDelete: (companyId: number) => void;
};


export const getCompanyColumns = ({
	onEdit,
	onDelete
}: CompanyColumnsProps): ColumnDef<Company>[] => [
	{
		accessorKey: 'company_id',
		header: ({ column }) => {
			
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					ID
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			);
		}
	},
	{
		accessorKey: 'name',
		header: ({ column }) => {
			
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
					Company Name
					<ArrowUpDown className='ml-2 h-4 w-4' />
				</Button>
			);
		}
	},
	{
		accessorKey: 'website_url',
		header: 'Website',
		cell: ({ row }) => {
			
			const website = row.original.website_url;
			return website ? (
				<a
					href={website}
					target='_blank'
					rel='noopener noreferrer'
					className='text-blue-600 hover:underline'>
					{website}
				</a>
			) : (
				<span className='text-muted-foreground'>N/A</span>
			);
		}
	},
	{
		id: 'actions',
		cell: ({ row }) => {
			const company = row.original;

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
						{/* Add other relevant actions if needed */}
						<DropdownMenuItem onClick={() => onEdit(company)}>
							Edit Company
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(company.company_id)}
							className='text-red-600 focus:text-red-700 focus:bg-red-100'>
							Delete Company
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		}
	}
];
