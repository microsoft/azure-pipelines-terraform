import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
import os = require('os');

let tp = path.join(__dirname, './AzureShowFileOutputShowFailureL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'show');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('environmentServiceNameAzureRM', 'AzureRM');
tr.setInput('outputTo', 'file');
tr.setInput('outputFormat', 'json');
tr.setInput('fileName', path.join(os.tmpdir(), 'terraform-show-file-output-failure-test.json'));

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
        // Partial stdout: what terraform emits before failing to read the plan file.
        "terraform show -json": {
            "code": 1,
            "stdout": "{\"format_ver",
            "stderr": "Error: Failed to read the given plan file"
        }
    }
}

tr.setAnswers(a);
tr.run();
