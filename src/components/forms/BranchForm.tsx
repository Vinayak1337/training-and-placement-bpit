'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BranchFormData } from '@/hooks/api/branches'; 


const branchFormSchema = z.object({
	branch_name: z.string().min(1, 'Branch name is required').max(100)
});

interface BranchFormProps {
	onSubmit: (values: BranchFormData) => void;
	initialData?: Partial<BranchFormData>; 
	isLoading?: boolean;
	submitButtonText?: string;
}

export default function BranchForm({
	onSubmit,
	initialData,
	isLoading = false,
	submitButtonText = 'Save Branch'
}: BranchFormProps) {
	const form = useForm<BranchFormData>({
		resolver: zodResolver(branchFormSchema),
		defaultValues: initialData || { branch_name: '' } 
	});

	
	useEffect(() => {
		if (initialData) {
			form.reset(initialData);
		} else {
			form.reset({ branch_name: '' }); 
		}
	}, [initialData, form]); 

	const handleFormSubmit = (values: BranchFormData) => {
		onSubmit(values);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleFormSubmit)}
				className='space-y-8'>
				<FormField
					control={form.control}
					name='branch_name'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Branch Name</FormLabel>
							<FormControl>
								<Input
									placeholder='e.g., Computer Science'
									{...field}
									disabled={isLoading}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type='submit' disabled={isLoading} className='w-full'>
					{isLoading ? 'Saving...' : submitButtonText}
				</Button>
			</form>
		</Form>
	);
}
