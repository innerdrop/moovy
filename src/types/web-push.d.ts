// Type declarations for web-push module
declare module 'web-push' {
    interface PushSubscription {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    }

    interface VapidDetails {
        subject: string;
        publicKey: string;
        privateKey: string;
    }

    interface WebPushError extends Error {
        statusCode: number;
        headers: { [key: string]: string };
        body: string;
    }

    interface SendResult {
        statusCode: number;
        body: string;
        headers: { [key: string]: string };
    }

    function setVapidDetails(
        subject: string,
        publicKey: string,
        privateKey: string
    ): void;

    function sendNotification(
        subscription: PushSubscription,
        payload?: string | Buffer,
        options?: any
    ): Promise<SendResult>;

    function generateVAPIDKeys(): { publicKey: string; privateKey: string };
}
