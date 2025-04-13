import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Company } from './companies';
import { Criteria } from './criteria';

export type Drive = {
	drive_id: number;
	company_id: number;
	criteria_id: number;
	job_title: string;
	package_lpa: number | null;
	grade_offered: string | null;
	drive_date: string | null;
	application_deadline: string | null;
	description: string | null;
	company: Company;
	criteria: Criteria;
};

export type DriveFormData = {
	company_id: number;
	criteria_id: number;
	job_title: string;
	package_lpa: string | null | '';
	grade_offered: string | null | '';
	drive_date: string | null | '';
	application_deadline: string | null | '';
	description: string | null | '';
};

type DriveApiData = Omit<DriveFormData, 'package_lpa'> & {
	package_lpa: number | null;
};

const DRIVES_QUERY_KEY = 'drives';
export { DRIVES_QUERY_KEY };

const processDriveFormData = (data: DriveFormData): DriveApiData => ({
	...data,
	package_lpa:
		data.package_lpa === '' || data.package_lpa === null
			? null
			: parseFloat(data.package_lpa),
	grade_offered: data.grade_offered === '' ? null : data.grade_offered,
	drive_date: data.drive_date === '' ? null : data.drive_date,
	application_deadline:
		data.application_deadline === '' ? null : data.application_deadline,
	description: data.description === '' ? null : data.description
});

export const useGetDrives = () => {
	return useQuery<Drive[]>({
		queryKey: [DRIVES_QUERY_KEY],
		queryFn: async () => {
			try {
				const response = await fetch('/api/drives');
				if (!response.ok) {
					return [];
				}

				try {
					const data = await response.json();
					if (!Array.isArray(data)) {
						return [];
					}
					return data;
				} catch (parseError) {
					console.debug('Failed to parse JSON:', parseError);
					return [];
				}
			} catch (error) {
				console.debug('Failed to fetch drives:', error);
				return [];
			}
		},
		retry: 1
	});
};

export const useGetDrive = (driveId: number | null) => {
	return useQuery<Drive>({
		queryKey: [DRIVES_QUERY_KEY, driveId],
		queryFn: async () => {
			if (!driveId) {
				return {} as Drive;
			}

			try {
				const response = await fetch(`/api/drives/${driveId}`);
				if (!response.ok) {
					return {} as Drive;
				}

				try {
					const data = await response.json();
					if (!data || typeof data !== 'object') {
						return {} as Drive;
					}
					return data;
				} catch (parseError) {
					console.debug('Failed to parse drive JSON:', parseError);
					return {} as Drive;
				}
			} catch (error) {
				console.debug('Failed to fetch drive:', error);
				return {} as Drive;
			}
		},
		enabled: !!driveId
	});
};

export const useGetEligibleDrives = (studentId: string | null) => {
	const queryClient = useQueryClient();

	return useQuery<Drive[]>({
		queryKey: [DRIVES_QUERY_KEY, 'eligible', studentId],
		queryFn: async () => {
			if (!studentId) {
				return [];
			}

			if (typeof studentId !== 'string' || !studentId.trim()) {
				return [];
			}

			try {
				// Only clear cache when explicitly requested, not on every fetch
				// queryClient.removeQueries({
				// 	queryKey: [DRIVES_QUERY_KEY, 'eligible', studentId]
				// });

				const response = await fetch(
					`/api/students/${studentId}/eligible-drives`,
					{
						method: 'GET',
						cache: 'no-store',
						headers: {
							'Cache-Control': 'no-cache, no-store, must-revalidate',
							Pragma: 'no-cache',
							Expires: '0'
						}
					}
				);

				if (!response.ok) {
					console.error('Failed to fetch eligible drives:', response.status);
					return [];
				}

				try {
					const data = await response.json();
					if (!Array.isArray(data)) {
						console.error('Expected array but got', typeof data);
						return [];
					}
					return data;
				} catch (parseError) {
					console.error('Failed to parse eligible drives JSON:', parseError);
					return [];
				}
			} catch (error) {
				console.error('Failed to fetch eligible drives:', error);
				return [];
			}
		},
		staleTime: 30000, // Consider data stale after 30 seconds
		gcTime: 300000, // Keep data in cache for 5 minutes
		// Remove continuous refetching that's causing UI issues
		// refetchInterval: 5000,
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		enabled:
			!!studentId && typeof studentId === 'string' && studentId.trim() !== '',
		retry: 1
	});
};

export const useAddDrive = () => {
	const queryClient = useQueryClient();

	return useMutation<Drive, Error, DriveFormData>({
		mutationFn: async newDriveData => {
			const processedData = processDriveFormData(newDriveData);
			const response = await fetch('/api/drives', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to add drive');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [DRIVES_QUERY_KEY] });
		},
		onError: error => {
			console.debug('Drive creation error:', error);
		}
	});
};

export const useUpdateDrive = () => {
	const queryClient = useQueryClient();

	return useMutation<Drive, Error, { driveId: number; data: DriveFormData }>({
		mutationFn: async ({ driveId, data }) => {
			const processedData = processDriveFormData(data);
			const response = await fetch(`/api/drives/${driveId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to update drive');
			}

			return response.json();
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: [DRIVES_QUERY_KEY] });
			queryClient.invalidateQueries({
				queryKey: [DRIVES_QUERY_KEY, variables.driveId]
			});
		},
		onError: error => {
			console.debug('Drive update error:', error);
		}
	});
};

export const useDeleteDrive = () => {
	const queryClient = useQueryClient();

	return useMutation<{ message: string }, Error, number>({
		mutationFn: async driveId => {
			const response = await fetch(`/api/drives/${driveId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to delete drive');
			}

			if (response.status === 204) {
				return { message: 'Drive deleted successfully' };
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [DRIVES_QUERY_KEY] });
		},
		onError: error => {
			console.debug('Drive deletion error:', error);
		}
	});
};
