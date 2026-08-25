import { TerraformCommandHandlerAzureRM } from './../../../src/azure-terraform-command-handler';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAzureRM: TerraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

export async function run() {
    try {
        await terraformCommandHandlerAzureRM.show();
        // Reaching here means a failed show was reported as a success.
        tl.setResult(tl.TaskResult.Failed, 'AzureShowFileOutputShowFailureL0 should have failed but succeeded.');
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AzureShowFileOutputShowFailureL0 failed as expected.');
    }
}

run();
