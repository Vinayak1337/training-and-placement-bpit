import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';



export type Branch = {
	branch_id: number;
	branch_name: string;
	
};


export const branchFormSchema = z.object({
	branch_name: z.string().min(1, 'Branch name is required').max(100)
});

export type BranchFormData = z.infer<typeof branchFormSchema>;

const BRANCHES_QUERY_KEY = 'branches';




export const useGetBranches = () => {
	return useQuery<Branch[]>({
		queryKey: [BRANCHES_QUERY_KEY],
		queryFn: async () => {
			const response = await fetch('/api/branches');
			if (!response.ok) {
				throw new Error('Failed to fetch branches');
			}
			return response.json();
		}
		
	});
};




















export const useAddBranch = () => {
	const queryClient = useQueryClient();
	return useMutation<Branch, Error, BranchFormData>({
		mutationFn: async newBranchData => {
			const response = await fetch('/api/branches', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newBranchData)
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to add branch');
			}
			return response.json();
		},
		onSuccess: () => {
			
			queryClient.invalidateQueries({ queryKey: [BRANCHES_QUERY_KEY] });
			
		},
		onError: error => {
			
			console.error('Error adding branch:', error);
		}
	});
};


export const useUpdateBranch = () => {
	const queryClient = useQueryClient();
	return useMutation<Branch, Error, { branchId: number; data: BranchFormData }>(
		{
			mutationFn: async ({ branchId, data }) => {
				const response = await fetch(`/api/branches/${branchId}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				});
				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(errorData.message || 'Failed to update branch');
				}
				return response.json();
			},
			onSuccess: () => {
				
				queryClient.invalidateQueries({ queryKey: [BRANCHES_QUERY_KEY] });

				
				

				
			},
			onError: error => {
				
				console.error('Error updating branch:', error);
			}
		}
	);
};


export const useDeleteBranch = () => {
	const queryClient = useQueryClient();
	return useMutation<{ message: string }, Error, number>({
		
		mutationFn: async branchId => {
			const response = await fetch(`/api/branches/${branchId}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to delete branch');
			}
			
			if (response.status === 204) {
				return { message: 'Branch deleted successfully' };
			}
			return response.json();
		},
		onSuccess: () => {
			
			queryClient.invalidateQueries({ queryKey: [BRANCHES_QUERY_KEY] });
			
		},
		onError: error => {
			
			console.error('Error deleting branch:', error);
		}
	});
};
