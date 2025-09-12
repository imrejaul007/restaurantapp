export declare class LegalService {
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
    getAllLegalDocuments(): {
        documents: {
            id: string;
            title: string;
            description: string;
            lastUpdated: string;
        }[];
        disclaimer: string;
    };
}
