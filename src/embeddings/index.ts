// ============================================================================
// agentic-test — Embedding Providers
// ============================================================================

import { cosineSimilarity, tfidfSimilarity } from './cosine.js';

/**
 * Interface for embedding providers.
 * Users can implement this to plug in any embedding model.
 */
export interface EmbeddingProvider {
    /** Convert text to a vector embedding */
    embed(text: string): Promise<number[]>;
    /** Optional: batch embed multiple texts */
    embedBatch?(texts: string[]): Promise<number[][]>;
}

/**
 * Global embedding provider instance.
 * Set this to enable embedding-based semantic assertions.
 */
let globalProvider: EmbeddingProvider | null = null;

/**
 * Configure the global embedding provider.
 *
 * @example
 * ```ts
 * import { setEmbeddingProvider, OpenAIEmbeddings } from 'agentic-test';
 * setEmbeddingProvider(new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY }));
 * ```
 */
export function setEmbeddingProvider(provider: EmbeddingProvider): void {
    globalProvider = provider;
}

/**
 * Get the current global embedding provider.
 */
export function getEmbeddingProvider(): EmbeddingProvider | null {
    return globalProvider;
}

/**
 * Clear the global embedding provider (useful for testing).
 */
export function clearEmbeddingProvider(): void {
    globalProvider = null;
}

/**
 * Compute semantic similarity between two texts.
 * Uses the global embedding provider if set, otherwise falls back to TF-IDF.
 */
export async function computeSemanticSimilarity(
    text1: string,
    text2: string,
): Promise<number> {
    if (globalProvider) {
        const [vec1, vec2] = await Promise.all([
            globalProvider.embed(text1),
            globalProvider.embed(text2),
        ]);
        return cosineSimilarity(vec1, vec2);
    }

    // Fallback: TF-IDF based similarity (zero dependencies)
    return tfidfSimilarity(text1, text2);
}

// ============================================================================
// Built-in Embedding Providers
// ============================================================================

/**
 * OpenAI Embeddings provider.
 * Requires an API key (set via constructor or OPENAI_API_KEY env var).
 *
 * @example
 * ```ts
 * const embeddings = new OpenAIEmbeddings({ apiKey: 'sk-...' });
 * setEmbeddingProvider(embeddings);
 * ```
 */
export class OpenAIEmbeddings implements EmbeddingProvider {
    private apiKey: string;
    private model: string;
    private cache: Map<string, number[]> = new Map();

    constructor(options?: { apiKey?: string; model?: string }) {
        this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? '';
        this.model = options?.model ?? 'text-embedding-3-small';

        if (!this.apiKey) {
            throw new Error(
                'OpenAI API key is required. Pass it via constructor or set OPENAI_API_KEY env var.',
            );
        }
    }

    async embed(text: string): Promise<number[]> {
        // Check cache
        if (this.cache.has(text)) {
            return this.cache.get(text)!;
        }

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                input: text,
                model: this.model,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as {
            data: Array<{ embedding: number[] }>;
        };
        const embedding = data.data[0].embedding;

        // Cache the result
        this.cache.set(text, embedding);
        return embedding;
    }

    async embedBatch(texts: string[]): Promise<number[][]> {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                input: texts,
                model: this.model,
            }),
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as {
            data: Array<{ embedding: number[] }>;
        };
        return data.data.map((d) => d.embedding);
    }
}

/**
 * Local TF-IDF embeddings (zero dependencies, no API calls).
 * Uses TF-IDF vectorization for lightweight semantic similarity.
 */
export class LocalEmbeddings implements EmbeddingProvider {
    async embed(text: string): Promise<number[]> {
        // For local embeddings, we use a simple bag-of-words hash
        // The actual similarity computation happens in tfidfSimilarity
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 1);

        // Create a fixed-size vector using hashing trick
        const vectorSize = 256;
        const vector = new Array(vectorSize).fill(0);

        for (const word of words) {
            const hash = simpleHash(word) % vectorSize;
            vector[hash] += 1;
        }

        // Normalize
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (norm > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }

        return vector;
    }
}

function simpleHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
    }
    return hash;
}
