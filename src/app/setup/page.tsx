'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface SetupResponse {
	success: boolean;
	message: string;
}

export default function SetupPage() {
	const [isCreatingCoordinator, setIsCreatingCoordinator] = useState(false);
	const [isCreatingStudent, setIsCreatingStudent] = useState(false);
	const [coordinatorResult, setCoordinatorResult] =
		useState<SetupResponse | null>(null);
	const [studentResult, setStudentResult] = useState<SetupResponse | null>(
		null
	);

	const createCoordinatorAccount = async () => {
		setIsCreatingCoordinator(true);
		try {
			const response = await fetch('/api/coordinators/seed', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();
			setCoordinatorResult(data);

			if (response.ok) {
				toast.success('Coordinator account created successfully!');
			} else {
				toast.error('Failed to create coordinator account');
			}
		} catch (error) {
			console.error('Error creating coordinator account:', error);
			toast.error('An error occurred while creating the coordinator account');
		} finally {
			setIsCreatingCoordinator(false);
		}
	};

	const createStudentAccount = async () => {
		setIsCreatingStudent(true);
		try {
			const response = await fetch('/api/students/seed', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();
			setStudentResult(data);

			if (response.ok) {
				toast.success('Student account created successfully!');
			} else {
				toast.error('Failed to create student account');
			}
		} catch (error) {
			console.error('Error creating student account:', error);
			toast.error('An error occurred while creating the student account');
		} finally {
			setIsCreatingStudent(false);
		}
	};

	return (
		<div className='flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-950'>
			<h1 className='text-3xl font-bold mb-8'>Setup Test Accounts</h1>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl'>
				<Card>
					<CardHeader>
						<CardTitle>Coordinator Account</CardTitle>
						<CardDescription>Create a test coordinator account</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='mb-4'>
							This will create a coordinator account with the following
							credentials:
						</p>
						<div className='bg-gray-100 dark:bg-gray-800 p-3 rounded-md'>
							<p>
								<strong>Email:</strong> t&p@bpit.edu.in
							</p>
							<p>
								<strong>Password:</strong> t&p@2027
							</p>
						</div>
					</CardContent>
					<CardFooter className='flex flex-col items-stretch gap-4'>
						<Button
							onClick={createCoordinatorAccount}
							disabled={isCreatingCoordinator}
							className='w-full'>
							{isCreatingCoordinator
								? 'Creating...'
								: 'Create Coordinator Account'}
						</Button>

						{coordinatorResult && (
							<div className='text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded-md'>
								<p>{coordinatorResult.message}</p>
							</div>
						)}
					</CardFooter>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Student Account</CardTitle>
						<CardDescription>Create a test student account</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='mb-4'>
							This will create a student account with the following credentials:
						</p>
						<div className='bg-gray-100 dark:bg-gray-800 p-3 rounded-md'>
							<p>
								<strong>Student ID:</strong> TEST001
							</p>
							<p>
								<strong>Password:</strong> password123
							</p>
						</div>
					</CardContent>
					<CardFooter className='flex flex-col items-stretch gap-4'>
						<Button
							onClick={createStudentAccount}
							disabled={isCreatingStudent}
							className='w-full'>
							{isCreatingStudent ? 'Creating...' : 'Create Student Account'}
						</Button>

						{studentResult && (
							<div className='text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded-md'>
								<p>{studentResult.message}</p>
							</div>
						)}
					</CardFooter>
				</Card>
			</div>

			<div className='mt-8 flex gap-4'>
				<Button asChild variant='outline'>
					<Link href='/login'>Coordinator Login</Link>
				</Button>
				<Button asChild variant='outline'>
					<Link href='/student-login'>Student Login</Link>
				</Button>
			</div>
		</div>
	);
}
