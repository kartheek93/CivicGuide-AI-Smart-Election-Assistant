import crypto from 'crypto';

const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest();

const safeEqual = (left, right) => {
    return crypto.timingSafeEqual(hashValue(left), hashValue(right));
};

export class AuthService {
    constructor({ required = true, adminPassword = null, tokenSecret = null, tokenTtlMs = 2 * 60 * 60 * 1000 } = {}) {
        this.required = required;
        this.adminPassword = adminPassword;
        this.tokenSecret = tokenSecret;
        this.tokenTtlMs = tokenTtlMs;
    }

    isAuthRequired() {
        return this.required;
    }

    hasAdminPassword() {
        return Boolean(this.adminPassword);
    }

    isConfigured() {
        return this.required
            ? Boolean(this.adminPassword && this.tokenSecret)
            : true;
    }

    verifyPassword(password) {
        if (!this.required || !this.adminPassword || typeof password !== 'string' || password.length > 256) {
            return false;
        }

        return safeEqual(password, this.adminPassword);
    }

    createToken() {
        if (!this.tokenSecret) {
            throw new Error('AUTH_TOKEN_SECRET or ADMIN_PASSWORD must be configured.');
        }

        const payload = Buffer.from(JSON.stringify({
            typ: 'auth',
            iat: Date.now(),
            exp: Date.now() + this.tokenTtlMs,
            nonce: crypto.randomUUID()
        })).toString('base64url');

        const signature = crypto
            .createHmac('sha256', this.tokenSecret)
            .update(payload)
            .digest('base64url');

        return `${payload}.${signature}`;
    }

    isValidAuthHeader(authHeader) {
        if (!this.required) {
            return true;
        }

        if (!this.tokenSecret || !authHeader?.startsWith('Bearer ')) {
            return false;
        }

        const [payload, signature] = authHeader.slice(7).split('.');
        if (!payload || !signature) {
            return false;
        }

        const expectedSignature = crypto
            .createHmac('sha256', this.tokenSecret)
            .update(payload)
            .digest('base64url');

        if (!safeEqual(signature, expectedSignature)) {
            return false;
        }

        try {
            const parsedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
            return parsedPayload.typ === 'auth'
                && Number.isFinite(parsedPayload.exp)
                && parsedPayload.exp > Date.now();
        } catch {
            return false;
        }
    }
}
