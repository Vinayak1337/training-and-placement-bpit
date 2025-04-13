import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';


export type Company = {
	company_id: number;
	name: string;
	description?: string | null;
	website_url?: string | null;
};


export const companyFormSchema = z.object({
	name: z.string().min(1, 'Company name is required').max(255),
	description: z.string().max(1000).optional().nullable(),
	website_url: z.string().url('Invalid URL').max(255).optional().nullable()
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;

const COMPANIES_QUERY_KEY = 'companies';


const processCompanyFormData = (data: CompanyFormData) => ({
	...data,
	description: data.description === '' ? null : data.description,
	website_url: data.website_url === '' ? null : data.website_url
});




export const useGetCompanies = () => {
	return useQuery<Company[]>({
		queryKey: [COMPANIES_QUERY_KEY],
		queryFn: async () => {
			const response = await fetch('/api/companies');
			if (!response.ok) {
				throw new Error('Failed to fetch companies');
			}
			return response.json();
		}
	});
};




export const useAddCompany = () => {
	const queryClient = useQueryClient();
	return useMutation<Company, Error, CompanyFormData>({
		mutationFn: async newCompanyData => {
			const processedData = processCompanyFormData(newCompanyData);
			const response = await fetch('/api/companies', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to add company');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error adding company:', error);
		}
	});
};


export const useUpdateCompany = () => {
	const queryClient = useQueryClient();
	return useMutation<
		Company,
		Error,
		{ companyId: number; data: CompanyFormData }
	>({
		mutationFn: async ({ companyId, data }) => {
			const processedData = processCompanyFormData(data);
			const response = await fetch(`/api/companies/${companyId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to update company');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error updating company:', error);
		}
	});
};


export const useDeleteCompany = () => {
	const queryClient = useQueryClient();
	return useMutation<{ message: string }, Error, number>({
		mutationFn: async companyId => {
			const response = await fetch(`/api/companies/${companyId}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to delete company');
			}
			if (response.status === 204) {
				return { message: 'Company deleted successfully' };
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [COMPANIES_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error deleting company:', error);
		}
	});
};
