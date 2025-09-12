import { LegalService } from './legal.service';
export declare class LegalController {
    private readonly legalService;
    constructor(legalService: LegalService);
    getAllLegalDocuments(): {
        documents: {
            id: string;
            title: string;
            description: string;
            lastUpdated: string;
        }[];
        disclaimer: string;
    };
    getTermsOfService(): {
        title: string;
        lastUpdated: string;
        content: string;
    };
    getPrivacyPolicy(): {
        title: string;
        lastUpdated: string;
        content: string;
    };
    getCookiePolicy(): {
        title: string;
        lastUpdated: string;
        content: string;
    };
    getDataProcessingAgreement(): {
        title: string;
        lastUpdated: string;
        content: string;
    };
    getLegalDocument(documentId: string): {
        title: string;
        lastUpdated: string;
        content: string;
    };
}
