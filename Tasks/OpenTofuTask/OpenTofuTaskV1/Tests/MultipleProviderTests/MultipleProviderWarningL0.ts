import { OpenTofuCommandHandlerAzureRM } from '../../src/azure-opentofu-command-handler';
import tl = require('azure-pipelines-task-lib');

let openTofuCommandHandlerAzureRM: OpenTofuCommandHandlerAzureRM = new OpenTofuCommandHandlerAzureRM();

export async function run() {
    try {
        await openTofuCommandHandlerAzureRM.warnIfMultipleProviders();
    } catch(error) {
        tl.setResult(tl.TaskResult.Failed, 'MultipleProviderWarningL0 should have succeeded but failed.');
    }
}

run();