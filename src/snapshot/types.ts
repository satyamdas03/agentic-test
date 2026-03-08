// ============================================================================
// agentic-test — Snapshot Types
// ============================================================================

import type { AgentResponse, ToolCall } from '../core/types.js';

/**
 * A recorded snapshot of an agent interaction.
 */
export interface Snapshot {
    /** The input that was sent to the agent */
    input: string;
    /** The agent's recorded response */
    response: AgentResponse;
    /** When this snapshot was recorded */
    recordedAt: string;
    /** Optional metadata about the recording */
    metadata?: {
        model?: string;
        temperature?: number;
        version?: string;
        [key: string]: unknown;
    };
}

/**
 * A collection of snapshots stored in a single file.
 */
export interface SnapshotFile {
    /** Version of the snapshot format */
    version: string;
    /** Name of the test suite this snapshot belongs to */
    suiteName: string;
    /** All recorded snapshots */
    snapshots: Record<string, Snapshot>;
}
