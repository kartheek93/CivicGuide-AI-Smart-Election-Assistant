import test from 'node:test';
import assert from 'node:assert/strict';
import { checkEligibility, getElectionSteps } from '../src/services/electionService.js';
import { isValidAge, isValidQuestion } from '../src/utils/validators.js';

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
