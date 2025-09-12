export declare enum ModerationAction {
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    REQUEST_CHANGES = "REQUEST_CHANGES",
    FLAG = "FLAG",
    SUSPEND = "SUSPEND"
}
export declare enum ModerationPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare class ModerateJobDto {
    action: ModerationAction;
    moderatorNotes: string;
    feedback?: string;
    priority?: ModerationPriority;
    requiresFollowUp?: boolean;
    flagReasons?: string[];
}
