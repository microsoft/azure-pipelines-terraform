import { TerraformCommandHandlerAzureRM } from "../../../src/azure-terraform-command-handler";
import tl = require('azure-pipelines-task-lib/task');

let terraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

async function run() {
    try {
        console.log("Starting init command execution");
        console.log("Provider:", tl.getInput('provider'));
        console.log("Command:", tl.getInput('command'));
        console.log("Working Directory:", tl.getInput('workingDirectory'));
        console.log("Command Options:", tl.getInput('commandOptions'));
        console.log("Backend Service Arm:", tl.getInput('backendServiceArm'));
        
        const result = await terraformCommandHandlerAzureRM.init();
        console.log("Init command execution completed with result:", result);
        tl.setResult(tl.TaskResult.Succeeded, 'AzureInitSuccessAdditionalArgsL0 should have succeeded.');
    } catch (error) {
        console.log("Init command execution failed with error:", error);
        tl.setResult(tl.TaskResult.Failed, 'AzureInitSuccessAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();
