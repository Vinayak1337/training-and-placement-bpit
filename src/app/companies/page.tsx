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
	Company,
	useGetCompanies,
	useAddCompany,
	useUpdateCompany,
	useDeleteCompany,
	CompanyFormData
} from '@/hooks/api/companies';
import CompanyForm from '@/components/forms/CompanyForm';
import { getCompanyColumns } from '@/components/tables/companies/columns';

export default function CompaniesPage() {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[]
	);
	const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
	const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(
		null
	);

	const {
		data: companies,
		isLoading: isLoadingCompanies,
		error: companiesError
	} = useGetCompanies();
	const addCompanyMutation = useAddCompany();
	const updateCompanyMutation = useUpdateCompany();
	const deleteCompanyMutation = useDeleteCompany();

	const handleAddCompany = useCallback(() => {
		setSelectedCompany(null);
		setIsEditDialogOpen(true);
	}, []);

	const handleEditCompany = useCallback((company: Company) => {
		setSelectedCompany(company);
		setIsEditDialogOpen(true);
	}, []);

	const handleDeleteCompany = useCallback(
		(companyId: number) => {
			const companyToDelete = companies?.find(c => c.company_id === companyId);
			if (companyToDelete) {
				setSelectedCompany(companyToDelete);
				setIsDeleteDialogOpen(true);
			}
		},
		[companies]
	);

	const confirmDelete = useCallback(() => {
		if (selectedCompany) {
			deleteCompanyMutation.mutate(selectedCompany.company_id, {
				onSuccess: () => {
					setIsDeleteDialogOpen(false);
					setSelectedCompany(null);
				},
				onError: error => {
					console.error('Delete failed:', error);
					alert(`Error deleting company: ${error.message}`);
				}
			});
		}
	}, [selectedCompany, deleteCompanyMutation]);

	const handleFormSubmit = useCallback(
		(values: CompanyFormData) => {
			const mutationOptions = {
				onSuccess: () => {
					setIsEditDialogOpen(false);
					setSelectedCompany(null);
				},
				onError: (error: Error) => {
					alert(`Error saving company: ${error.message}`);
				}
			};

			if (selectedCompany) {
				updateCompanyMutation.mutate(
					{ companyId: selectedCompany.company_id, data: values },
					mutationOptions
				);
			} else {
				addCompanyMutation.mutate(values, mutationOptions);
			}
		},
		[selectedCompany, updateCompanyMutation, addCompanyMutation]
	);

	const columns = React.useMemo(
		() =>
			getCompanyColumns({
				onEdit: handleEditCompany,
				onDelete: handleDeleteCompany
			}),
		[handleDeleteCompany, handleEditCompany]
	);

	const table = useReactTable({
		data: companies ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			sorting,
			columnFilters
		},
		initialState: {
			pagination: {
				pageSize: 10
			}
		}
	});

	if (isLoadingCompanies) return <div>Loading companies...</div>;
	if (companiesError)
		return <div>Error loading companies: {companiesError.message}</div>;

	return (
		<div className='container mx-auto py-10'>
			<div className='flex justify-between items-center mb-4'>
				<h1 className='text-2xl font-bold'>Manage Companies</h1>
				<Dialog
					open={isEditDialogOpen && !selectedCompany}
					onOpenChange={open => {
						if (!open) setIsEditDialogOpen(false);
					}}>
					<DialogTrigger asChild>
						<Button onClick={handleAddCompany}>
							<PlusCircle className='mr-2 h-4 w-4' /> Add New Company
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-md'>
						<DialogHeader>
							<DialogTitle>Add New Company</DialogTitle>
							<DialogDescription>
								Enter the details for the new company.
							</DialogDescription>
						</DialogHeader>
						<CompanyForm
							onSubmit={handleFormSubmit}
							isLoading={addCompanyMutation.isPending}
							submitButtonText='Add Company'
						/>
					</DialogContent>
				</Dialog>
			</div>

			<div className='flex items-center py-4'>
				<Input
					placeholder='Filter by company name...'
					value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
					onChange={event =>
						table.getColumn('name')?.setFilterValue(event.target.value)
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
									No companies found.
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
				open={isEditDialogOpen && !!selectedCompany}
				onOpenChange={open => {
					if (!open) {
						setIsEditDialogOpen(false);
						setSelectedCompany(null);
					}
				}}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Edit Company</DialogTitle>
						<DialogDescription>
							Update the company details. Click save when you&apos;re done.
						</DialogDescription>
					</DialogHeader>
					{selectedCompany && (
						<CompanyForm
							onSubmit={handleFormSubmit}
							initialData={selectedCompany}
							isLoading={updateCompanyMutation.isPending}
							submitButtonText='Save Changes'
						/>
					)}
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
							company
							<span className='font-semibold'>
								{' '}
								&quot;{selectedCompany?.name}&quot;
							</span>
							. Ensure no placement drives are currently associated with this
							company.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setSelectedCompany(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							disabled={deleteCompanyMutation.isPending}
							className='bg-red-600 hover:bg-red-700'>
							{deleteCompanyMutation.isPending
								? 'Deleting...'
								: 'Yes, delete company'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
