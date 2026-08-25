import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
import os = require('os');

let tp = path.join(__dirname, './AzurePlanSuccessPublishPlanL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'plan');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('environmentServiceNameAzureRM', 'AzureRM');
// An explicit -out keeps the command deterministic. Without one the task appends its
// own -out with a uuid, which the mock answers cannot match on.
tr.setInput('commandOptions', '-out=tfplan');
tr.setInput('publishPlan', 'my-plan');

// Keep the published plan file out of the repo.
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
        "terraform plan -out=tfplan -detailed-exitcode": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform show -json tfplan": {
            "code": 0,
            "stdout": "{\"format_version\":\"1.2\",\"terraform_version\":\"1.9.0\",\"resource_changes\":[]}"
        }
    }
}

tr.setAnswers(a);
tr.run();
