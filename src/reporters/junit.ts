// ============================================================================
// agentic-test — JUnit XML Reporter
// ============================================================================

import type { Reporter, RunResult } from '../core/types.js';

/**
 * Outputs test results in JUnit XML format for CI/CD integration.
 * Compatible with Jenkins, GitHub Actions, CircleCI, etc.
 */
export class JUnitReporter implements Reporter {
    private outputPath?: string;

    constructor(options?: { outputPath?: string }) {
        this.outputPath = options?.outputPath;
    }

    onRunEnd(result: RunResult): void {
        const xml = this.buildXML(result);

        if (this.outputPath) {
            import('fs').then((fs) => {
                fs.writeFileSync(this.outputPath!, xml, 'utf-8');
                console.log(`JUnit report written to: ${this.outputPath}`);
            });
        } else {
            console.log(xml);
        }
    }

    private buildXML(result: RunResult): string {
        const lines: string[] = [];
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push(
            `<testsuites tests="${result.totalTests}" failures="${result.failed}" time="${(result.duration / 1000).toFixed(3)}">`,
        );

        for (const suite of result.suites) {
            const suiteTests = suite.tests.length;
            const suiteFailures = suite.tests.filter(
                (t) => t.status === 'failed' || t.status === 'error',
            ).length;
            const suiteSkipped = suite.tests.filter(
                (t) => t.status === 'skipped',
            ).length;

            lines.push(
                `  <testsuite name="${escapeXML(suite.name)}" tests="${suiteTests}" failures="${suiteFailures}" skipped="${suiteSkipped}" time="${(suite.duration / 1000).toFixed(3)}">`,
            );

            for (const test of suite.tests) {
                lines.push(
                    `    <testcase name="${escapeXML(test.name)}" classname="${escapeXML(suite.name)}" time="${(test.duration / 1000).toFixed(3)}">`,
                );

                if (test.status === 'skipped') {
                    lines.push('      <skipped/>');
                } else if (test.status === 'failed') {
                    const failedAssertions = test.assertions.filter((a) => !a.passed);
                    const message = failedAssertions
                        .map((a) => `${a.name}: ${a.message}`)
                        .join('\n');
                    lines.push(
                        `      <failure message="${escapeXML(failedAssertions[0]?.message ?? 'Test failed')}" type="AssertionFailure"><![CDATA[${message}]]></failure>`,
                    );
                } else if (test.status === 'error') {
                    lines.push(
                        `      <error message="${escapeXML(test.error?.message ?? 'Unknown error')}" type="Error"><![CDATA[${test.error?.stack ?? test.error?.message ?? 'Unknown error'}]]></error>`,
                    );
                }

                lines.push('    </testcase>');
            }

            lines.push('  </testsuite>');
        }

        lines.push('</testsuites>');
        return lines.join('\n');
    }
}

function escapeXML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
