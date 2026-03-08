// ============================================================================
// agentic-test — Cosine Similarity Utility
// ============================================================================

/**
 * Compute cosine similarity between two vectors.
 * Range: -1.0 to 1.0 (typically 0.0 to 1.0 for positive vectors)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(
            `Vector dimension mismatch: ${a.length} vs ${b.length}`,
        );
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
}

/**
 * Compute TF-IDF vectors for two documents and return their cosine similarity.
 * This is a zero-dependency alternative to embedding-based similarity.
 */
export function tfidfSimilarity(text1: string, text2: string): number {
    const docs = [tokenize(text1), tokenize(text2)];

    // Build vocabulary
    const vocab = new Set<string>();
    for (const doc of docs) {
        for (const term of doc) {
            vocab.add(term);
        }
    }

    if (vocab.size === 0) return 1.0;

    const terms = Array.from(vocab);

    // Compute TF-IDF vectors
    const vectors = docs.map((doc) => {
        return terms.map((term) => {
            const tf = doc.filter((t) => t === term).length / Math.max(doc.length, 1);
            const df = docs.filter((d) => d.includes(term)).length;
            const idf = Math.log((docs.length + 1) / (df + 1)) + 1;
            return tf * idf;
        });
    });

    return cosineSimilarity(vectors[0], vectors[1]);
}

/**
 * Tokenize text into normalized words, filtering stop words.
 */
function tokenize(text: string): string[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
        'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'before', 'after', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet',
        'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
        'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'their',
    ]);

    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.has(w));
}
