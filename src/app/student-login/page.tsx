'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CardFooter
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';


const formSchema = z.object({
	student_id: z.string().min(1, { message: 'Student ID is required.' }),
	password: z.string().min(1, { message: 'Password is required.' })
});

export default function StudentLoginPage() {
	const router = useRouter();
	const { loginStudent } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			student_id: '',
			password: ''
		}
	});

	
	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const result = await loginStudent(values.student_id, values.password);

			if (!result?.ok) {
				setErrorMessage(result?.error || 'Invalid credentials');
				return;
			}

			
			router.push('/student-dashboard');
		} catch (error) {
			console.error('Login error:', error);
			setErrorMessage('An unexpected error occurred. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950'>
			<Card className='w-full max-w-sm'>
				<CardHeader>
					<CardTitle className='text-2xl'>Student Login</CardTitle>
					<CardDescription>
						Enter your student ID to log in to your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
							<FormField
								control={form.control}
								name='student_id'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Student ID</FormLabel>
										<FormControl>
											<Input placeholder='Enter your student ID' {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='password'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input
												type='password'
												placeholder='********'
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{errorMessage && (
								<p className='text-sm font-medium text-destructive'>
									{errorMessage}
								</p>
							)}
							<Button type='submit' className='w-full' disabled={isLoading}>
								{isLoading ? 'Logging in...' : 'Login'}
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className='flex justify-center flex-col'>
					<p className='text-sm text-muted-foreground mb-2'>
						Are you a coordinator?{' '}
						<Link href='/login' className='text-primary hover:underline'>
							Login here
						</Link>
					</p>
					<p className='text-sm text-muted-foreground'>
						Need test accounts?{' '}
						<Link href='/setup' className='text-primary hover:underline'>
							Setup test accounts
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
