'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { CheckCircle2, KeyRound, RefreshCcw, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DEMO_COORDINATOR, DEMO_STUDENT } from '@/lib/demo-accounts';

type SetupStatus = {
	coordinatorReady: boolean;
	studentReady: boolean;
};

export default function SetupPage() {
	const [status, setStatus] = React.useState<SetupStatus | null>(null);
	const [isLoading, setIsLoading] = React.useState(true);
	const [isSaving, setIsSaving] = React.useState(false);

	const loadStatus = React.useCallback(async () => {
		try {
			const response = await fetch('/api/demo/setup', { cache: 'no-store' });
			if (!response.ok) throw new Error('Failed to load status');
			setStatus(await response.json());
		} catch {
			setStatus(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadStatus();
	}, [loadStatus]);

	const setupDemoAccounts = async () => {
		setIsSaving(true);
		try {
			const response = await fetch('/api/demo/setup', { method: 'POST' });
			const data = await response.json().catch(() => ({}));

			if (!response.ok) {
				throw new Error(data.message || 'Failed to set up demo accounts');
			}

			toast.success('Demo accounts are ready');
			await loadStatus();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to set up demo accounts'
			);
		} finally {
			setIsSaving(false);
		}
	};

	const ready = status?.coordinatorReady && status?.studentReady;

	return (
		<div className='flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-950'>
			<div className='w-full max-w-5xl space-y-6'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
					<div>
						<h1 className='text-3xl font-bold'>Demo Account Setup</h1>
						<p className='mt-2 text-muted-foreground'>
							Reset the demo login accounts used by this dashboard.
						</p>
					</div>
					<Badge variant={ready ? 'default' : 'outline'} className='w-fit'>
						{isLoading ? 'Checking...' : ready ? 'Ready' : 'Setup needed'}
					</Badge>
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<KeyRound className='h-5 w-5' />
								Coordinator
							</CardTitle>
							<CardDescription>Admin dashboard demo login</CardDescription>
						</CardHeader>
						<CardContent className='space-y-3 text-sm'>
							<div className='rounded-md border bg-muted/40 p-3'>
								<p>
									<span className='font-medium'>Email:</span>{' '}
									{DEMO_COORDINATOR.email}
								</p>
								<p>
									<span className='font-medium'>Password:</span>{' '}
									{DEMO_COORDINATOR.password}
								</p>
							</div>
							{status?.coordinatorReady && (
								<p className='flex items-center gap-2 text-sm text-green-700 dark:text-green-400'>
									<CheckCircle2 className='h-4 w-4' />
									Coordinator account exists
								</p>
							)}
						</CardContent>
						<CardFooter>
							<Button asChild variant='outline' className='w-full'>
								<Link href='/login'>Coordinator Login</Link>
							</Button>
						</CardFooter>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<UserRound className='h-5 w-5' />
								Student
							</CardTitle>
							<CardDescription>Student portal demo login</CardDescription>
						</CardHeader>
						<CardContent className='space-y-3 text-sm'>
							<div className='rounded-md border bg-muted/40 p-3'>
								<p>
									<span className='font-medium'>Student ID:</span>{' '}
									{DEMO_STUDENT.student_id}
								</p>
								<p>
									<span className='font-medium'>Password:</span>{' '}
									{DEMO_STUDENT.password}
								</p>
							</div>
							{status?.studentReady && (
								<p className='flex items-center gap-2 text-sm text-green-700 dark:text-green-400'>
									<CheckCircle2 className='h-4 w-4' />
									Student account exists
								</p>
							)}
						</CardContent>
						<CardFooter>
							<Button asChild variant='outline' className='w-full'>
								<Link href='/student-login'>Student Login</Link>
							</Button>
						</CardFooter>
					</Card>
				</div>

				<Card>
					<CardContent className='flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<p className='font-medium'>Create or reset demo accounts</p>
							<p className='text-sm text-muted-foreground'>
								This restores the fixed demo credentials shown above.
							</p>
						</div>
						<Button onClick={setupDemoAccounts} disabled={isSaving}>
							<RefreshCcw className='mr-2 h-4 w-4' />
							{isSaving ? 'Setting up...' : 'Setup Demo Accounts'}
						</Button>
					</CardContent>
				</Card>

				<Separator />

				<div className='flex justify-center gap-4'>
					<Button asChild variant='ghost'>
						<Link href='/login'>Coordinator Login</Link>
					</Button>
					<Button asChild variant='ghost'>
						<Link href='/student-login'>Student Login</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
