import { OpenTofuCommandHandlerAzureRM } from '../../../src/azure-opentofu-command-handler';
import tl = require('azure-pipelines-task-lib');

let openTofuCommandHandlerAzureRM: OpenTofuCommandHandlerAzureRM = new OpenTofuCommandHandlerAzureRM();

export async function run() {
    try {
        const response = await openTofuCommandHandlerAzureRM.apply();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AzureApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AzureApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AzureApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded but failed.');
    }
}

run();