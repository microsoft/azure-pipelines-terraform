import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
import os = require('os');

let tp = path.join(__dirname, './AzurePlanPublishPlanShowFailureL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'plan');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('environmentServiceNameAzureRM', 'AzureRM');
// An explicit -out keeps the command deterministic.
tr.setInput('commandOptions', '-out=tfplan');
tr.setInput('publishPlan', 'my-plan');

process.env['SYSTEM_DEFAULTWORKINGDIRECTORY'] = os.tmpdir();

process.env['ENDPOINT_AUTH_SCHEME_AzureRM'] = 'ServicePrincipal';
process.env['ENDPOINT_DATA_AzureRM_SUBSCRIPTIONID'] = 'DummmySubscriptionId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALID'] = 'DummyServicePrincipalId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALKEY'] = 'DummyServicePrincipalKey';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_TENANTID'] = 'DummyTenantId';

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    "which": {
        "terraform": "terraform"
    },
    "checkPath": {
        "terraform": true
    },
    "exec": {
        "terraform providers": {
            "code": 0,
            "stdout": "provider azurerm"
        },
        // The plan itself succeeds; only the publishing step fails.
        "terraform plan -out=tfplan -detailed-exitcode": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform show -json tfplan": {
            "code": 1,
            "stdout": "",
            "stderr": "Error: Failed to read the given plan file"
        }
    }
}

tr.setAnswers(a);
tr.run();
