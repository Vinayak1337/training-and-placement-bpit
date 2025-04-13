'use client';

import * as React from 'react';
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	SortingState,
	getSortedRowModel,
	getPaginationRowModel,
	ColumnDef
} from '@tanstack/react-table';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
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
import {
	Criteria,
	useGetCriteria,
	useAddCriteria,
	useUpdateCriteria,
	useDeleteCriteria,
	CriteriaFormData
} from '@/hooks/api/criteria';
import CriteriaForm from '@/components/forms/CriteriaForm';

export default function CriteriaPage() {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
	const [selectedCriteria, setSelectedCriteria] =
		React.useState<Criteria | null>(null);

	const {
		data: criteriaList,
		isLoading: isLoadingCriteria,
		error: criteriaError
	} = useGetCriteria();
	const addCriteriaMutation = useAddCriteria();
	const updateCriteriaMutation = useUpdateCriteria();
	const deleteCriteriaMutation = useDeleteCriteria();

	const queryClient = useQueryClient();

	const handleAddCriteria = useCallback(() => {
		setSelectedCriteria(null);
		setIsEditDialogOpen(true);
	}, []);

	const handleEditCriteria = useCallback((criteria: Criteria) => {
		setSelectedCriteria({
			...criteria,
			min_percentage: criteria.min_percentage
				? Number(criteria.min_percentage)
				: null
		});
		setIsEditDialogOpen(true);
	}, []);

	const handleDeleteCriteria = useCallback(
		(criteriaId: number) => {
			const criteriaToDelete = criteriaList?.find(
				c => c.criteria_id === criteriaId
			);
			if (criteriaToDelete) {
				setSelectedCriteria(criteriaToDelete);
				setIsDeleteDialogOpen(true);
			}
		},
		[criteriaList]
	);

	const confirmDelete = useCallback(() => {
		if (selectedCriteria) {
			deleteCriteriaMutation.mutate(selectedCriteria.criteria_id, {
				onSuccess: () => {
					setIsDeleteDialogOpen(false);
					setSelectedCriteria(null);
					toast.success('Criteria deleted successfully!');
					queryClient.invalidateQueries({ queryKey: ['criteria'] });
				},
				onError: error => {
					console.error('Delete failed:', error);
					toast.error(`Failed to delete criteria: ${error.message}`);
				}
			});
		}
	}, [selectedCriteria, deleteCriteriaMutation, queryClient]);

	const handleFormSubmit = useCallback(
		(values: CriteriaFormData) => {
			const mutationOptions = {
				onSuccess: () => {
					setIsEditDialogOpen(false);
					setSelectedCriteria(null);
					toast.success('Criteria updated successfully!');
					queryClient.invalidateQueries({ queryKey: ['criteria'] });
				},
				onError: (error: Error) => {
					toast.error(`Failed to update criteria: ${error.message}`);
				}
			};

			if (selectedCriteria) {
				updateCriteriaMutation.mutate(
					{ criteriaId: selectedCriteria.criteria_id, data: values },
					mutationOptions
				);
			} else {
				addCriteriaMutation.mutate(values, mutationOptions);
			}
		},
		[selectedCriteria, updateCriteriaMutation, addCriteriaMutation, queryClient]
	);

	const columns: ColumnDef<Criteria>[] = useMemo(
		() => [
			{
				accessorKey: 'criteria_id',
				header: 'ID'
			},
			{
				accessorKey: 'description',
				header: 'Description'
			},
			{
				accessorKey: 'min_percentage',
				header: 'Min %'
			},
			{
				accessorKey: 'active_status',
				header: 'Status',
				cell: ({ row }) => (row.original.active_status ? 'Active' : 'Inactive')
			},
			{
				accessorKey: 'allowed_branches',
				header: 'Allowed Branches',
				cell: ({ row }) =>
					row.original.allowed_branches
						.map(branch => branch.branch_name)
						.join(', ') || 'None'
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
								<DropdownMenuItem onClick={() => handleEditCriteria(criteria)}>
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleDeleteCriteria(criteria.criteria_id)}>
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				}
			}
		],
		[handleEditCriteria, handleDeleteCriteria]
	);

	const table = useReactTable({
		data: criteriaList ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			sorting
		},
		initialState: { pagination: { pageSize: 10 } }
	});

	if (isLoadingCriteria) return <div>Loading criteria...</div>;
	if (criteriaError)
		return <div>Error loading criteria: {criteriaError.message}</div>;

	return (
		<div className='container mx-auto py-10'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold'>Manage Eligibility Criteria</h1>
				<Dialog
					open={isEditDialogOpen && !selectedCriteria}
					onOpenChange={open => {
						if (!open) setIsEditDialogOpen(false);
					}}>
					<DialogTrigger asChild>
						<Button onClick={handleAddCriteria}>
							<PlusCircle className='mr-2 h-4 w-4' /> Add New Criteria
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-lg'>
						<DialogHeader>
							<DialogTitle>Add New Criteria</DialogTitle>
							<DialogDescription>
								Define a new set of eligibility criteria and select allowed
								branches.
							</DialogDescription>
						</DialogHeader>
						<CriteriaForm
							key='add-criteria-form'
							onSubmit={handleFormSubmit}
							isLoading={addCriteriaMutation.isPending}
							submitButtonText='Add Criteria'
						/>
					</DialogContent>
				</Dialog>
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
									No criteria found.
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
				open={isEditDialogOpen && !!selectedCriteria}
				onOpenChange={open => {
					if (!open) {
						setIsEditDialogOpen(false);
						setSelectedCriteria(null);
					}
				}}>
				<DialogContent className='sm:max-w-lg'>
					<DialogHeader>
						<DialogTitle>Edit Criteria</DialogTitle>
						<DialogDescription>
							Update the details for this criteria set.
						</DialogDescription>
					</DialogHeader>
					<CriteriaForm
						key={`edit-criteria-${selectedCriteria?.criteria_id}`}
						initialData={
							selectedCriteria
								? {
										description: selectedCriteria.description,
										min_percentage: selectedCriteria.min_percentage
											? Number(selectedCriteria.min_percentage)
											: null,
										active_status: selectedCriteria.active_status,
										branch_ids: selectedCriteria.allowed_branches.map(
											b => b.branch_id
										),
										allowed_branches: selectedCriteria.allowed_branches
								  }
								: undefined
						}
						onSubmit={handleFormSubmit}
						isLoading={
							addCriteriaMutation.isPending || updateCriteriaMutation.isPending
						}
					/>
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
							criteria set (ID: {selectedCriteria?.criteria_id}).
							<br />
							<span className='text-destructive'>
								Warning: Deleting criteria may fail if it is associated with
								active drives.
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
								disabled={deleteCriteriaMutation.isPending}>
								{deleteCriteriaMutation.isPending ? 'Deleting...' : 'Delete'}
							</Button>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
