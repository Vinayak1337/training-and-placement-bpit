'use client';

import * as React from 'react';
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	SortingState,
	getSortedRowModel,
	ColumnFiltersState,
	getFilteredRowModel,
	getPaginationRowModel
} from '@tanstack/react-table';
import { PlusCircle } from 'lucide-react';
import { useCallback } from 'react';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogOverlay
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Student,
	useGetStudents,
	useAddStudent,
	useUpdateStudent,
	useDeleteStudent,
	StudentCreateFormData,
	StudentUpdateFormData
} from '@/hooks/api/students';
import StudentForm, {
	CreateStudentValues,
	UpdateStudentValues
} from '@/components/forms/StudentForm';
import { getStudentColumns } from '@/components/tables/students/columns';

export default function StudentsPage() {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
	const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
		null
	);

	const {
		data: students,
		isLoading: isLoadingStudents,
		error: studentsError
	} = useGetStudents();
	const addStudentMutation = useAddStudent();
	const updateStudentMutation = useUpdateStudent();
	const deleteStudentMutation = useDeleteStudent();

	const handleAddStudent = () => {
		setSelectedStudent(null);
		setIsEditDialogOpen(true);
	};

	const handleEditStudent = useCallback((student: Student) => {
		setSelectedStudent(student);
		setIsEditDialogOpen(true);
	}, []);

	const handleDeleteStudent = useCallback(
		(studentId: string) => {
			const studentToDelete = students?.find(s => s.student_id === studentId);
			if (studentToDelete) {
				setSelectedStudent(studentToDelete);
				setIsDeleteDialogOpen(true);
			}
		},
		[students]
	);

	const confirmDelete = () => {
		if (selectedStudent) {
			deleteStudentMutation.mutate(selectedStudent.student_id, {
				onSuccess: () => {
					setIsDeleteDialogOpen(false);
					setSelectedStudent(null);
				},
				onError: error => {
					alert(`Error deleting student: ${error.message}`);
				}
			});
		}
	};

	const handleFormSubmit = (
		values: CreateStudentValues | UpdateStudentValues
	) => {
		const mutationOptions = {
			onSuccess: () => {
				setIsEditDialogOpen(false);
				setSelectedStudent(null);
			},
			onError: (error: Error) => {
				alert(`Error saving student: ${error.message}`);
			}
		};

		if (selectedStudent && !('password' in values)) {
			const updateData: StudentUpdateFormData = {
				name: values.name,
				email: values.email,
				department_branch_id: values.department_branch_id,
				grade: values.grade,
				percentage: values.percentage ? Number(values.percentage) : null,
				address: values.address,
				contact_no: values.contact_no,
				resume_url: values.resume_url
			};

			updateStudentMutation.mutate(
				{
					studentId: selectedStudent.student_id,
					data: updateData
				},
				mutationOptions
			);
		} else if (!selectedStudent && 'password' in values) {
			const createData: StudentCreateFormData = {
				name: values.name,
				email: values.email,
				student_id: values.student_id,
				department_branch_id: values.department_branch_id,
				password: values.password,
				grade: values.grade,
				percentage: values.percentage ? Number(values.percentage) : null,
				address: values.address,
				contact_no: values.contact_no,
				resume_url: values.resume_url
			};

			addStudentMutation.mutate(createData, mutationOptions);
		} else {
			console.error('Form submission mismatch:', values);
			alert('An unexpected error occurred during form submission.');
		}
	};

	const columns = React.useMemo(
		() =>
			getStudentColumns({
				onEdit: handleEditStudent,
				onDelete: handleDeleteStudent
			}),
		[handleEditStudent, handleDeleteStudent]
	);

	const table = useReactTable({
		data: students ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: { sorting, columnFilters },
		initialState: { pagination: { pageSize: 10 } }
	});

	if (isLoadingStudents) return <div>Loading students...</div>;
	if (studentsError)
		return <div>Error loading students: {studentsError.message}</div>;

	return (
		<div className='container mx-auto py-10'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold'>Manage Students</h1>
				<Dialog
					open={isEditDialogOpen && !selectedStudent}
					onOpenChange={open => {
						if (!open) setIsEditDialogOpen(false);
					}}>
					<DialogTrigger asChild>
						<Button onClick={handleAddStudent}>
							<PlusCircle className='mr-2 h-4 w-4' /> Add New Student
						</Button>
					</DialogTrigger>
					<DialogOverlay className='fixed inset-0 z-50 bg-black/60' />
					<DialogContent className='sm:max-w-3xl max-h-[90vh] fixed z-50'>
						<DialogHeader>
							<DialogTitle>Add New Student</DialogTitle>
							<DialogDescription>
								Enter the details for the new student.
							</DialogDescription>
						</DialogHeader>
						<ScrollArea className='max-h-[70vh] p-1'>
							<StudentForm
								key='add-student-form'
								onSubmit={handleFormSubmit}
								isEditMode={false}
								isLoading={addStudentMutation.isPending}
							/>
						</ScrollArea>
					</DialogContent>
				</Dialog>
			</div>

			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4'>
				<Input
					placeholder='Filter by ID...'
					value={
						(table.getColumn('student_id')?.getFilterValue() as string) ?? ''
					}
					onChange={event =>
						table.getColumn('student_id')?.setFilterValue(event.target.value)
					}
					className='max-w-sm'
				/>
				<Input
					placeholder='Filter by Name...'
					value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
					onChange={event =>
						table.getColumn('name')?.setFilterValue(event.target.value)
					}
					className='max-w-sm'
				/>
				<Input
					placeholder='Filter by Email...'
					value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
					onChange={event =>
						table.getColumn('email')?.setFilterValue(event.target.value)
					}
					className='max-w-sm'
				/>
			</div>

			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => (
									<TableHead key={header.id}>
										{!header.isPlaceholder &&
											flexRender(
												header.column.columnDef.header,
												header.getContext()
											)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map(row => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}>
									{row.getVisibleCells().map(cell => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='h-24 text-center'>
									No students found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className='flex items-center justify-end space-x-2 py-4'>
				<Button
					variant='outline'
					size='sm'
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}>
					Previous
				</Button>
				<Button
					variant='outline'
					size='sm'
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}>
					Next
				</Button>
			</div>

			<Dialog
				open={isEditDialogOpen && !!selectedStudent}
				onOpenChange={open => {
					if (!open) {
						setIsEditDialogOpen(false);
						setSelectedStudent(null);
					}
				}}>
				<DialogOverlay className='fixed inset-0 z-50 bg-black/60' />
				<DialogContent className='sm:max-w-3xl max-h-[90vh] fixed z-50'>
					<DialogHeader>
						<DialogTitle>Edit Student</DialogTitle>
						<DialogDescription>
							Update the student&apos;s details. Click save when done.
						</DialogDescription>
					</DialogHeader>
					<ScrollArea className='max-h-[70vh] p-1'>
						{selectedStudent && (
							<StudentForm
								key={selectedStudent.student_id}
								onSubmit={handleFormSubmit}
								initialData={{
									id: selectedStudent.student_id,
									name: selectedStudent.name,
									email: selectedStudent.email,
									department_branch_id: selectedStudent.department_branch_id,
									grade: selectedStudent.grade,
									percentage:
										selectedStudent.percentage !== null
											? selectedStudent.percentage.toString()
											: null,
									address: selectedStudent.address,
									contact_no: selectedStudent.contact_no,
									resume_url: selectedStudent.resume_url,
									branch: {
										branch_id: selectedStudent.branch.branch_id.toString(),
										branch_name: selectedStudent.branch.branch_name
									}
								}}
								isEditMode={true}
								isLoading={updateStudentMutation.isPending}
							/>
						)}
					</ScrollArea>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							student <strong>{selectedStudent?.name}</strong> (ID:{' '}
							{selectedStudent?.student_id}).
							<br />
							<span className='text-destructive'>
								Warning: Deleting a student may fail if they have associated
								placement records.
							</span>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							asChild
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
							<Button
								onClick={confirmDelete}
								disabled={deleteStudentMutation.isPending}>
								{deleteStudentMutation.isPending ? 'Deleting...' : 'Delete'}
							</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
