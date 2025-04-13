'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area'; 
import { Branch, useGetBranches } from '@/hooks/api/branches'; 
import { CriteriaFormData, criteriaFormSchema } from '@/hooks/api/criteria';

interface CriteriaFormProps {
	onSubmit: (values: CriteriaFormData) => void;
	initialData?: Partial<CriteriaFormData> & { allowed_branches?: Branch[] }; 
	isLoading?: boolean;
	submitButtonText?: string;
}

export default function CriteriaForm({
	onSubmit,
	initialData,
	isLoading = false,
	submitButtonText = 'Save Criteria'
}: CriteriaFormProps) {
	
	const { data: availableBranches, isLoading: isLoadingBranches } =
		useGetBranches();

	const form = useForm<CriteriaFormData>({
		resolver: zodResolver(criteriaFormSchema),
		defaultValues: {
			description: initialData?.description ?? '',
			min_percentage: initialData?.min_percentage ?? null,
			active_status: initialData?.active_status ?? true,
			branch_ids: initialData?.allowed_branches?.map(b => b.branch_id) ?? []
		}
	});

	
	useEffect(() => {
		if (initialData) {
			form.reset({
				description: initialData.description ?? '',
				min_percentage: initialData.min_percentage ?? null,
				active_status: initialData.active_status ?? true,
				branch_ids: initialData.allowed_branches?.map(b => b.branch_id) ?? []
			});
		} else {
			
			form.reset({
				description: '',
				min_percentage: null,
				active_status: true,
				branch_ids: []
			});
		}
	}, [initialData, form]);

	const handleFormSubmit = (values: CriteriaFormData) => {
		onSubmit(values);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleFormSubmit)}
				className='space-y-6'>
				<FormField
					control={form.control}
					name='description'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description (Optional)</FormLabel>
							<FormControl>
								<Input
									placeholder='e.g., SDE Role - 2025 Batch'
									{...field}
									value={field.value ?? ''}
									disabled={isLoading}
								/>
							</FormControl>
							<FormDescription>
								A short description to identify this criteria set.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='min_percentage'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Minimum Percentage (Optional)</FormLabel>
							<FormControl>
								<Input
									type='number'
									step='0.01'
									min='0'
									max='100'
									placeholder='e.g., 75.50'
									{...field}
									value={field.value ?? ''}
									onChange={e => {
										const value = e.target.value;
										field.onChange(value === '' ? null : Number(value));
									}}
									disabled={isLoading}
								/>
							</FormControl>
							<FormDescription>
								Minimum overall percentage required (leave empty if none).
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='active_status'
					render={({ field }) => (
						<FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
							<div className='space-y-0.5'>
								<FormLabel className='text-base'>Active Status</FormLabel>
								<FormDescription>
									Inactive criteria cannot be used for new drives.
								</FormDescription>
							</div>
							<FormControl>
								<Switch
									checked={field.value}
									onCheckedChange={field.onChange}
									disabled={isLoading}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Branch Selection */}
				<FormField
					control={form.control}
					name='branch_ids'
					render={() => (
						<FormItem>
							<div className='mb-4'>
								<FormLabel className='text-base'>Allowed Branches</FormLabel>
								<FormDescription>
									Select the branches eligible under this criteria.
								</FormDescription>
							</div>
							{isLoadingBranches ? (
								<div>Loading branches...</div>
							) : !availableBranches || availableBranches.length === 0 ? (
								<div className='text-muted-foreground'>
									No branches available. Please add branches first.
								</div>
							) : (
								<ScrollArea className='h-40 w-full rounded-md border p-4'>
									{' '}
									{/* Adjust height as needed */}
									{availableBranches.map(branch => (
										<FormField
											key={branch.branch_id}
											control={form.control}
											name='branch_ids'
											render={({ field }) => {
												return (
													<FormItem
														key={branch.branch_id}
														className='flex flex-row items-start space-x-3 space-y-0 py-1'>
														<FormControl>
															<Checkbox
																checked={field.value?.includes(
																	branch.branch_id
																)}
																onCheckedChange={checked => {
																	const updatedIds = checked
																		? [...field.value, branch.branch_id]
																		: field.value?.filter(
																				id => id !== branch.branch_id
																		  );
																	field.onChange(updatedIds);
																}}
																disabled={isLoading}
															/>
														</FormControl>
														<FormLabel className='font-normal'>
															{branch.branch_name}
														</FormLabel>
													</FormItem>
												);
											}}
										/>
									))}
								</ScrollArea>
							)}
							<FormMessage /> {/* Show validation error for branch_ids */}
						</FormItem>
					)}
				/>

				<Button
					type='submit'
					disabled={
						isLoading ||
						isLoadingBranches ||
						!availableBranches ||
						availableBranches.length === 0
					}
					className='w-full'>
					{isLoading ? 'Saving...' : submitButtonText}
				</Button>
			</form>
		</Form>
	);
}
