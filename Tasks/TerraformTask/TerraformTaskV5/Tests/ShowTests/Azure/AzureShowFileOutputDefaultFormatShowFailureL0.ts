import { TerraformCommandHandlerAzureRM } from './../../../src/azure-terraform-command-handler';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAzureRM: TerraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

export async function run() {
    try {
        const response = await terraformCommandHandlerAzureRM.show();
        // The default format returns the exit code instead of throwing; index.ts reports
        // that as a success.
        if (response === 1) {
            tl.setResult(tl.TaskResult.Succeeded, 'AzureShowFileOutputDefaultFormatShowFailureL0 returned the exit code without throwing.');
        } else{
            tl.setResult(tl.TaskResult.Failed, `AzureShowFileOutputDefaultFormatShowFailureL0 expected the exit code, got ${response}.`);
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AzureShowFileOutputDefaultFormatShowFailureL0 should not have thrown for the default format.');
    }
}

run();
