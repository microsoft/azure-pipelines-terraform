import { OpenTofuCommandHandlerAWS } from '../../../src/aws-opentofu-command-handler';
import tl = require('azure-pipelines-task-lib');

let openTofuCommandHandlerAWS: OpenTofuCommandHandlerAWS = new OpenTofuCommandHandlerAWS();

export async function run() {
    try {
        await openTofuCommandHandlerAWS.plan();
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'AWSPlanFailInvalidWorkingDirectoryL0 should have succeeded but failed with error.');
    }
}

run();