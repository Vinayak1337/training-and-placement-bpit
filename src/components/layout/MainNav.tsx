'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
	LayoutDashboard,
	HardDriveIcon,
	Building2,
	GraduationCap,
	GitBranchIcon,
	BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
	title: string;
	href: string;
	icon: React.ReactNode;
}

export default function MainNav() {
	const pathname = usePathname();
	const { hasRole } = useAuth();

	
	const coordinatorNavItems: NavItem[] = [
		{
			title: 'Dashboard',
			href: '/dashboard',
			icon: <LayoutDashboard className='mr-2 h-4 w-4' />
		},
		{
			title: 'Admin Dashboard',
			href: '/admin-dashboard',
			icon: <LayoutDashboard className='mr-2 h-4 w-4' />
		},
		{
			title: 'Drives',
			href: '/drives',
			icon: <HardDriveIcon className='mr-2 h-4 w-4' />
		},
		{
			title: 'Companies',
			href: '/companies',
			icon: <Building2 className='mr-2 h-4 w-4' />
		},
		{
			title: 'Students',
			href: '/students',
			icon: <GraduationCap className='mr-2 h-4 w-4' />
		},
		{
			title: 'Branches',
			href: '/branches',
			icon: <GitBranchIcon className='mr-2 h-4 w-4' />
		}
	];

	
	const studentNavItems: NavItem[] = [
		{
			title: 'Student Dashboard',
			href: '/student-dashboard',
			icon: <LayoutDashboard className='mr-2 h-4 w-4' />
		},
		{
			title: 'My Applications',
			href: '/student-dashboard?tab=applications',
			icon: <BookOpen className='mr-2 h-4 w-4' />
		}
	];

	
	const navItems = hasRole('coordinator')
		? coordinatorNavItems
		: studentNavItems;

	if (!navItems.length) {
		return null;
	}

	return (
		<nav className='grid items-start gap-2 px-2 text-sm font-medium'>
			{navItems.map((item, index) => (
				<Link
					key={index}
					href={item.href}
					className={cn(
						buttonVariants({ variant: 'ghost' }),
						pathname === item.href
							? 'bg-muted hover:bg-muted'
							: 'hover:bg-transparent hover:underline',
						'justify-start'
					)}>
					{item.icon}
					{item.title}
				</Link>
			))}
		</nav>
	);
}
