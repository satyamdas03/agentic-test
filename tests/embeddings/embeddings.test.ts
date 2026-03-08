// ============================================================================
// Tests — Embeddings (Cosine Similarity & TF-IDF)
// ============================================================================

import { describe, it, expect } from 'vitest';
import { cosineSimilarity, tfidfSimilarity } from '../../src/embeddings/cosine.js';
import {
    LocalEmbeddings,
    computeSemanticSimilarity,
    setEmbeddingProvider,
    clearEmbeddingProvider,
} from '../../src/embeddings/index.js';

describe('Cosine Similarity', () => {
    it('returns 1.0 for identical vectors', () => {
        expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1.0, 5);
    });

    it('returns 0.0 for orthogonal vectors', () => {
        expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0, 5);
    });

    it('returns high similarity for similar vectors', () => {
        const sim = cosineSimilarity([1, 2, 3], [1, 2, 4]);
        expect(sim).toBeGreaterThan(0.9);
    });

    it('throws on dimension mismatch', () => {
        expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('dimension mismatch');
    });
});

describe('TF-IDF Similarity', () => {
    it('returns high similarity for related sentences', () => {
        const sim = tfidfSimilarity(
            'The weather is sunny and warm today',
            'Today the weather is warm and clear',
        );
        expect(sim).toBeGreaterThan(0.5);
    });

    it('returns low similarity for unrelated sentences', () => {
        const sim = tfidfSimilarity(
            'The weather is sunny today',
            'I like programming with TypeScript',
        );
        expect(sim).toBeLessThan(0.2);
    });

    it('returns 1.0 for identical text', () => {
        const sim = tfidfSimilarity('hello world', 'hello world');
        expect(sim).toBeCloseTo(1.0, 3);
    });
});

describe('Local Embeddings Provider', () => {
    it('produces normalized vectors', async () => {
        const local = new LocalEmbeddings();
        const vec = await local.embed('test sentence');
        const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
        expect(norm).toBeCloseTo(1.0, 3);
    });

    it('produces different vectors for different text', async () => {
        const local = new LocalEmbeddings();
        const v1 = await local.embed('weather forecast sunny');
        const v2 = await local.embed('programming typescript code');
        const sim = cosineSimilarity(v1, v2);
        expect(sim).toBeLessThan(0.8);
    });
});

describe('computeSemanticSimilarity', () => {
    it('uses TF-IDF when no provider is set', async () => {
        clearEmbeddingProvider();
        const sim = await computeSemanticSimilarity('sunny weather', 'warm sunny day');
        expect(sim).toBeGreaterThan(0);
        expect(sim).toBeLessThanOrEqual(1);
    });

    it('uses local provider when configured', async () => {
        setEmbeddingProvider(new LocalEmbeddings());
        const sim = await computeSemanticSimilarity('hello world', 'hello world');
        expect(sim).toBeCloseTo(1.0, 3);
        clearEmbeddingProvider();
    });
});
