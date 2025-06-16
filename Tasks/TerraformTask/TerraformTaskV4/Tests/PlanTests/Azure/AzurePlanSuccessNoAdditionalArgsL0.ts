import { TerraformCommandHandlerAzureRM } from "../../../src/azure-terraform-command-handler";
import tl = require('azure-pipelines-task-lib');

let terraformCommandHandlerAzureRM: TerraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

export async function run() {
    try {
        console.log("Starting plan command execution");
        console.log("Provider:", tl.getInput('provider'));
        console.log("Command:", tl.getInput('command'));
        console.log("Working Directory:", tl.getInput('workingDirectory'));
        console.log("Command Options:", tl.getInput('commandOptions'));
        console.log("Environment Service Name:", tl.getInput('environmentServiceNameAzureRM'));
        
        const response = await terraformCommandHandlerAzureRM.plan();
        console.log("Plan command execution completed with response:", response);
        if (response === 0) {
            tl.setResult(tl.TaskResult.Succeeded, 'AzurePlanSuccessNoAdditionalArgsL0 should have succeeded.');
        } else{
            tl.setResult(tl.TaskResult.Failed, 'AzurePlanSuccessNoAdditionalArgsL0 should have succeeded but failed.');
        }
    } catch(error) {
        console.log("Plan command execution failed with error:", error);
        tl.setResult(tl.TaskResult.Failed, 'AzurePlanSuccessNoAdditionalArgsL0 should have succeeded but failed.');
    }
}

run();