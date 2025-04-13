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
import { Student } from '@/hooks/api/students'; 


export type StudentColumnsProps = {
	onEdit: (student: Student) => void;
	onDelete: (studentId: string) => void; 
};


export const getStudentColumns = ({
	onEdit,
	onDelete
}: StudentColumnsProps): ColumnDef<Student>[] => [
	{
		accessorKey: 'student_id',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				ID (Roll No) <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		)
	},
	{
		accessorKey: 'name',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Name <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		)
	},
	{
		accessorKey: 'email',
		header: 'Email'
	},
	{
		
		accessorKey: 'branch.branch_name',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Branch <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		)
		
		
		
		
	},
	{
		accessorKey: 'percentage',
		header: ({ column }) => (
			<Button
				variant='ghost'
				onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
				Percentage <ArrowUpDown className='ml-2 h-4 w-4' />
			</Button>
		),
		cell: ({ row }) => {
			const percentage = row.original.percentage;
			return percentage !== null && percentage !== undefined ? (
				`${
					typeof percentage === 'number' ? percentage.toFixed(2) : percentage
				}%`
			) : (
				<span className='text-muted-foreground'>N/A</span>
			);
		}
	},
	{
		accessorKey: 'grade',
		header: 'Grade',
		cell: ({ row }) =>
			row.original.grade || <span className='text-muted-foreground'>N/A</span>
	},
	{
		accessorKey: 'contact_no',
		header: 'Contact No',
		cell: ({ row }) =>
			row.original.contact_no || (
				<span className='text-muted-foreground'>N/A</span>
			)
	},
	
	{
		id: 'actions',
		cell: ({ row }) => {
			const student = row.original;

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
						{/* TODO: Add View Details action */}
						<DropdownMenuItem onClick={() => onEdit(student)}>
							Edit Student
						</DropdownMenuItem>
						{/* TODO: Add Reset Password action */}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(student.student_id)}
							className='text-red-600 focus:text-red-700 focus:bg-red-100'>
							Delete Student
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		}
	}
];
