// ============================================================================
// agentic-test — GitHub Actions Reporter
// ============================================================================

import type { Reporter, TestResult } from '../core/types.js';

/**
 * Emits GitHub Actions annotations for inline PR feedback.
 * Failed tests show as errors, skipped tests as warnings.
 *
 * @see https://docs.github.com/en/actions/reference/workflow-commands
 */
export class GitHubActionsReporter implements Reporter {
    onTestResult(suiteName: string, result: TestResult): void {
        if (result.status === 'failed' || result.status === 'error') {
            const failedAssertions = result.assertions.filter((a) => !a.passed);
            const message = failedAssertions.length > 0
                ? failedAssertions.map((a) => `${a.name}: ${a.message}`).join(' | ')
                : result.error?.message ?? 'Test failed';

            console.log(
                `::error title=${suiteName} > ${result.name}::${escapeAnnotation(message)}`,
            );
        }
    }
}

function escapeAnnotation(str: string): string {
    return str
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
