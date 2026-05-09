'use client';

import React from 'react';
import Link from 'next/link';
import { Briefcase, Building2, GitBranch, GraduationCap, Home, ListFilter, LogOut, Menu, User, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
	const { user, isAuthenticated, logout } = useAuth();
	const navItems =
		user?.role === 'student'
			? [
					{ href: '/profile', label: 'Dashboard', icon: Home },
					{ href: '/drives', label: 'Placement Drives', icon: Briefcase }
				]
			: [
					{ href: '/dashboard', label: 'Dashboard', icon: Home },
					{ href: '/students', label: 'Students', icon: Users2 },
					{ href: '/companies', label: 'Companies', icon: Building2 },
					{ href: '/branches', label: 'Branches', icon: GitBranch },
					{ href: '/criteria', label: 'Criteria', icon: ListFilter },
					{
						href: '/drives-management',
						label: 'Drives Management',
						icon: Briefcase
					},
					{ href: '/placements', label: 'Placements', icon: GraduationCap }
				];

	return (
		<header className='sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6'>
			{isAuthenticated && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='outline' size='icon' className='sm:hidden'>
							<Menu className='h-4 w-4' />
							<span className='sr-only'>Open navigation</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='start' className='w-56'>
						{navItems.map(item => {
							const Icon = item.icon;
							return (
								<DropdownMenuItem key={item.href} asChild>
									<Link href={item.href}>
										<Icon className='h-4 w-4' />
										{item.label}
									</Link>
								</DropdownMenuItem>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
			<div className='flex-1 font-semibold'>T&P Dashboard</div>

			{isAuthenticated && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant='outline' size='sm' className='gap-2'>
							<User className='h-4 w-4' />
							{user?.email || 'User'}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align='end'>
						<DropdownMenuLabel>
							{user?.role === 'coordinator' ? 'Coordinator' : 'Student'}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className='text-destructive cursor-pointer'
							onClick={logout}>
							<LogOut className='mr-2 h-4 w-4' />
							<span>Logout</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</header>
	);
}
