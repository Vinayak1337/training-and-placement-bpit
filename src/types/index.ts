export interface Student {
	id: string;
	name: string;
	email: string;
	enrollmentNumber: string;
	branch: string;
	batch: string;
	cgpa: number;
	resume?: string;
	status: 'active' | 'inactive';
	placements?: Placement[];
}

export interface Drive {
	id: string;
	companyName: string;
	role: string;
	jobDescription?: string;
	location: string;
	driveDate: string; // ISO string format
	registrationDeadline: string; // ISO string format
	eligibilityCriteria: {
		minCgpa?: number;
		branches?: string[];
		batch?: string;
		otherRequirements?: string;
	};
	salary?: {
		ctc?: number;
		stipend?: number;
		breakup?: string;
	};
	status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Placement {
	id: string;
	studentId: string;
	driveId: string;
	companyName: string;
	role: string;
	type: 'full-time' | 'internship';
	offerDate: string; // ISO string format
	joiningDate?: string; // ISO string format
	salary: number;
	status: 'accepted' | 'rejected' | 'pending';
}

export interface Branch {
	id: string;
	name: string;
	code: string;
	department: string;
	totalStudents?: number;
}

export interface Company {
	id: string;
	name: string;
	website?: string;
	description?: string;
	industry?: string;
	logo?: string;
	visits?: number;
	hiredStudents?: number;
}

// Enum for placement statuses used in the admin dashboard
export enum PlacementStatus {
	Applied = 'Applied',
	Shortlisted = 'Shortlisted',
	Interview_Scheduled = 'Interview_Scheduled',
	Offered = 'Offered',
	Offer_Accepted = 'Offer_Accepted',
	Offer_Rejected = 'Offer_Rejected',
	Not_Placed = 'Not_Placed'
}
