import { TerraformCommandHandlerAzureRM } from "../../../src/azure-terraform-command-handler";
import tl = require('azure-pipelines-task-lib/task');

let terraformCommandHandlerAzureRM = new TerraformCommandHandlerAzureRM();

async function run() {
    try {
        console.log("Starting apply command execution");
        console.log("Provider:", tl.getInput('provider'));
        console.log("Command:", tl.getInput('command'));
        console.log("Working Directory:", tl.getInput('workingDirectory'));
        console.log("Command Options:", tl.getInput('commandOptions'));
        console.log("Environment Service Name:", tl.getInput('environmentServiceNameAzureRM'));
        console.log("Auth Scheme:", process.env['ENDPOINT_AUTH_SCHEME_AzureRM']);
        
        // Debug environment variables
        console.log("ARM_CLIENT_ID:", process.env['ARM_CLIENT_ID']);
        console.log("ARM_TENANT_ID:", process.env['ARM_TENANT_ID']);
        console.log("ARM_SUBSCRIPTION_ID:", process.env['ARM_SUBSCRIPTION_ID']);
        console.log("ARM_OIDC_TOKEN:", process.env['ARM_OIDC_TOKEN'] ? 'Set' : 'Not set');
        console.log("ARM_USE_OIDC:", process.env['ARM_USE_OIDC']);
        
        try {
            await terraformCommandHandlerAzureRM.apply();
            console.log("Apply command completed successfully");
            tl.setResult(tl.TaskResult.Succeeded, 'AzureApplySuccessAuthenticationSchemeWorkloadIdentityFederationL0 should have succeeded.');
        } catch (applyError) {
            console.log("Apply command execution failed with error:", applyError instanceof Error ? applyError.message : applyError);
            console.log("Error stack:", applyError instanceof Error ? applyError.stack : 'No stack available');
            throw applyError;
        }
    } catch (error) {
        console.log("Test failed with error:", error instanceof Error ? error.message : error);
        tl.setResult(tl.TaskResult.Failed, 'AzureApplySuccessAuthenticationSchemeWorkloadIdentityFederationL0 should have succeeded but failed.');
    }
}

run();
