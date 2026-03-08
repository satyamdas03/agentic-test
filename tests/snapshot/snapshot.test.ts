// ============================================================================
// Tests — Snapshot Record & Replay
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { recordAdapter, replayAdapter, listSnapshots } from '../../src/snapshot/recorder.js';
import { createMockAgent } from '../../src/mocks/mock-provider.js';

const TEST_SNAPSHOT_DIR = resolve('./tests/snapshot/__test_snapshots__');

describe('Snapshot Record & Replay', () => {
    // Clean up before and after
    beforeEach(() => {
        if (existsSync(TEST_SNAPSHOT_DIR)) {
            rmSync(TEST_SNAPSHOT_DIR, { recursive: true });
        }
    });

    afterEach(() => {
        if (existsSync(TEST_SNAPSHOT_DIR)) {
            rmSync(TEST_SNAPSHOT_DIR, { recursive: true });
        }
    });

    it('records agent responses to snapshot files', async () => {
        const agent = createMockAgent()
            .on('weather')
            .respondWith({
                output: 'Sunny, 72°F',
                toolCalls: [{ name: 'getWeather', arguments: { city: 'NYC' } }],
                tokens: 50,
            })
            .build();

        const recorded = recordAdapter(agent, {
            snapshotDir: TEST_SNAPSHOT_DIR,
            suiteName: 'weather-test',
        });

        const response = await recorded.run('What is the weather?');

        expect(response.output).toBe('Sunny, 72°F');
        expect(existsSync(join(TEST_SNAPSHOT_DIR, 'weather-test.snap.json'))).toBe(true);

        // Verify snapshot content
        const snapContent = JSON.parse(
            readFileSync(join(TEST_SNAPSHOT_DIR, 'weather-test.snap.json'), 'utf-8'),
        );
        expect(snapContent.version).toBe('1.0.0');
        expect(Object.keys(snapContent.snapshots)).toHaveLength(1);
    });

    it('replays recorded responses without calling real agent', async () => {
        const agent = createMockAgent()
            .on('weather')
            .respondWith({
                output: 'Sunny, 72°F',
                toolCalls: [{ name: 'getWeather', arguments: { city: 'NYC' } }],
                tokens: 50,
            })
            .build();

        // Record first
        const recorded = recordAdapter(agent, {
            snapshotDir: TEST_SNAPSHOT_DIR,
            suiteName: 'replay-test',
        });
        await recorded.run('What is the weather?');

        // Replay
        const replayed = replayAdapter({
            snapshotDir: TEST_SNAPSHOT_DIR,
            suiteName: 'replay-test',
        });
        const response = await replayed.run('What is the weather?');

        expect(response.output).toBe('Sunny, 72°F');
        expect(response.toolCalls).toHaveLength(1);
        expect(response.toolCalls[0].name).toBe('getWeather');
    });

    it('handles missing snapshots gracefully', async () => {
        // Record something
        const agent = createMockAgent()
            .on('*')
            .respondWith({ output: 'hi', tokens: 10 })
            .build();

        const recorded = recordAdapter(agent, {
            snapshotDir: TEST_SNAPSHOT_DIR,
            suiteName: 'miss-test',
        });
        await recorded.run('hello');

        // Replay with different input
        const replayed = replayAdapter({
            snapshotDir: TEST_SNAPSHOT_DIR,
            suiteName: 'miss-test',
        });
        const response = await replayed.run('completely different input');

        expect(response.output).toContain('SNAPSHOT MISS');
        expect(response.error).toBeDefined();
    });

    it('lists snapshots', async () => {
        const agent = createMockAgent()
            .on('*')
            .respondWith({ output: 'ok', tokens: 10 })
            .build();

        const recorded = recordAdapter(agent, {
            snapshotDir: TEST_SNAPSHOT_DIR,
            suiteName: 'list-test',
        });
        await recorded.run('question 1');
        await recorded.run('question 2');

        const snaps = listSnapshots({
            snapshotDir: TEST_SNAPSHOT_DIR,
            suiteName: 'list-test',
        });
        expect(snaps).toHaveLength(2);
    });
});
