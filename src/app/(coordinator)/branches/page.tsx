'use client';

import * as React from 'react';
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	SortingState,
	getSortedRowModel
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
	Branch,
	useGetBranches,
	useAddBranch,
	useUpdateBranch,
	useDeleteBranch,
	BranchFormData
} from '@/hooks/api/branches';
import BranchForm from '@/components/forms/BranchForm';
import { getBranchColumns } from '@/components/tables/branches/columns'; 

export default function BranchesPage() {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
	const [selectedBranch, setSelectedBranch] = React.useState<Branch | null>(
		null
	); 

	
	const {
		data: branches,
		isLoading: isLoadingBranches,
		error: branchesError
	} = useGetBranches();
	const addBranchMutation = useAddBranch();
	const updateBranchMutation = useUpdateBranch();
	const deleteBranchMutation = useDeleteBranch();

	
	const handleAddBranch = useCallback(() => {
		setSelectedBranch(null);
		setIsEditDialogOpen(true);
	}, []); 

	const handleEditBranch = useCallback((branch: Branch) => {
		setSelectedBranch(branch);
		setIsEditDialogOpen(true);
	}, []); 

	const handleDeleteBranch = useCallback(
		(branchId: number) => {
			const branchToDelete = branches?.find(b => b.branch_id === branchId);
			if (branchToDelete) {
				setSelectedBranch(branchToDelete);
				setIsDeleteDialogOpen(true);
			}
		},
		[branches]
	); 

	const confirmDelete = useCallback(() => {
		if (selectedBranch) {
			deleteBranchMutation.mutate(selectedBranch.branch_id, {
				onSuccess: () => {
					
					console.log('Branch deleted');
					setIsDeleteDialogOpen(false);
					setSelectedBranch(null);
				},
				onError: () => {
					console.error('Delete failed:');
				}
			});
		}
	}, [selectedBranch, deleteBranchMutation]); 

	const handleFormSubmit = useCallback(
		(values: BranchFormData) => {
			if (selectedBranch) {
				
				updateBranchMutation.mutate(
					{ branchId: selectedBranch.branch_id, data: values },
					{
						onSuccess: () => {
							setIsEditDialogOpen(false);
							setSelectedBranch(null);
							
						},
						onError: () => {
							
						}
					}
				);
			} else {
				
				addBranchMutation.mutate(values, {
					onSuccess: () => {
						setIsEditDialogOpen(false);
						
					},
					onError: () => {
						
					}
				});
			}
		},
		[selectedBranch, updateBranchMutation, addBranchMutation]
	); 

	
	const columns = React.useMemo(
		() =>
			getBranchColumns({
				onEdit: handleEditBranch,
				onDelete: handleDeleteBranch
			}),
		[handleDeleteBranch, handleEditBranch]
	);

	const table = useReactTable({
		data: branches ?? [], 
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting
		}
	});

	
	if (isLoadingBranches) return <div>Loading branches...</div>;
	if (branchesError)
		return <div>Error loading branches: {branchesError.message}</div>;

	return (
		<div className='container mx-auto py-10'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold'>Manage Branches</h1>
				{/* --- Add Branch Dialog --- */}
				<Dialog
					open={isEditDialogOpen && !selectedBranch}
					onOpenChange={open => {
						if (!open) setIsEditDialogOpen(false);
					}}>
					<DialogTrigger asChild>
						<Button onClick={handleAddBranch}>
							<PlusCircle className='mr-2 h-4 w-4' /> Add New Branch
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Add New Branch</DialogTitle>
							<DialogDescription>
								Enter the name for the new branch.
							</DialogDescription>
						</DialogHeader>
						<BranchForm
							onSubmit={handleFormSubmit}
							isLoading={addBranchMutation.isPending}
							submitButtonText='Add Branch'
						/>
					</DialogContent>
				</Dialog>
			</div>

			{/* --- Branches Table --- */}
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map(headerGroup => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map(header => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext()
												  )}
										</TableHead>
									);
								})}
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
									No branches found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* --- Edit Branch Dialog --- */}
			<Dialog
				open={isEditDialogOpen && !!selectedBranch}
				onOpenChange={open => {
					if (!open) {
						setIsEditDialogOpen(false);
						setSelectedBranch(null);
					}
				}}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>Edit Branch</DialogTitle>
						<DialogDescription>
							Update the branch name. Click save when you&apos;re done.
						</DialogDescription>
					</DialogHeader>
					{selectedBranch && ( 
						<BranchForm
							onSubmit={handleFormSubmit}
							initialData={{ branch_name: selectedBranch.branch_name }}
							isLoading={updateBranchMutation.isPending}
							submitButtonText='Save Changes'
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* --- Delete Confirmation Dialog --- */}
			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							branch
							<span className='font-semibold'>
								&quot;{selectedBranch?.branch_name}&quot;
							</span>
							. Check if any students or criteria are linked to this branch
							before proceeding.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSelectedBranch(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={deleteBranchMutation.isPending}
							className='bg-red-600 hover:bg-red-700' 
						>
							{deleteBranchMutation.isPending
								? 'Deleting...'
								: 'Yes, delete branch'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
