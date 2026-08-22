import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import * as path from 'path';
import * as os from 'os';

describe('Terraform Test Suite', () => {
    before(() => {});

    after(() => {});

    it('azure show with file output should set showFilePath and publish the plan', async () => {
        let tp = path.join(__dirname, './ShowTests/Azure/AzureShowFileOutput.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
        const showFilePath = path.join(os.tmpdir(), 'terraform-show-working-directory', 'terraform-show-file-output-test.json');
        try {
            await tr.runAsync();

            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked once (show). actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.stdOutContained('task.setvariable variable=showFilePath'), 'should have set the showFilePath variable');
            assert(tr.stdOutContained(showFilePath), 'showFilePath should be resolved from workingDirectory');
            assert(tr.stdOutContained('task.addattachment'), 'should have published an attachment');
            assert(tr.stdOutContained('terraform-plan-results'), 'attachment should use the plan tab type');
            assert(tr.stdOutContained('AzureShowFileOutputL0 should have succeeded.'), 'Should have printed: AzureShowFileOutputL0 should have succeeded.');
        } catch(error) {
            throw error;
        }
    });
});
