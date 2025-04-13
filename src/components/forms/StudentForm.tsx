'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ResumeUpload } from '@/components/ui/resume-upload';
import { useGetBranches } from '@/hooks/api/branches';


interface Branch {
	branch_id: string;
	branch_name: string;
}


const percentageValidator = z
	.string()
	.refine(val => !val || (Number(val) >= 0 && Number(val) <= 100), {
		message: 'Must be a number between 0 and 100'
	})
	.optional()
	.nullable()
	.or(z.literal(''));


const createStudentSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255),
	department_branch_id: z.coerce
		.number()
		.int()
		.positive('Branch must be selected'),
	email: z.string().email('Invalid email address').max(255),
	student_id: z.string().min(1, 'Student ID is required'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	grade: z.string().max(5).optional().nullable().or(z.literal('')),
	percentage: percentageValidator,
	address: z.string().optional().nullable().or(z.literal('')),
	contact_no: z.string().max(20).optional().nullable().or(z.literal('')),
	resume_url: z
		.string()
		.url('Invalid URL')
		.max(512)
		.optional()
		.nullable()
		.or(z.literal(''))
});

export type CreateStudentValues = z.infer<typeof createStudentSchema>;


const updateStudentSchema = z.object({
	id: z.string(),
	name: z.string().min(1, 'Name is required').max(255),
	department_branch_id: z.coerce
		.number()
		.int()
		.positive('Branch must be selected'),
	email: z.string().email('Invalid email address').max(255),
	grade: z.string().max(5).optional().nullable().or(z.literal('')),
	percentage: percentageValidator,
	address: z.string().optional().nullable().or(z.literal('')),
	contact_no: z.string().max(20).optional().nullable().or(z.literal('')),
	resume_url: z
		.string()
		.url('Invalid URL')
		.max(512)
		.optional()
		.nullable()
		.or(z.literal(''))
});

export type UpdateStudentValues = z.infer<typeof updateStudentSchema>;


interface StudentFormProps {
	onSubmit: (values: CreateStudentValues | UpdateStudentValues) => void;
	initialData?: Partial<CreateStudentValues | UpdateStudentValues> & {
		branch?: Branch;
	};
	isLoading?: boolean;
	isEditMode: boolean;
}

export default function StudentForm({
	onSubmit,
	initialData,
	isLoading = false,
	isEditMode
}: StudentFormProps) {
	
	return isEditMode ? (
		<StudentUpdateForm
			onSubmit={onSubmit as (values: UpdateStudentValues) => void}
			initialData={
				initialData as Partial<UpdateStudentValues> & { branch?: Branch }
			}
			isLoading={isLoading}
		/>
	) : (
		<StudentCreateForm
			onSubmit={onSubmit as (values: CreateStudentValues) => void}
			initialData={
				initialData as Partial<CreateStudentValues> & { branch?: Branch }
			}
			isLoading={isLoading}
		/>
	);
}


interface StudentCreateFormProps {
	onSubmit: (values: CreateStudentValues) => void;
	initialData?: Partial<CreateStudentValues> & { branch?: Branch };
	isLoading?: boolean;
}

