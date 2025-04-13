import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Student } from './students';
import { Drive } from './drives';

export enum PlacementStatus {
	Applied = 'Applied',
	Shortlisted = 'Shortlisted',
	Interview_Scheduled = 'Interview_Scheduled',
	Offered = 'Offered',
	Offer_Accepted = 'Offer_Accepted',
	Offer_Rejected = 'Offer_Rejected',
	Not_Placed = 'Not_Placed'
}

export type Placement = {
	placement_id: number;
	student_id: string;
	drive_id: number;
	application_date: string;
	status: PlacementStatus;
	placement_date: string | null;
	package_lpa_confirmed: number | null;
	student: Student;
	drive: Drive;
};

export type PlacementCreateFormData = {
	student_id: string;
	drive_id: number;
	status: PlacementStatus;
	placement_date: string | null | '';
	package_lpa_confirmed: string | null | '';
};

export type PlacementUpdateFormData = {
	status: PlacementStatus;
	placement_date: string | null | '';
	package_lpa_confirmed: string | null | '';
};

type PlacementApiBaseData = Omit<
	PlacementUpdateFormData,
	'package_lpa_confirmed'
> & {
	package_lpa_confirmed: number | null;
};

type PlacementCreateApiData = Omit<
	PlacementCreateFormData,
	'package_lpa_confirmed'
> & {
	package_lpa_confirmed: number | null;
};

const PLACEMENTS_QUERY_KEY = 'placements';
export { PLACEMENTS_QUERY_KEY };

const processPlacementFormData = <
	T extends PlacementCreateFormData | PlacementUpdateFormData
>(
	data: T
): PlacementApiBaseData | PlacementCreateApiData => ({
	...data,
	placement_date: data.placement_date === '' ? null : data.placement_date,
	package_lpa_confirmed:
		data.package_lpa_confirmed === '' || data.package_lpa_confirmed === null
			? null
			: parseFloat(data.package_lpa_confirmed)
});

export const useGetPlacements = (filters?: {
	driveId?: number | null;
	studentId?: string | null;
	status?: PlacementStatus | null;
}) => {
	const queryClient = useQueryClient();
	const queryParams = new URLSearchParams();

	if (filters?.driveId) {
		queryParams.append('drive_id', filters.driveId.toString());
	}

	if (filters?.studentId) {
		if (typeof filters.studentId === 'string' && filters.studentId.trim()) {
			queryParams.append('student_id', filters.studentId);
		}
	}

	if (filters?.status) {
		queryParams.append('status', filters.status);
	}

	const queryString = queryParams.toString()
		? `?${queryParams.toString()}`
		: '';

	return useQuery<Placement[]>({
		queryKey: [PLACEMENTS_QUERY_KEY, filters],
		queryFn: async () => {
			try {
				// Only clear cache when explicitly requested, not on every fetch
				// queryClient.removeQueries({ queryKey: [PLACEMENTS_QUERY_KEY, filters] });

				const response = await fetch(`/api/placements${queryString}`, {
					method: 'GET',
					cache: 'no-store',
					headers: {
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						Pragma: 'no-cache',
						Expires: '0'
					}
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`Failed to fetch placements: ${response.status} ${errorText}`
					);
				}

				try {
					const data = await response.json();

					if (!Array.isArray(data)) {
						console.error('Expected array but got', typeof data);
						return [];
					}

					return data;
				} catch (parseError) {
					throw new Error(
						`Invalid response format from server: ${
							parseError instanceof Error
								? parseError.message
								: 'Unknown parsing error'
						}`
					);
				}
			} catch (error) {
				console.error('Error fetching placements:', error);
				throw error;
			}
		},
		staleTime: 30000, // Consider data stale after 30 seconds
		gcTime: 300000, // Keep data in cache for 5 minutes
		// Remove continuous refetching that's causing UI issues
		// refetchInterval: 5000,
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		enabled: !(
			filters?.studentId &&
			(typeof filters.studentId !== 'string' || !filters.studentId.trim())
		),
		retry: 1
	});
};

export const useGetPlacement = (placementId: number | null) => {
	return useQuery<Placement>({
		queryKey: [PLACEMENTS_QUERY_KEY, placementId],
		queryFn: async () => {
			if (!placementId) throw new Error('Placement ID is required');
			const response = await fetch(`/api/placements/${placementId}`);
			if (!response.ok) {
				throw new Error('Failed to fetch placement');
			}
			return response.json();
		},
		enabled: !!placementId
	});
};

