'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';
import { Company, useGetCompanies } from '@/hooks/api/companies';
import { Criteria, useGetCriteria } from '@/hooks/api/criteria';
import { DriveFormData } from '@/hooks/api/drives';
import { cn } from '@/lib/utils';

const driveSchema = z.object({
	company_id: z.coerce.number().int().positive('Company is required'),
	criteria_id: z.coerce.number().int().positive('Criteria is required'),
	job_title: z.string().min(1, 'Job title is required').max(255),
	package_lpa: z
		.string()
		.refine(
			val => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
			{
				message: 'Must be a number or empty'
			}
		)
		.nullable()
		.or(z.literal('')),
	grade_offered: z.string().max(50).nullable().or(z.literal('')),
	drive_date: z.string().nullable().or(z.literal('')),
	application_deadline: z.string().nullable().or(z.literal('')),
	description: z.string().nullable().or(z.literal(''))
});

interface DriveFormProps {
	onSubmit: (values: DriveFormData) => void;
	initialData?: Partial<
		DriveFormData & { company?: Company; criteria?: Criteria }
	>;
	isLoading?: boolean;
	submitButtonText?: string;
}

export default function DriveForm({
	onSubmit,
	initialData,
	isLoading = false,
	submitButtonText = 'Save Drive'
}: DriveFormProps) {
	const { data: companies, isLoading: isLoadingCompanies } = useGetCompanies();
	const { data: criteria, isLoading: isLoadingCriteria } = useGetCriteria();

	const form = useForm<DriveFormData>({
		resolver: zodResolver(driveSchema),
		defaultValues: initialData
			? {
					...initialData,
					company_id: initialData.company_id,
					criteria_id: initialData.criteria_id,
					package_lpa: initialData.package_lpa?.toString() ?? '',
					grade_offered: initialData.grade_offered ?? '',
					drive_date: initialData.drive_date
						? new Date(initialData.drive_date).toISOString().split('T')[0]
						: '',
					application_deadline: initialData.application_deadline
						? new Date(initialData.application_deadline)
								.toISOString()
								.split('T')[0]
						: '',
					description: initialData.description ?? ''
			  }
			: {
					company_id: null as unknown as number,
					criteria_id: null as unknown as number,
					job_title: '',
					package_lpa: '',
					grade_offered: '',
					drive_date: '',
					application_deadline: '',
					description: ''
			  }
	});

	useEffect(() => {
		if (initialData) {
			form.reset({
				company_id: initialData.company_id,
				criteria_id: initialData.criteria_id,
				job_title: initialData.job_title ?? '',
				package_lpa: initialData.package_lpa ?? null,
				grade_offered: initialData.grade_offered ?? '',
				drive_date: initialData.drive_date
					? new Date(initialData.drive_date).toISOString()
					: '',
				application_deadline: initialData.application_deadline
					? new Date(initialData.application_deadline)
							.toISOString()
							.split('T')[0]
					: '',
				description: initialData.description ?? ''
			});
		}
	}, [initialData, form]);

	const handleFormSubmit = (values: DriveFormData) => {
		onSubmit(values);
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleFormSubmit)}
				className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
				{/* Column 1 */}
				<div className='space-y-4'>
					<FormField
						control={form.control}
						name='company_id'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Company</FormLabel>
								<Select
									onValueChange={value => field.onChange(parseInt(value, 10))}
									value={field.value?.toString()}
									disabled={isLoading || isLoadingCompanies}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder='Select a company' />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{isLoadingCompanies ? (
											<SelectItem value='loading' disabled>
												Loading companies...
											</SelectItem>
										) : (
											companies?.map(company => (
												<SelectItem
													key={company.company_id}
													value={company.company_id.toString()}>
													{company.name}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='criteria_id'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Criteria</FormLabel>
								<Select
									onValueChange={value => field.onChange(parseInt(value, 10))}
									value={field.value?.toString()}
									disabled={isLoading || isLoadingCriteria}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder='Select criteria' />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{isLoadingCriteria ? (
											<SelectItem value='loading' disabled>
												Loading criteria...
											</SelectItem>
										) : (
											criteria?.map(criterion => (
												<SelectItem
													key={criterion.criteria_id}
													value={criterion.criteria_id.toString()}>
													{criterion.description ||
														`Criteria ${criterion.criteria_id}`}
												</SelectItem>
											))
										)}
									</SelectContent>
								</Select>
								<FormDescription>
									Eligibility criteria including minimum percentage and allowed
									branches
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='job_title'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Job Title</FormLabel>
								<FormControl>
									<Input
										placeholder='Software Engineer'
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
						name='package_lpa'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Package (LPA)</FormLabel>
								<FormControl>
									<Input
										type='number'
										step='0.01'
										min='0'
										placeholder='e.g., 10.5'
										{...field}
										value={field.value ?? ''}
										disabled={isLoading}
									/>
								</FormControl>
								<FormDescription>
									Annual package in Lakhs Per Annum
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Column 2 */}
				<div className='space-y-4'>
					<FormField
						control={form.control}
						name='grade_offered'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Grade/Level Offered</FormLabel>
								<FormControl>
									<Input
										placeholder='e.g., A, Level 3'
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
						name='drive_date'
						render={({ field }) => (
							<FormItem className='flex flex-col'>
								<FormLabel>Drive Date</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={'outline'}
												className={cn(
													'w-full pl-3 text-left font-normal',
													!field.value && 'text-muted-foreground'
												)}
												disabled={isLoading}>
												{field.value ? (
													format(new Date(field.value), 'PPP')
												) : (
													<span>Pick a date</span>
												)}
												<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className='w-auto p-0' align='start'>
										<Calendar
											mode='single'
											selected={field.value ? new Date(field.value) : undefined}
											onSelect={date => {
												field.onChange(date ? date.toISOString() : '');
											}}
											initialFocus
											className='rounded-md border'
										/>
									</PopoverContent>
								</Popover>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name='application_deadline'
						render={({ field }) => (
							<FormItem className='flex flex-col'>
								<FormLabel>Application Deadline</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={'outline'}
												className={cn(
													'w-full pl-3 text-left font-normal',
													!field.value && 'text-muted-foreground'
												)}
												disabled={isLoading}>
												{field.value ? (
													format(new Date(field.value), 'PPP')
												) : (
													<span>Pick a date</span>
												)}
												<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
											</Button>
										</FormControl>
									</PopoverTrigger>
									<PopoverContent className='w-auto p-0' align='start'>
										<Calendar
											mode='single'
											selected={field.value ? new Date(field.value) : undefined}
											onSelect={date => {
												field.onChange(date ? date.toISOString() : '');
											}}
											initialFocus
											className='rounded-md border'
										/>
									</PopoverContent>
								</Popover>
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
										placeholder='Job description and requirements'
										{...field}
										value={field.value ?? ''}
										disabled={isLoading}
										rows={4}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Submit Button spans both columns */}
				<div className='sm:col-span-2'>
					<Button
						type='submit'
						disabled={isLoading || isLoadingCompanies || isLoadingCriteria}
						className='w-full'>
						{isLoading ? 'Saving...' : submitButtonText}
					</Button>
				</div>
			</form>
		</Form>
	);
}
