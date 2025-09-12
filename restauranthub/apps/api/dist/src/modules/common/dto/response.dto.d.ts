export declare class BaseResponseDto<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: any;
    timestamp: string;
    constructor(success: boolean, data?: T, message?: string, error?: any);
    static success<T>(data?: T, message?: string): BaseResponseDto<T>;
    static error(message: string, error?: any): BaseResponseDto;
}
export declare class ErrorResponseDto {
    statusCode: number;
    message: string;
    error?: string;
    timestamp: string;
    path: string;
    constructor(statusCode: number, message: string, path: string, error?: string);
}
export declare class SuccessResponseDto<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    timestamp: string;
    constructor(data?: T, message?: string);
}
