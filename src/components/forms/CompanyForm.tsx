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
import { Textarea } from '@/components/ui/textarea';
import { CompanyFormData } from '@/hooks/api/companies';

const companyFormSchema = z.object({
	name: z.string().min(1, 'Company name is required').max(255),
	description: z.string().max(1000).optional().nullable(),
	website_url: z
		.string()
		.url({ message: 'Invalid URL' })
		.max(255)
		.optional()
		.nullable()
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
	onSubmit: (values: CompanyFormData) => void;
	initialData?: Partial<CompanyFormData>;
	isLoading?: boolean;
	submitButtonText?: string;
}

export default function CompanyForm({
	onSubmit,
	initialData,
	isLoading = false,
	submitButtonText = 'Save Company'
}: CompanyFormProps) {
	const form = useForm<CompanyFormValues>({
		resolver: zodResolver(companyFormSchema),
		defaultValues: {
			name: initialData?.name ?? '',
			description: initialData?.description ?? null,
			website_url: initialData?.website_url ?? null
		}
	});

	useEffect(() => {
		if (initialData) {
			form.reset({
				name: initialData.name ?? '',
				description: initialData.description ?? null,
				website_url: initialData.website_url ?? null
			});
		} else {
			form.reset({
				name: '',
				description: null,
				website_url: null
			});
		}
	}, [initialData, form]);

	const handleFormSubmit = (values: CompanyFormValues) => {
		onSubmit(values);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleFormSubmit)}
				className='space-y-4'>
				<FormField
					control={form.control}
					name='name'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Company Name</FormLabel>
							<FormControl>
								<Input
									placeholder='e.g., Acme Corp'
									{...field}
									disabled={isLoading}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='website_url'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Website URL</FormLabel>
							<FormControl>
								<Input
									placeholder='https://example.com'
									{...field}
									value={field.value ?? ''}
									disabled={isLoading}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='description'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									placeholder='Company Description'
									{...field}
									value={field.value ?? ''}
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
