// ============================================================================
// agentic-test — JSON Reporter
// ============================================================================

import type { Reporter, RunResult } from '../core/types.js';

/**
 * Outputs the full test results as a JSON document.
 * Useful for programmatic consumption, dashboards, or piping to other tools.
 */
export class JsonReporter implements Reporter {
    private outputPath?: string;

    constructor(options?: { outputPath?: string }) {
        this.outputPath = options?.outputPath;
    }

    onRunEnd(result: RunResult): void {
        const output = JSON.stringify(result, null, 2);

        if (this.outputPath) {
            // Write to file (async, best-effort)
            import('fs').then((fs) => {
                fs.writeFileSync(this.outputPath!, output, 'utf-8');
                console.log(`JSON report written to: ${this.outputPath}`);
            });
        } else {
            console.log(output);
        }
    }
}
