// ============================================================================
// Tests — CI Generator
// ============================================================================

import { describe, it, expect } from 'vitest';
import { generateGitHubActionsWorkflow } from '../../src/ci/github-actions.js';

describe('GitHub Actions Generator', () => {
    it('generates a valid workflow', () => {
        const workflow = generateGitHubActionsWorkflow();
        expect(workflow).toContain('name: Agent Tests');
        expect(workflow).toContain('npm ci');
        expect(workflow).toContain('agentic-test run');
        expect(workflow).toContain('upload-artifact');
    });

    it('includes custom node version', () => {
        const workflow = generateGitHubActionsWorkflow({ nodeVersion: '22' });
        expect(workflow).toContain("node-version: '22'");
    });

    it('includes secrets', () => {
        const workflow = generateGitHubActionsWorkflow({ secrets: ['OPENAI_API_KEY'] });
        expect(workflow).toContain('OPENAI_API_KEY');
        expect(workflow).toContain('secrets.OPENAI_API_KEY');
    });

    it('includes schedule', () => {
        const workflow = generateGitHubActionsWorkflow({ schedule: '0 6 * * *' });
        expect(workflow).toContain("cron: '0 6 * * *'");
    });
});
