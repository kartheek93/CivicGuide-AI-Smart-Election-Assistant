import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { checkEligibility, getElectionSteps } from '../src/services/electionService.js';
import { AuthService } from '../src/services/authService.js';
import { KnowledgeBaseService } from '../src/services/knowledgeBaseService.js';
import {
    isValidAge,
    isValidQuestion,
    isValidSpeechText,
    normalizeInput,
    sanitizeInput
} from '../src/utils/validators.js';

test('Election Service: checkEligibility', async (t) => {
    
    await t.test('returns eligible for 18+ registered citizens', () => {
        const result = checkEligibility(25, 'indian-citizen', 'registered');
        assert.equal(result.eligible, true);
        assert.match(result.message, /Great news! You appear eligible/);
    });

    await t.test('returns not eligible for under 18', () => {
        const result = checkEligibility(17, 'indian-citizen', 'registered');
        assert.equal(result.eligible, false);
        assert.match(result.message, /must be at least 18/);
    });

    await t.test('returns not eligible for non-citizens', () => {
        const result = checkEligibility(30, 'non-citizen', 'registered');
        assert.equal(result.eligible, false);
        assert.match(result.message, /must be an Indian citizen/);
    });

    await t.test('returns not eligible for not registered citizens over 18', () => {
        const result = checkEligibility(30, 'indian-citizen', 'not-registered');
        assert.equal(result.eligible, false);
        assert.match(result.message, /need to register with the Election Commission/);
    });

    await t.test('handles edge case: exact age of 18', () => {
        const result = checkEligibility(18, 'indian-citizen', 'registered');
        assert.equal(result.eligible, true);
    });

    await t.test('handles invalid inputs gracefully', () => {
        const result1 = checkEligibility(null, 'indian-citizen', 'registered');
        assert.equal(result1.eligible, false);
        
        const result2 = checkEligibility(25, undefined, 'registered');
        assert.equal(result2.eligible, false);

        const result3 = checkEligibility('abc', 'indian-citizen', 'registered');
        assert.equal(result3.eligible, false);
    });

});

test('Election Service: getElectionSteps', async (t) => {
    await t.test('returns a valid array of structured steps', () => {
        const steps = getElectionSteps();
        assert.ok(Array.isArray(steps), 'Should return an array');
        assert.ok(steps.length > 0, 'Should not be empty');
        
        // Check structure of first step
        assert.ok(steps[0].hasOwnProperty('step'));
        assert.ok(steps[0].hasOwnProperty('title'));
        assert.ok(steps[0].hasOwnProperty('description'));
    });
});

test('Validators: isValidAge', async (t) => {
    await t.test('returns true for valid age', () => {
        assert.equal(isValidAge(25), true);
        assert.equal(isValidAge("30"), true);
        assert.equal(isValidAge(130), true);
        assert.equal(isValidAge(1), true);
    });

    await t.test('returns false for invalid age', () => {
        assert.equal(isValidAge(-5), false);
        assert.equal(isValidAge(150), false);
        assert.equal(isValidAge("abc"), false);
        assert.equal(isValidAge("18abc"), false);
        assert.equal(isValidAge(""), false);
    });
});

test('Validators: isValidQuestion', async (t) => {
    await t.test('returns true for valid questions', () => {
        assert.equal(isValidQuestion("What is voting?"), true);
        assert.equal(isValidQuestion("a"), true);
    });

    await t.test('returns false for invalid questions', () => {
        assert.equal(isValidQuestion(""), false);
        assert.equal(isValidQuestion("   "), false);
        assert.equal(isValidQuestion(123), false);
        assert.equal(isValidQuestion("a".repeat(501)), false); // exceeds 500 chars limit
    });
});

test('Validators: normalizeInput and speech validation', async (t) => {
    await t.test('normalizes control characters and extra whitespace', () => {
        assert.equal(normalizeInput('  hello \n\t world  '), 'hello world');
    });

    await t.test('validates speech text length', () => {
        assert.equal(isValidSpeechText('Important election guidance'), true);
        assert.equal(isValidSpeechText(''), false);
        assert.equal(isValidSpeechText('a'.repeat(1501)), false);
    });

    await t.test('sanitizes HTML-sensitive characters for frontend rendering', () => {
        assert.equal(sanitizeInput('<script>"vote"</script>'), '&lt;script&gt;&quot;vote&quot;&lt;/script&gt;');
    });
});

test('Auth Service: signed token validation', () => {
    const authService = new AuthService({
        required: true,
        adminPassword: 'super-secret',
        tokenSecret: 'token-secret',
        tokenTtlMs: 60_000
    });

    assert.equal(authService.verifyPassword('super-secret'), true);
    assert.equal(authService.verifyPassword('wrong-password'), false);

    const token = authService.createToken();
    assert.equal(authService.isValidAuthHeader(`Bearer ${token}`), true);
    assert.equal(authService.isValidAuthHeader('Bearer invalid.token'), false);
});

test('Auth Service: bypasses auth when not required', () => {
    const authService = new AuthService({
        required: false
    });

    assert.equal(authService.isAuthRequired(), false);
    assert.equal(authService.isConfigured(), true);
    assert.equal(authService.isValidAuthHeader(''), true);
});

test('Knowledge Base Service: retrieves relevant sections', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'civicguide-kb-'));
    const filePath = path.join(tempDir, 'knowledge.txt');

    await fs.writeFile(filePath, [
        '# Test Knowledge Base',
        '',
        '## Registration',
        '- Use the voter portal to register or update details.',
        '',
        '## Polling Day Documents',
        '- Carry EPIC or another approved ID on polling day.',
        '',
        '## Accessibility',
        '- Assistance is available for voters who need support.'
    ].join('\n'));

    const knowledgeBaseService = new KnowledgeBaseService({ filePath, maxRelevantSections: 2 });
    const context = await knowledgeBaseService.getRelevantContext('What ID should I carry to the polling booth?');

    assert.match(context, /Polling Day Documents/);
    assert.match(context, /approved ID/);
});
