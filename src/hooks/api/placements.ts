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
				const response = await fetch(`/api/placements${queryString}`, {
					method: 'GET',
					cache: 'no-store',
					headers: {
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						Pragma: 'no-cache',
						Expires: '0',
						'Accept': 'application/json'
					}
				});

				if (!response.ok) {
					console.error(`Placements API error: ${response.status}`);
					// Return empty array instead of throwing
					return [];
				}

				// Check content type to ensure we're handling JSON
				const contentType = response.headers.get('content-type');
				if (!contentType || !contentType.includes('application/json')) {
					console.warn('Placements API response is not JSON', contentType);
					return [];
				}

				// Get the response as text first
				const responseText = await response.text();

				// Skip parsing if empty
				if (!responseText.trim()) {
					console.warn('Empty response from placements API');
					return [];
				}

				try {
					// Then parse it as JSON
					const data = JSON.parse(responseText);

					if (!Array.isArray(data)) {
						console.warn('Placements API: expected array but got', typeof data);
						return [];
					}

					return data;
				} catch (parseError) {
					console.error('Placements API JSON parse error:', parseError, 'Response text:', responseText.substring(0, 100));
					// Return empty array instead of throwing
					return [];
				}
			} catch (error) {
				console.error('Error fetching placements:', error);
				// Return empty array instead of throwing
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
			if (!placementId) {
				console.error('Placement ID is required');
				// Return empty placement object instead of throwing
				return {} as Placement;
			}
			try {
				const response = await fetch(`/api/placements/${placementId}`, {
					headers: {
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						'Accept': 'application/json'
					}
				});

				if (!response.ok) {
					console.error(`Error fetching placement ${placementId}: ${response.status}`);
					return {} as Placement;
				}

				// Get text response first
				const responseText = await response.text();
				if (!responseText.trim()) {
					console.warn('Empty response from placement API');
					return {} as Placement;
				}

				try {
					// Then parse as JSON
					return JSON.parse(responseText);
				} catch (parseError) {
					console.error('Placement API JSON parse error:', parseError);
					return {} as Placement;
				}
			} catch (error) {
				console.error('Error fetching placement:', error);
				return {} as Placement;
			}
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
