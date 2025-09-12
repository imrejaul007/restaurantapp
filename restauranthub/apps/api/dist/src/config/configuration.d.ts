declare const _default: () => {
    port: number;
    apiPrefix: string;
    database: {
        url: string | undefined;
    };
    redis: {
        enabled: boolean;
        url: string | undefined;
        host: string;
        port: number;
        password: string | undefined;
        mock: boolean;
    };
    jwt: {
        secret: string | undefined;
        refreshSecret: string | undefined;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    aws: {
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        region: string;
        s3: {
            bucketName: string | undefined;
            endpoint: string | undefined;
        };
    };
    razorpay: {
        keyId: string | undefined;
        keySecret: string | undefined;
        webhookSecret: string | undefined;
    };
    email: {
        smtp: {
            host: string | undefined;
            port: number;
            user: string | undefined;
            password: string | undefined;
        };
        from: string;
    };
    frontend: {
        url: string;
    };
    aadhaar: {
        apiUrl: string;
        apiKey: string | undefined;
        clientId: string | undefined;
        licenseKey: string | undefined;
        encryptionKey: string | undefined;
    };
    environment: string;
};
export default _default;
