import { OpenTofuCommandHandlerGCP } from '../../../src/gcp-opentofu-command-handler';
import tl = require('azure-pipelines-task-lib');

let openTofuCommandHandlerGCP: OpenTofuCommandHandlerGCP = new OpenTofuCommandHandlerGCP();

export async function run() {
    try {
        const response = await openTofuCommandHandlerGCP.validate();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'GCPValidateSuccessNoAdditionalArgsL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'GCPValidateSuccessNoAdditionalArgsL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'GCPValidateSuccessNoAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();