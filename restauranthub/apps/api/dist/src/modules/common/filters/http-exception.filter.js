"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const library_1 = require("@prisma/client/runtime/library");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors = null;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object') {
                message = exceptionResponse.message || exception.message;
                errors = exceptionResponse.errors || null;
            }
            else {
                message = exceptionResponse;
            }
        }
        else if (exception instanceof library_1.PrismaClientKnownRequestError) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = this.handlePrismaError(exception);
        }
        else if (exception instanceof library_1.PrismaClientValidationError) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = 'Database validation error';
            errors = { validation: exception.message };
        }
        else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
        }
        if (status >= 500) {
            this.logger.error(`HTTP ${status} Error: ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : exception);
        }
        else {
            this.logger.warn(`HTTP ${status} Error: ${request.method} ${request.url} - ${message}`);
        }
        const errorResponse = {
            success: false,
            statusCode: status,
            message,
            ...(errors && { errors }),
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
        };
        response.status(status).json(errorResponse);
    }
    handlePrismaError(error) {
        switch (error.code) {
            case 'P2000':
                return 'The provided value is too long';
            case 'P2001':
                return 'Record does not exist';
            case 'P2002':
                const target = error.meta?.target;
                if (Array.isArray(target)) {
                    return `${target.join(', ')} must be unique`;
                }
                return 'Unique constraint violation';
            case 'P2003':
                return 'Foreign key constraint violation';
            case 'P2004':
                return 'Database constraint violation';
            case 'P2005':
                return 'Invalid field value';
            case 'P2006':
                return 'Invalid field value';
            case 'P2007':
                return 'Data validation error';
            case 'P2008':
                return 'Failed to parse query';
            case 'P2009':
                return 'Failed to validate query';
            case 'P2010':
                return 'Raw query failed';
            case 'P2011':
                return 'Null constraint violation';
            case 'P2012':
                return 'Missing required value';
            case 'P2013':
                return 'Missing required argument';
            case 'P2014':
                return 'Required relation violation';
            case 'P2015':
                return 'Related record not found';
            case 'P2016':
                return 'Query interpretation error';
            case 'P2017':
                return 'Records are not connected';
            case 'P2018':
                return 'Required connected records not found';
            case 'P2019':
                return 'Input error';
            case 'P2020':
                return 'Value out of range';
            case 'P2021':
                return 'Table does not exist';
            case 'P2022':
                return 'Column does not exist';
            case 'P2023':
                return 'Inconsistent column data';
            case 'P2024':
                return 'Connection pool timeout';
            case 'P2025':
                return 'Record not found';
            case 'P2026':
                return 'Unsupported feature';
            case 'P2027':
                return 'Multiple errors occurred';
            default:
                return `Database error: ${error.message}`;
        }
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=http-exception.filter.js.map