function StudentCreateForm({
	onSubmit,
	initialData,
	isLoading = false
}: StudentCreateFormProps) {
	const { data: branches, isLoading: isLoadingBranches } = useGetBranches();

	const form = useForm<CreateStudentValues>({
		resolver: zodResolver(createStudentSchema),
		defaultValues: {
			name: initialData?.name || '',
			department_branch_id: initialData?.department_branch_id || 0,
			email: initialData?.email || '',
			student_id: initialData?.student_id || '',
			password: '',
			grade: initialData?.grade || '',
			percentage: initialData?.percentage?.toString() || '',
			address: initialData?.address || '',
			contact_no: initialData?.contact_no || '',
			resume_url: initialData?.resume_url || ''
		},
		mode: 'onBlur'
	});

	const { control } = form;

	const handleResumeUploadSuccess = (url: string) => {
		form.setValue('resume_url', url);
	};

	const isFormDisabled = isLoading || isLoadingBranches;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<FormField
						control={control}
						name='student_id'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Student ID</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isFormDisabled}
										placeholder='Enter student ID'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isFormDisabled}
										placeholder='Enter name'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='department_branch_id'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Branch</FormLabel>
								<FormControl>
									<Select
										disabled={isFormDisabled}
										value={field.value?.toString() || ''}
										onValueChange={value => field.onChange(parseInt(value))}>
										<SelectTrigger>
											<SelectValue placeholder='Select branch' />
										</SelectTrigger>
										<SelectContent>
											{branches?.map(branch => (
												<SelectItem
													key={branch.branch_id}
													value={branch.branch_id.toString()}>
													{branch.branch_name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isFormDisabled}
										placeholder='Enter email'
										type='email'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='grade'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Grade</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value || ''}
										disabled={isFormDisabled}
										placeholder='Enter grade'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='percentage'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Percentage</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value || ''}
										disabled={isFormDisabled}
										placeholder='Enter percentage'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='contact_no'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contact No.</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value || ''}
										disabled={isFormDisabled}
										placeholder='Enter contact number'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='password'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										{...field}
										type='password'
										disabled={isFormDisabled}
										placeholder='Enter password'
									/>
								</FormControl>
								<FormDescription>
									Min 6 characters. Students can change this later.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className='md:col-span-2'>
						<FormField
							control={control}
							name='address'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Address</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											value={field.value || ''}
											disabled={isFormDisabled}
											placeholder='Enter address'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className='md:col-span-2'>
						<FormField
							control={control}
							name='resume_url'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Resume</FormLabel>
									<FormControl>
										<ResumeUpload
											initialUrl={field.value || ''}
											onUploadSuccess={handleResumeUploadSuccess}
											disabled={isFormDisabled}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<Button
					type='submit'
					disabled={isFormDisabled}
					className='w-full md:w-auto'>
					Create Student
				</Button>
			</form>
		</Form>
	);
}


interface StudentUpdateFormProps {
	onSubmit: (values: UpdateStudentValues) => void;
	initialData?: Partial<UpdateStudentValues> & { branch?: Branch };
	isLoading?: boolean;
}

function StudentUpdateForm({
	onSubmit,
	initialData,
	isLoading = false
}: StudentUpdateFormProps) {
	const { data: branches, isLoading: isLoadingBranches } = useGetBranches();

	const form = useForm<UpdateStudentValues>({
		resolver: zodResolver(updateStudentSchema),
		defaultValues: {
			id: initialData?.id || '',
			name: initialData?.name || '',
			department_branch_id: initialData?.department_branch_id || 0,
			email: initialData?.email || '',
			grade: initialData?.grade || '',
			percentage: initialData?.percentage?.toString() || '',
			address: initialData?.address || '',
			contact_no: initialData?.contact_no || '',
			resume_url: initialData?.resume_url || ''
		},
		mode: 'onBlur'
	});

	const { control } = form;

	const handleResumeUploadSuccess = (url: string) => {
		form.setValue('resume_url', url);
	};

	const isFormDisabled = isLoading || isLoadingBranches;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<FormField
						control={control}
						name='name'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isFormDisabled}
										placeholder='Enter name'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='department_branch_id'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Branch</FormLabel>
								<FormControl>
									<Select
										disabled={isFormDisabled}
										value={field.value?.toString() || ''}
										onValueChange={value => field.onChange(parseInt(value))}>
										<SelectTrigger>
											<SelectValue placeholder='Select branch' />
										</SelectTrigger>
										<SelectContent>
											{branches?.map(branch => (
												<SelectItem
													key={branch.branch_id}
													value={branch.branch_id.toString()}>
													{branch.branch_name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='email'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										{...field}
										disabled={isFormDisabled}
										placeholder='Enter email'
										type='email'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='grade'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Grade</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value || ''}
										disabled={isFormDisabled}
										placeholder='Enter grade'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='percentage'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Percentage</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value || ''}
										disabled={isFormDisabled}
										placeholder='Enter percentage'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name='contact_no'
						render={({ field }) => (
							<FormItem>
								<FormLabel>Contact No.</FormLabel>
								<FormControl>
									<Input
										{...field}
										value={field.value || ''}
										disabled={isFormDisabled}
										placeholder='Enter contact number'
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className='md:col-span-2'>
						<FormField
							control={control}
							name='address'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Address</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											value={field.value || ''}
											disabled={isFormDisabled}
											placeholder='Enter address'
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className='md:col-span-2'>
						<FormField
							control={control}
							name='resume_url'
							render={({ field }) => (
								<FormItem>
									<FormLabel>Resume</FormLabel>
									<FormControl>
										<ResumeUpload
											initialUrl={field.value || ''}
											onUploadSuccess={handleResumeUploadSuccess}
											disabled={isFormDisabled}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</div>

				<Button
					type='submit'
					disabled={isFormDisabled}
					className='w-full md:w-auto'>
					Update Student
				</Button>
			</form>
		</Form>
	);
}
