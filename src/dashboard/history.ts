// ============================================================================
// agentic-test — Dashboard History Storage
// ============================================================================

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { RunResult } from '../core/types.js';

const DEFAULT_DIR = '.agentic-test/results';

/**
 * Save a test run result for the dashboard history.
 */
export function saveRunResult(result: RunResult, dir?: string): string {
    const historyDir = resolve(dir ?? DEFAULT_DIR);
    if (!existsSync(historyDir)) {
        mkdirSync(historyDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `run-${timestamp}.json`;
    const filepath = join(historyDir, filename);

    const record = {
        ...result,
        savedAt: new Date().toISOString(),
    };

    writeFileSync(filepath, JSON.stringify(record, null, 2), 'utf-8');
    return filepath;
}

/**
 * Load all historical run results.
 */
export function loadRunHistory(dir?: string): Array<RunResult & { savedAt: string }> {
    const historyDir = resolve(dir ?? DEFAULT_DIR);
    if (!existsSync(historyDir)) return [];

    const files = readdirSync(historyDir)
        .filter((f) => f.startsWith('run-') && f.endsWith('.json'))
        .sort();

    return files.map((f) => {
        try {
            return JSON.parse(readFileSync(join(historyDir, f), 'utf-8'));
        } catch {
            return null;
        }
    }).filter(Boolean);
}
