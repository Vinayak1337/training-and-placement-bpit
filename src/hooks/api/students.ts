import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as z from 'zod';
import { Branch } from './branches'; 


export type Student = {
	student_id: string;
	name: string;
	department_branch_id: number;
	email: string;
	grade: string | null;
	percentage: number | null;
	address: string | null;
	contact_no: string | null;
	resume_url: string | null;
	branch: Branch;
};


export const studentCreateFormSchema = z.object({
	student_id: z.string().min(1, 'Student ID is required').max(50),
	name: z.string().min(1, 'Name is required').max(255),
	department_branch_id: z
		.number()
		.int()
		.positive('Valid branch selection is required'),
	grade: z.string().max(5).optional().nullable(),
	percentage: z.coerce
		.number({ invalid_type_error: 'Percentage must be a number' })
		.min(0)
		.max(100)
		.optional()
		.nullable(),
	address: z.string().optional().nullable(),
	contact_no: z.string().max(20).optional().nullable(),
	email: z.string().email('Invalid email address').max(255),
	resume_url: z
		.string()
		.url({ message: 'Invalid URL' })
		.max(512)
		.optional()
		.nullable(),
	password: z.string().min(6, 'Password must be at least 6 characters')
});


export const studentUpdateFormSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255),
	department_branch_id: z
		.number()
		.int()
		.positive('Valid branch selection is required'),
	grade: z.string().max(5).optional().nullable(),
	percentage: z.coerce
		.number({ invalid_type_error: 'Percentage must be a number' })
		.min(0)
		.max(100)
		.optional()
		.nullable(),
	address: z.string().optional().nullable(),
	contact_no: z.string().max(20).optional().nullable(),
	email: z.string().email('Invalid email address').max(255),
	resume_url: z
		.string()
		.url({ message: 'Invalid URL' })
		.max(512)
		.optional()
		.nullable()
});

export type StudentCreateFormData = z.infer<typeof studentCreateFormSchema>;
export type StudentUpdateFormData = z.infer<typeof studentUpdateFormSchema>;


type StudentApiBaseData = Omit<StudentUpdateFormData, 'percentage'> & {
	percentage: number | null;
};
type StudentCreateApiData = Omit<StudentCreateFormData, 'percentage'> & {
	percentage: number | null;
};

const STUDENTS_QUERY_KEY = 'students';


const processStudentFormData = <
	T extends StudentCreateFormData | StudentUpdateFormData
>(
	data: T
): StudentApiBaseData | StudentCreateApiData => ({
	...data,
	grade: data.grade === '' ? null : data.grade,
	percentage:
		data.percentage === null || data.percentage === undefined
			? null
			: data.percentage,
	address: data.address === '' ? null : data.address,
	contact_no: data.contact_no === '' ? null : data.contact_no,
	resume_url: data.resume_url === '' ? null : data.resume_url
});




export const useGetStudents = () => {
	return useQuery<Student[]>({
		queryKey: [STUDENTS_QUERY_KEY],
		queryFn: async () => {
			const response = await fetch('/api/students');
			if (!response.ok) {
				throw new Error('Failed to fetch students');
			}
			return response.json();
		}
	});
};




export const useAddStudent = () => {
	const queryClient = useQueryClient();
	
	return useMutation<Student, Error, StudentCreateFormData>({
		mutationFn: async newStudentData => {
			const processedData = processStudentFormData(
				newStudentData
			) as StudentCreateApiData;
			const response = await fetch('/api/students', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to add student');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error adding student:', error);
		}
	});
};


export const useUpdateStudent = () => {
	const queryClient = useQueryClient();
	
	return useMutation<
		Student,
		Error,
		{ studentId: string; data: StudentUpdateFormData }
	>({
		mutationFn: async ({ studentId, data }) => {
			const processedData = processStudentFormData(data) as StudentApiBaseData;
			const response = await fetch(`/api/students/${studentId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(processedData)
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to update student');
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error updating student:', error);
		}
	});
};


export const useDeleteStudent = () => {
	const queryClient = useQueryClient();
	return useMutation<{ message: string }, Error, string>({
		
		mutationFn: async studentId => {
			const response = await fetch(`/api/students/${studentId}`, {
				method: 'DELETE'
			});
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || 'Failed to delete student');
			}
			if (response.status === 204) {
				return { message: 'Student deleted successfully' };
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
		},
		onError: error => {
			console.error('Error deleting student:', error);
		}
	});
};
