import React from 'react';
import Link from 'next/link';
import {
	Home,
	Package,
	Settings,
	Users2,
	Building2,
	ListFilter,
	Briefcase
} from 'lucide-react';

export default function Sidebar() {
	return (
		<aside className='fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex'>
			<nav className='flex flex-col gap-2 px-2 sm:py-5'>
				<Link
					href='/dashboard'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground'>
					<Home className='h-5 w-5' />
					<span className='ml-3'>Dashboard</span>
				</Link>
				<Link
					href='/students'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground'>
					<Users2 className='h-5 w-5' />
					<span className='ml-3'>Students</span>
				</Link>
				<Link
					href='/companies'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground'>
					<Package className='h-5 w-5' />
					<span className='ml-3'>Companies</span>
				</Link>
				<Link
					href='/branches'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground'>
					<Building2 className='h-5 w-5' />
					<span className='ml-3'>Branches</span>
				</Link>
				<Link
					href='/criteria'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground'>
					<ListFilter className='h-5 w-5' />
					<span className='ml-3'>Criteria</span>
				</Link>
				<Link
					href='/drives-management'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground'>
					<Briefcase className='h-5 w-5' />
					<span className='ml-3'>Drives Management</span>
				</Link>
				<Link
					href='/placements'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground'>
					<Briefcase className='h-5 w-5' />
					<span className='ml-3'>Placements</span>
				</Link>
			</nav>
			<nav className='mt-auto flex flex-col gap-2 px-2 sm:py-5'>
				<Link
					href='/settings'
					className='group flex h-9 items-center rounded-lg px-3 text-muted-foreground transition-colors hover:text-foreground'>
					<Settings className='h-5 w-5' />
					<span className='ml-3'>Settings</span>
				</Link>
			</nav>
		</aside>
	);
}
