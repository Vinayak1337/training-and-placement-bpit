import React from 'react';
import Link from 'next/link';
import { Home, Briefcase } from 'lucide-react';

export default function StudentSidebar() {
	return (
		<aside className='fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex'>
			<div className='py-4 px-2 text-xl font-bold text-center'>
				Student Portal
			</div>
			<nav className='flex flex-col gap-2 px-2 py-2'>
				<Link
					href='/profile'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent'>
					<Home className='h-5 w-5' />
					<span className='ml-3'>Dashboard</span>
				</Link>
				<Link
					href='/drives'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent'>
					<Briefcase className='h-5 w-5' />
					<span className='ml-3'>Placement Drives</span>
				</Link>
			</nav>
		</aside>
	);
}
