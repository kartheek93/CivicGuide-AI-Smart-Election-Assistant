import test from 'node:test';
import assert from 'node:assert/strict';
import { AnalyticsService } from '../src/services/analyticsService.js';

test('Analytics Service: records BigQuery events when configured', async () => {
    const capturedRequests = [];

    const analyticsService = new AnalyticsService({
        projectId: 'demo-project',
        datasetId: 'civicguide_analytics',
        tableId: 'app_events',
        googleCloudService: {
            canUseRestApis() {
                return true;
            },
            async getAccessToken() {
                return 'access-token';
            },
            async fetchJson(url, options) {
                capturedRequests.push({ url, options });
                return {};
            }
        }
    });

    const recorded = await analyticsService.recordEvent('ai.ask.completed', {
        text: 'a'.repeat(400),
        nested: {
            language: 'English'
        }
    });

    assert.equal(recorded, true);
    assert.equal(capturedRequests.length, 1);
    assert.match(capturedRequests[0].url, /bigquery\.googleapis\.com/);

    const requestBody = JSON.parse(capturedRequests[0].options.body);
    assert.equal(requestBody.rows[0].json.eventType, 'ai.ask.completed');
    assert.equal(requestBody.rows[0].json.payload.text.length, 256);
    assert.equal(requestBody.rows[0].json.payload.nested.language, 'English');
});

test('Analytics Service: stays disabled without dataset and table configuration', async () => {
    const analyticsService = new AnalyticsService({
        projectId: 'demo-project',
        datasetId: null,
        tableId: null,
        googleCloudService: {
            canUseRestApis() {
                return true;
            }
        }
    });

    assert.equal(analyticsService.isEnabled(), false);
    assert.deepEqual(analyticsService.getStatus(), {
        enabled: false,
        datasetId: null,
        tableId: null
    });

    const recorded = await analyticsService.recordEvent('ai.ask.completed', { language: 'English' });
    assert.equal(recorded, false);
});
