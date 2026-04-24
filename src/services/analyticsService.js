import crypto from 'crypto';

const sanitizeValue = (value, depth = 0) => {
    if (depth > 2 || value === undefined) {
        return null;
    }

    if (value === null || typeof value === 'boolean' || typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        return value.slice(0, 256);
    }

    if (Array.isArray(value)) {
        return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
    }

    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .slice(0, 20)
                .map(([key, item]) => [key, sanitizeValue(item, depth + 1)])
        );
    }

    return String(value).slice(0, 256);
};

export class AnalyticsService {
    constructor({
        googleCloudService,
        projectId = null,
        datasetId = null,
        tableId = null
    } = {}) {
        this.googleCloudService = googleCloudService;
        this.projectId = projectId;
        this.datasetId = datasetId;
        this.tableId = tableId;
    }

    isEnabled() {
        return Boolean(
            this.googleCloudService?.canUseRestApis?.()
            && this.projectId
            && this.datasetId
            && this.tableId
        );
    }

    getStatus() {
        return {
            enabled: this.isEnabled(),
            datasetId: this.datasetId || null,
            tableId: this.tableId || null
        };
    }

    async recordEvent(eventType, payload = {}) {
        if (!this.isEnabled()) {
            return false;
        }

        const accessToken = await this.googleCloudService.getAccessToken();
        if (!accessToken) {
            return false;
        }

        const row = {
            insertId: crypto.randomUUID(),
            json: {
                eventType: String(eventType || 'unknown'),
                createdAt: new Date().toISOString(),
                payload: sanitizeValue(payload)
            }
        };

        const response = await this.googleCloudService.fetchJson(
            `https://bigquery.googleapis.com/bigquery/v2/projects/${this.projectId}/datasets/${this.datasetId}/tables/${this.tableId}/insertAll`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    kind: 'bigquery#tableDataInsertAllRequest',
                    skipInvalidRows: true,
                    ignoreUnknownValues: true,
                    rows: [row]
                })
            }
        );

        if (Array.isArray(response?.insertErrors) && response.insertErrors.length > 0) {
            throw new Error('BigQuery insert returned row errors.');
        }

        return true;
    }
}
