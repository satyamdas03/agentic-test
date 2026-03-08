// ============================================================================
// agentic-test — Test Context (shared state per test)
// ============================================================================

import type { AgentAdapter, AdapterOptions } from './types.js';

/**
 * TestContext provides shared state and configuration for a test execution.
 * It is created per-test and passed to hooks.
 */
export class TestContext {
    /** The adapter to use for this test */
    public adapter: AgentAdapter;
    /** Adapter options for this test */
    public adapterOptions: AdapterOptions;
    /** Custom metadata attached by hooks */
    public metadata: Map<string, unknown> = new Map();

    constructor(adapter: AgentAdapter, adapterOptions: AdapterOptions = {}) {
        this.adapter = adapter;
        this.adapterOptions = adapterOptions;
    }

    /**
     * Set a metadata value (useful in beforeEach hooks).
     */
    set(key: string, value: unknown): void {
        this.metadata.set(key, value);
    }

    /**
     * Get a metadata value.
     */
    get<T = unknown>(key: string): T | undefined {
        return this.metadata.get(key) as T | undefined;
    }
}
