import { OpenTofuCommandHandlerAzureRM } from '../../../src/azure-opentofu-command-handler';
import tl = require('azure-pipelines-task-lib');

let openTofuCommandHandlerAzureRM: OpenTofuCommandHandlerAzureRM = new OpenTofuCommandHandlerAzureRM();

export async function run() {
    try {
        const response = await openTofuCommandHandlerAzureRM.plan();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AzurePlanSuccessAdditionalArgsL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AzurePlanSuccessAdditionalArgsL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AzurePlanSuccessAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();