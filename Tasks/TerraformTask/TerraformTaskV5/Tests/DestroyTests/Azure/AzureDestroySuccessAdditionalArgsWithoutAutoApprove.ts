import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let tp = path.join(__dirname, './AzureDestroySuccessAdditionalArgsWithoutAutoApproveL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'destroy');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('environmentServiceNameAzureRM', 'AzureRM');
tr.setInput('commandOptions', '-no-color');

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
            "stdout": "provider[registry.terraform.io/hashicorp/azurerm]"
        },
        "terraform destroy -auto-approve -no-color": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform destroy -auto-approve -no-color -input=false": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform destroy -auto-approve -input=false -no-color": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform destroy -input=false -auto-approve -no-color": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform destroy -no-color -auto-approve -input=false": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform destroy -no-color -input=false -auto-approve": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform destroy -input=false -no-color -auto-approve": {
            "code": 0,
            "stdout": "Executed successfully"
        }
    }
}

tr.setAnswers(a);
tr.run();