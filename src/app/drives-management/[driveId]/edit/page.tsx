'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
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
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover';
import { useGetDrive, useUpdateDrive, DriveFormData } from '@/hooks/api/drives';
import { useGetCompanies } from '@/hooks/api/companies';
import { useGetCriteria } from '@/hooks/api/criteria';


const driveFormSchema = z.object({
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

export default function EditDrivePage() {
	const router = useRouter();
	const params = useParams();
	const driveId = parseInt(params.driveId as string);

	const { data: drive, isLoading: driveLoading } = useGetDrive(driveId);
	const { data: companies, isLoading: companiesLoading } = useGetCompanies();
	const { data: criteria, isLoading: criteriaLoading } = useGetCriteria();
	const updateDrive = useUpdateDrive();

	
	const form = useForm<DriveFormData>({
		resolver: zodResolver(driveFormSchema),
		defaultValues: {
			company_id: 0,
			criteria_id: 0,
			job_title: '',
			package_lpa: '',
			grade_offered: '',
			drive_date: '',
			application_deadline: '',
			description: ''
		}
	});

	
	React.useEffect(() => {
		if (drive) {
			form.reset({
				company_id: drive.company_id,
				criteria_id: drive.criteria_id,
				job_title: drive.job_title,
				package_lpa: drive.package_lpa?.toString() ?? '',
				grade_offered: drive.grade_offered ?? '',
				drive_date: drive.drive_date ?? '',
				application_deadline: drive.application_deadline ?? '',
				description: drive.description ?? ''
			});
		}
	}, [drive, form]);

	
	function onSubmit(values: DriveFormData) {
		updateDrive.mutate(
			{ driveId, data: values },
			{
				onSuccess: () => {
					toast.success('Drive updated successfully');
					router.push('/drives-management');
				},
				onError: error => {
					toast.error(`Error updating drive: ${error.message}`);
				}
			}
		);
	}

	const isLoading =
		driveLoading ||
		companiesLoading ||
		criteriaLoading ||
		updateDrive.isPending;

	if (driveLoading) {
		return (
			<div className='flex justify-center items-center h-96'>
				<div className='text-center'>
					<p className='text-muted-foreground'>Loading drive data...</p>
				</div>
			</div>
		);
	}

	if (!drive) {
		return (
			<div className='container py-10'>
				<div className='text-center py-10'>
					<p className='text-muted-foreground'>Drive not found</p>
					<Button
						variant='outline'
						className='mt-4'
						onClick={() => router.push('/drives-management')}>
						Back to Drives
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='container py-10'>
			<div className='flex justify-between items-center mb-6'>
				<div>
					<h1 className='text-3xl font-bold mb-2'>Edit Drive</h1>
					<p className='text-muted-foreground'>
						Update the details for this placement drive
					</p>
				</div>
				<Button
					variant='outline'
					onClick={() => router.push('/drives-management')}>
					Cancel
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Drive Details</CardTitle>
					<CardDescription>
						Modify the information for this placement drive
					</CardDescription>
				</CardHeader>

				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<FormField
									control={form.control}
									name='company_id'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Company*</FormLabel>
											<Select
												value={field.value?.toString()}
												onValueChange={value =>
													field.onChange(parseInt(value, 10))
												}
												disabled={isLoading}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Select company' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{companies?.map(company => (
														<SelectItem
															key={company.company_id}
															value={company.company_id.toString()}>
															{company.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												Select the company offering this placement drive
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='criteria_id'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Eligibility Criteria*</FormLabel>
											<Select
												value={field.value?.toString()}
												onValueChange={value =>
													field.onChange(parseInt(value, 10))
												}
												disabled={isLoading}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Select criteria' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{criteria?.map(criteriaItem => (
														<SelectItem
															key={criteriaItem.criteria_id}
															value={criteriaItem.criteria_id.toString()}>
															{criteriaItem.description ||
																`Min ${criteriaItem.min_percentage}%, ${criteriaItem.allowed_branches.length} branch(es)`}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>
												Select the eligibility criteria for this drive
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name='job_title'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Job Title*</FormLabel>
										<FormControl>
											<Input
												placeholder='e.g. Software Engineer'
												{...field}
												disabled={isLoading}
											/>
										</FormControl>
										<FormDescription>
											Enter the job title being offered
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
								<FormField
									control={form.control}
									name='package_lpa'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Package (₹ LPA)</FormLabel>
											<FormControl>
												<Input
													placeholder='e.g. 5.5'
													{...field}
													value={field.value || ''}
													disabled={isLoading}
												/>
											</FormControl>
											<FormDescription>
												Enter the package in Lakhs Per Annum (e.g., 5.5)
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='grade_offered'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Grade/Level Offered</FormLabel>
											<FormControl>
												<Input
													placeholder='e.g. L3, Junior Dev'
													{...field}
													value={field.value || ''}
													disabled={isLoading}
												/>
											</FormControl>
											<FormDescription>
												Enter the grade or level offered (optional)
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
														selected={
															field.value ? new Date(field.value) : undefined
														}
														onSelect={date => {
															field.onChange(date ? date.toISOString() : '');
														}}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormDescription>
												When will the drive take place?
											</FormDescription>
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
														selected={
															field.value ? new Date(field.value) : undefined
														}
														onSelect={date => {
															field.onChange(date ? date.toISOString() : '');
														}}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormDescription>
												When is the deadline for applications?
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name='description'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder='Enter details about the job role, requirements, etc.'
												className='min-h-[120px]'
												{...field}
												value={field.value || ''}
												disabled={isLoading}
											/>
										</FormControl>
										<FormDescription>
											Add any additional information about the drive
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='flex justify-end space-x-4 pt-4'>
								<Button
									type='button'
									variant='outline'
									onClick={() => router.push('/drives-management')}
									disabled={isLoading}>
									Cancel
								</Button>
								<Button type='submit' disabled={isLoading}>
									{isLoading ? 'Saving...' : 'Save Changes'}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
