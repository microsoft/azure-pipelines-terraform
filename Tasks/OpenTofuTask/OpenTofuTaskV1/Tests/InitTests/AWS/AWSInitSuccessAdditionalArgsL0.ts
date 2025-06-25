import { OpenTofuCommandHandlerAWS } from '../../../src/aws-opentofu-command-handler';
import tl = require('azure-pipelines-task-lib');

let openTofuCommandHandlerAWS: OpenTofuCommandHandlerAWS = new OpenTofuCommandHandlerAWS();

export async function run() {
    try {
        const response = await openTofuCommandHandlerAWS.init();
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AWSInitSuccessAdditionalArgsL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AWSInitSuccessAdditionalArgsL0 should have succeeded but failed.');
        }
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AWSInitSuccessAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();