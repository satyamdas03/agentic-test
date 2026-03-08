// ============================================================================
// agentic-test — Snapshot Recorder & Replay
// ============================================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { AgentAdapter, AgentResponse, AdapterOptions } from '../core/types.js';
import type { Snapshot, SnapshotFile } from './types.js';

/**
 * Options for the recording adapter.
 */
export interface RecordOptions {
    /** Directory to store snapshot files */
    snapshotDir?: string;
    /** Suite name for organizing snapshots */
    suiteName?: string;
    /** Additional metadata to attach to recordings */
    metadata?: Record<string, unknown>;
}

/**
 * Wraps an agent adapter to record all interactions as snapshots.
 * The agent runs normally, but responses are saved to `.snap.json` files.
 *
 * @example
 * ```ts
 * const recorded = recordAdapter(myRealAgent, {
 *   snapshotDir: './__snapshots__',
 *   suiteName: 'flight-booking',
 *   metadata: { model: 'gpt-4', temperature: 0.7 },
 * });
 *
 * // Use in describe() — agent runs for real, responses are saved
 * describe('Flight Agent', { adapter: recorded }, () => { ... });
 * ```
 */
export function recordAdapter(
    adapter: AgentAdapter,
    options: RecordOptions = {},
): AgentAdapter {
    const snapshotDir = resolve(options.snapshotDir ?? './__snapshots__');
    const suiteName = options.suiteName ?? 'default';
    const metadata = options.metadata ?? {};

    // Ensure directory exists
    if (!existsSync(snapshotDir)) {
        mkdirSync(snapshotDir, { recursive: true });
    }

    const snapshotPath = join(snapshotDir, `${suiteName}.snap.json`);

    // Load existing snapshot file or create new one
    let snapshotFile: SnapshotFile = {
        version: '1.0.0',
        suiteName,
        snapshots: {},
    };

    if (existsSync(snapshotPath)) {
        try {
            snapshotFile = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
        } catch {
            // Start fresh if file is corrupted
        }
    }

    return {
        async run(input: string, adapterOptions?: AdapterOptions): Promise<AgentResponse> {
            // Run the real agent
            const response = await adapter.run(input, adapterOptions);

            // Create a stable key from the input
            const key = createSnapshotKey(input);

            // Record the snapshot
            const snapshot: Snapshot = {
                input,
                response: {
                    output: response.output,
                    toolCalls: response.toolCalls,
                    tokens: response.tokens,
                    duration: response.duration,
                },
                recordedAt: new Date().toISOString(),
                metadata,
            };

            snapshotFile.snapshots[key] = snapshot;

            // Save to disk
            writeFileSync(snapshotPath, JSON.stringify(snapshotFile, null, 2), 'utf-8');

            return response;
        },

        async teardown() {
            if (adapter.teardown) {
                await adapter.teardown();
            }
        },
    };
}

/**
 * Creates a replay adapter that loads recorded snapshots instead of calling the real agent.
 * Perfect for deterministic regression testing without API costs.
 *
 * @example
 * ```ts
 * const replayed = replayAdapter({
 *   snapshotDir: './__snapshots__',
 *   suiteName: 'flight-booking',
 * });
 *
 * // Use in describe() — no API calls, just recorded responses
 * describe('Flight Agent (regression)', { adapter: replayed }, () => { ... });
 * ```
 */
export function replayAdapter(
    options: RecordOptions = {},
): AgentAdapter {
    const snapshotDir = resolve(options.snapshotDir ?? './__snapshots__');
    const suiteName = options.suiteName ?? 'default';

    const snapshotPath = join(snapshotDir, `${suiteName}.snap.json`);

    if (!existsSync(snapshotPath)) {
        throw new Error(
            `Snapshot file not found: ${snapshotPath}. Run tests with recordAdapter first.`,
        );
    }

    const snapshotFile: SnapshotFile = JSON.parse(
        readFileSync(snapshotPath, 'utf-8'),
    );

    return {
        async run(input: string, _options?: AdapterOptions): Promise<AgentResponse> {
            const key = createSnapshotKey(input);
            const snapshot = snapshotFile.snapshots[key];

            if (!snapshot) {
                return {
                    output: `[SNAPSHOT MISS] No recorded snapshot for input: "${input}"`,
                    toolCalls: [],
                    tokens: 0,
                    duration: 0,
                    error: new Error(`No snapshot found for input: "${input}"`),
                };
            }

            // Simulate a small delay to be realistic
            await new Promise((resolve) => setTimeout(resolve, 5));

            return {
                ...snapshot.response,
                duration: snapshot.response.duration ?? 0,
            };
        },
    };
}

/**
 * List all recorded snapshots for a suite.
 */
export function listSnapshots(
    options: RecordOptions = {},
): { key: string; input: string; recordedAt: string }[] {
    const snapshotDir = resolve(options.snapshotDir ?? './__snapshots__');
    const suiteName = options.suiteName ?? 'default';
    const snapshotPath = join(snapshotDir, `${suiteName}.snap.json`);

    if (!existsSync(snapshotPath)) {
        return [];
    }

    const snapshotFile: SnapshotFile = JSON.parse(
        readFileSync(snapshotPath, 'utf-8'),
    );

    return Object.entries(snapshotFile.snapshots).map(([key, snap]) => ({
        key,
        input: snap.input,
        recordedAt: snap.recordedAt,
    }));
}

/**
 * Create a stable key from an input string.
 */
function createSnapshotKey(input: string): string {
    // Use a simple hash for the key
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash + char) & 0x7fffffff;
    }
    // Also include a sanitized version of the input for readability
    const sanitized = input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 50);
    return `${sanitized}_${hash.toString(36)}`;
}
