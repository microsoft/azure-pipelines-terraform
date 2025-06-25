import { OpenTofuCommandHandlerGCP } from '../../../src/gcp-opentofu-command-handler';
import tl = require('azure-pipelines-task-lib');

let openTofuCommandHandlerGCP: OpenTofuCommandHandlerGCP = new OpenTofuCommandHandlerGCP();

export async function run() {
    try {
        const response = await openTofuCommandHandlerGCP.destroy();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'GCPDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'GCPDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'GCPDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded but failed.');
    }
}

run();