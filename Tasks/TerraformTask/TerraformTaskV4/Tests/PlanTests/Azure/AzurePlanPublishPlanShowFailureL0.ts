import { TerraformCommandHandlerAzureRM } from './../../../src/azure-terraform-command-handler';
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAzureRM: TerraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

export async function run() {
    try {
        // A failed publish must warn rather than fail the plan, so this still resolves 0.
        const response = await terraformCommandHandlerAzureRM.plan();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AzurePlanPublishPlanShowFailureL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AzurePlanPublishPlanShowFailureL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AzurePlanPublishPlanShowFailureL0 should have succeeded but failed.');
    }
}

run();
