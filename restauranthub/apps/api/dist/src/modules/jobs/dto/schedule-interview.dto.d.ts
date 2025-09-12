export declare enum InterviewType {
    IN_PERSON = "IN_PERSON",
    VIDEO_CALL = "VIDEO_CALL",
    PHONE = "PHONE"
}
export declare class ScheduleInterviewDto {
    scheduledFor: string;
    interviewType: InterviewType;
    location?: string;
    notes?: string;
}
