import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let tp = path.join(__dirname, './AzureApplySuccessAuthenticationSchemeWorkloadIdentityFederationL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

// Mock the azure-pipelines-tasks-artifacts-common/webapi module
tr.registerMock('azure-pipelines-tasks-artifacts-common/webapi', {
    getFederatedToken: function() {
        console.log('Mocked getFederatedToken called');
        return Promise.resolve('DummyFederatedToken');
    }
});

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'apply');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('environmentServiceNameAzureRM', 'AzureRM');
tr.setInput('commandOptions', '');

process.env['ENDPOINT_AUTH_SCHEME_AzureRM'] = 'WorkloadIdentityFederation';
process.env['ENDPOINT_DATA_AzureRM_SUBSCRIPTIONID'] = 'DummmySubscriptionId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_TENANTID'] = 'DummyTenantId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALID'] = 'DummyServicePrincipalId';
process.env['ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN'] = 'DummyAccessToken';

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
        "terraform apply -auto-approve -input=false": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform apply -input=false -auto-approve": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform apply -auto-approve": {
            "code": 0,
            "stdout": "Executed successfully"
        }
    }
}

tr.setAnswers(a);
tr.run();