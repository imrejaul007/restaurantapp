export declare class CreateForumDto {
    name: string;
    description: string;
    category: string;
    isPrivate?: boolean;
    rules?: string;
}
export declare class UpdateForumDto {
    name?: string;
    description?: string;
    category?: string;
    rules?: string;
}
