import { OpenTofuCommandHandlerGCP } from '../../../src/gcp-opentofu-command-handler';
import tl = require('azure-pipelines-task-lib');

let openTofuCommandHandlerGCP: OpenTofuCommandHandlerGCP = new OpenTofuCommandHandlerGCP();

export async function run() {
    try {
        await openTofuCommandHandlerGCP.init();
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'GCPInitFailInvalidWorkingDirectoryL0 should have succeeded but failed.');
    }
}

run();