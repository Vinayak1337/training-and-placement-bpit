import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { Branch } from './branches'; 



export type Criteria = {
	criteria_id: number;
	description: string | null;
	min_percentage: number | null; 
	active_status: boolean;
	allowed_branches: Branch[]; 
	
};


export const criteriaFormSchema = z.object({
	description: z.string().max(255).optional().nullable(),
	min_percentage: z.coerce
		.number({ invalid_type_error: 'Percentage must be a number' })
		.min(0, 'Percentage cannot be negative')
		.max(100, 'Percentage cannot exceed 100')
		.optional()
		.nullable(),
	active_status: z.boolean(),
	branch_ids: z
		.array(z.number().int().positive())
		.min(1, 'At least one branch must be selected')
});

export type CriteriaFormData = z.infer<typeof criteriaFormSchema>;


type CriteriaApiData = Omit<CriteriaFormData, 'min_percentage'> & {
	min_percentage: number | null;
};

const CRITERIA_QUERY_KEY = 'criteria';


const processCriteriaFormData = (data: CriteriaFormData): CriteriaApiData => ({
	...data,
	description: data.description === '' ? null : data.description,
	min_percentage:
		data.min_percentage === null || data.min_percentage === undefined
			? null
			: data.min_percentage
});




export const useGetCriteria = () => {
	return useQuery<Criteria[]>({
		queryKey: [CRITERIA_QUERY_KEY],
		queryFn: async () => {
			const response = await fetch('/api/criteria');
			if (!response.ok) {
				throw new Error('Failed to fetch criteria');
			}
			return response.json();
		}
	});
};




export const useAddCriteria = () => {
	const queryClient = useQueryClient();
	return useMutation<Criteria, Error, CriteriaFormData>({
		mutationFn: async newCriteriaData => {
			const processedData = processCriteriaFormData(newCriteriaData);
			const response = await fetch('/api/criteria', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to add criteria');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [CRITERIA_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error adding criteria:', error);
		}
	});
};


export const useUpdateCriteria = () => {
	const queryClient = useQueryClient();
	return useMutation<
		Criteria,
		Error,
		{ criteriaId: number; data: CriteriaFormData }
	>({
		mutationFn: async ({ criteriaId, data }) => {
			const processedData = processCriteriaFormData(data);
			const response = await fetch(`/api/criteria/${criteriaId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to update criteria');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [CRITERIA_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error updating criteria:', error);
		}
	});
};


export const useDeleteCriteria = () => {
	const queryClient = useQueryClient();
	return useMutation<{ message: string }, Error, number>({
		mutationFn: async criteriaId => {
			const response = await fetch(`/api/criteria/${criteriaId}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to delete criteria');
			}
			if (response.status === 204) {
				return { message: 'Criteria deleted successfully' };
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [CRITERIA_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error deleting criteria:', error);
		}
	});
};