export const useCreatePlacement = () => {
	const queryClient = useQueryClient();

	return useMutation<Placement, Error, PlacementCreateFormData>({
		mutationFn: async newPlacementData => {
			const processedData = processPlacementFormData(
				newPlacementData
			) as PlacementCreateApiData;
			const response = await fetch('/api/placements', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || 'Failed to create placement application'
				);
			}

			return response.json();
		},
		onSuccess: data => {
			// Invalidate all placement-related queries
			queryClient.invalidateQueries({ queryKey: [PLACEMENTS_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: ['placements'] });

			// Invalidate specific placement-related queries
			queryClient.invalidateQueries({
				queryKey: [PLACEMENTS_QUERY_KEY, { studentId: data.student_id }]
			});
			queryClient.invalidateQueries({
				queryKey: [PLACEMENTS_QUERY_KEY, { driveId: data.drive_id }]
			});

			// Invalidate drives, eligible drives, and drive details
			queryClient.invalidateQueries({ queryKey: ['drives'] });
			queryClient.invalidateQueries({ queryKey: ['drives', data.drive_id] });
			queryClient.invalidateQueries({ queryKey: ['eligibleDrives'] });

			// Invalidate student-related queries
			queryClient.invalidateQueries({
				queryKey: ['students', data.student_id]
			});

			// Invalidate statistics and other data
			queryClient.invalidateQueries({ queryKey: ['branches'] });
			queryClient.invalidateQueries({ queryKey: ['stats'] });
		},
		onError: error => {
			// Error handled by the UI
			console.debug('Placement creation error:', error);
		}
	});
};

export const useUpdatePlacement = () => {
	const queryClient = useQueryClient();

	return useMutation<
		Placement,
		Error,
		{ placementId: number; data: PlacementUpdateFormData }
	>({
		mutationFn: async ({ placementId, data }) => {
			const processedData = processPlacementFormData(
				data
			) as PlacementApiBaseData;
			const response = await fetch(`/api/placements/${placementId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to update placement');
			}

			return response.json();
		},
		onSuccess: (data, variables) => {
			// Invalidate all placement-related queries
			queryClient.invalidateQueries({ queryKey: [PLACEMENTS_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: ['placements'] });

			// Invalidate specific placement queries
			queryClient.invalidateQueries({
				queryKey: [PLACEMENTS_QUERY_KEY, variables.placementId]
			});
			queryClient.invalidateQueries({
				queryKey: [PLACEMENTS_QUERY_KEY, { studentId: data.student_id }]
			});
			queryClient.invalidateQueries({
				queryKey: [PLACEMENTS_QUERY_KEY, { driveId: data.drive_id }]
			});

			// Invalidate drive-related queries
			queryClient.invalidateQueries({ queryKey: ['drives'] });
			queryClient.invalidateQueries({ queryKey: ['drives', data.drive_id] });
			queryClient.invalidateQueries({ queryKey: ['eligibleDrives'] });

			// Invalidate student-related queries
			queryClient.invalidateQueries({
				queryKey: ['students', data.student_id]
			});

			// Invalidate statistics and other data
			queryClient.invalidateQueries({ queryKey: ['placements'] });
			queryClient.invalidateQueries({ queryKey: ['branches'] });
			queryClient.invalidateQueries({ queryKey: ['stats'] });
			queryClient.invalidateQueries({ queryKey: ['dashboard'] });
		},
		onError: error => {
			// Error handled by the UI
			console.debug('Placement update error:', error);
		}
	});
};

export const useDeletePlacement = () => {
	const queryClient = useQueryClient();

	return useMutation<{ message: string }, Error, number>({
		mutationFn: async placementId => {
			const response = await fetch(`/api/placements/${placementId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to delete placement');
			}

			if (response.status === 204) {
				return { message: 'Placement deleted successfully' };
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [PLACEMENTS_QUERY_KEY] });
			queryClient.invalidateQueries({ queryKey: ['placements'] });
			queryClient.invalidateQueries({ queryKey: ['branches'] });
			queryClient.invalidateQueries({ queryKey: ['students'] });
			queryClient.invalidateQueries({ queryKey: ['drives'] });
		},
		onError: error => {
			// Error handled by the UI
			console.debug('Placement deletion error:', error);
		}
	});
};
