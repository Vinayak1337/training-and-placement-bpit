import { useQuery } from '@tanstack/react-query';
import {
	fetchStudents,
	fetchDrives,
	fetchPlacements,
	fetchBranches,
	fetchCompanies
} from '@/services/api';
import { Student, Drive, Placement, Branch, Company } from '@/types';

export function useStudents() {
	return useQuery<Student[]>({
		queryKey: ['students'],
		queryFn: fetchStudents
	});
}

export function useDrives() {
	return useQuery<Drive[]>({
		queryKey: ['drives'],
		queryFn: fetchDrives
	});
}

export function usePlacements() {
	return useQuery<Placement[]>({
		queryKey: ['placements'],
		queryFn: fetchPlacements
	});
}

export function useBranches() {
	return useQuery<Branch[]>({
		queryKey: ['branches'],
		queryFn: fetchBranches
	});
}

export function useCompanies() {
	return useQuery<Company[]>({
		queryKey: ['companies'],
		queryFn: fetchCompanies
	});
}
