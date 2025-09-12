export declare class CreateJobDto {
    title: string;
    description: string;
    requirements?: string[];
    skills?: string[];
    experienceMin?: number;
    experienceMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    location: string;
    jobType: string;
    validTill: string;
}
