import { describe, test, expect } from 'vitest';
import { runRagBenchmark, runReactBenchmark } from '../../src/benchmarks/index.js';
import { createMockAgent } from '../../src/mocks/mock-provider.js';

const mockRagAdapter = createMockAgent()
    .on('capital of France')
    .respondWith({ output: 'The capital of France is Paris.' })
    .on('Romeo and Juliet')
    .respondWith({ output: 'William Shakespeare wrote Romeo and Juliet.' })
    .on('*')
    .respondWith({ output: 'I do not know the answer to that.' })
    .build();

const mockReactAdapter = createMockAgent()
    .on('weather')
    .respondWith({ output: 'Weather check', toolCalls: [{ name: 'getWeather', arguments: { location: 'New York' } }] })
    .on('database')
    .respondWith({ output: 'DB query', toolCalls: [{ name: 'queryDatabase', arguments: { userId: 12345 } }] })
    .on('*')
    .respondWith({ output: 'I cannot perform that action.' })
    .build();

describe('Benchmark Integration Tests', () => {
    test('RAG Benchmark executes fully', async () => {
        const ragReport = await runRagBenchmark({ adapter: mockRagAdapter, mini: true });

        expect(ragReport.passed).toBe(2);
        expect(ragReport.failed).toBe(3);
        expect(ragReport.total).toBe(5);
    });

    test('ReAct Benchmark executes fully', async () => {
        const reactReport = await runReactBenchmark({ adapter: mockReactAdapter, mini: true });

        expect(reactReport.passed).toBe(2);
        expect(reactReport.failed).toBe(3);
        expect(reactReport.total).toBe(5);
    });
});
