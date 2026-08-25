import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
import os = require('os');
import fs = require('fs');

let tp = path.join(__dirname, './AzurePlanPublishPlanPathWithSpacesL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

// Working directory with a space; ToolRunner.line() splits unquoted options on whitespace.
const workingDirectory = path.join(os.tmpdir(), 'tf agent dir');
fs.mkdirSync(workingDirectory, { recursive: true });

// Pin the uuid so the generated plan file name is predictable enough to answer on.
tr.registerMock('uuid', { v4: () => 'fixed-uuid' });

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'plan');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('environmentServiceNameAzureRM', 'AzureRM');
// No commandOptions, so the task supplies its own -out.
tr.setInput('publishPlan', 'spaced-plan');

process.env['SYSTEM_DEFAULTWORKINGDIRECTORY'] = workingDirectory;

process.env['ENDPOINT_AUTH_SCHEME_AzureRM'] = 'ServicePrincipal';
process.env['ENDPOINT_DATA_AzureRM_SUBSCRIPTIONID'] = 'DummmySubscriptionId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALID'] = 'DummyServicePrincipalId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALKEY'] = 'DummyServicePrincipalKey';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_TENANTID'] = 'DummyTenantId';

const generatedPlanFile = path.join(workingDirectory, 'terraform-plan-fixed-uuid.tfplan');

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
        [`terraform plan -detailed-exitcode -out=${generatedPlanFile}`]: {
            "code": 0,
            "stdout": "Executed successfully"
        },
        // Unquoted, extractPlanFilePath truncates at the space and never matches here.
        [`terraform show -json ${generatedPlanFile}`]: {
            "code": 0,
            "stdout": "{\"format_version\":\"1.2\",\"terraform_version\":\"1.9.0\",\"resource_changes\":[]}"
        }
    }
}

tr.setAnswers(a);
tr.run();
