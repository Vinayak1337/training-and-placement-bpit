import { Student, Drive, Placement, Branch, Company } from '@/types';

async function apiRequest<T>(
	endpoint: string,
	options?: RequestInit
): Promise<T> {
	const response = await fetch(`/api${endpoint}`, {
		headers: {
			'Content-Type': 'application/json'
		},
		...options
	});

	if (!response.ok) {
		throw new Error(`API request failed: ${response.statusText}`);
	}

	return response.json();
}

export async function fetchStudents(): Promise<Student[]> {
	return apiRequest<Student[]>('/students');
}

export const fetchAllStudents = fetchStudents;

export async function fetchStudentById(id: string): Promise<Student> {
	return apiRequest<Student>(`/students/${id}`);
}

export async function fetchDrives(): Promise<Drive[]> {
	return apiRequest<Drive[]>('/drives');
}

export const fetchAllDrives = fetchDrives;

export async function fetchDriveById(id: string): Promise<Drive> {
	return apiRequest<Drive>(`/drives/${id}`);
}

export async function fetchPlacements(): Promise<Placement[]> {
	return apiRequest<Placement[]>('/placements', {
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate',
			Pragma: 'no-cache',
			Expires: '0'
		}
	});
}

export const fetchAllPlacements = fetchPlacements;

export async function fetchPlacementById(id: string): Promise<Placement> {
	return apiRequest<Placement>(`/placements/${id}`);
}

export async function fetchBranches(): Promise<Branch[]> {
	return apiRequest<Branch[]>('/branches');
}

export const fetchAllBranches = fetchBranches;

export async function fetchBranchById(id: string): Promise<Branch> {
	return apiRequest<Branch>(`/branches/${id}`);
}

export async function fetchCompanies(): Promise<Company[]> {
	return apiRequest<Company[]>('/companies');
}

export async function fetchCompanyById(id: string): Promise<Company> {
	return apiRequest<Company>(`/companies/${id}`);
}
