// ============================================================================
// Tests — Dashboard History
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { saveRunResult, loadRunHistory } from '../../src/dashboard/history.js';
import type { RunResult } from '../../src/core/types.js';

const TEST_DIR = resolve('./tests/dashboard/__test_history__');

const mockResult: RunResult = {
    suites: [],
    totalTests: 5,
    passed: 4,
    failed: 1,
    skipped: 0,
    duration: 1200,
    totalTokens: 500,
};

describe('Dashboard History', () => {
    beforeEach(() => {
        if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    });
    afterEach(() => {
        if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    });

    it('saves and loads run results', () => {
        saveRunResult(mockResult, TEST_DIR);
        const history = loadRunHistory(TEST_DIR);
        expect(history).toHaveLength(1);
        expect(history[0].totalTests).toBe(5);
        expect(history[0].passed).toBe(4);
        expect(history[0].savedAt).toBeTruthy();
    });

    it('loads multiple results in order', () => {
        saveRunResult(mockResult, TEST_DIR);
        saveRunResult({ ...mockResult, passed: 5, failed: 0 }, TEST_DIR);
        const history = loadRunHistory(TEST_DIR);
        expect(history).toHaveLength(2);
    });

    it('returns empty array for nonexistent dir', () => {
        const history = loadRunHistory('./nonexistent_dir_12345');
        expect(history).toEqual([]);
    });
});
