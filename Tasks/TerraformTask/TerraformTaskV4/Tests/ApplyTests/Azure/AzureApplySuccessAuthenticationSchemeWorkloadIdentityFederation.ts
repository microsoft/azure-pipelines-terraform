import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
import { TokenGenerator } from "../../../src/id-token-generator";

let tp = path.join(__dirname, './AzureApplySuccessAuthenticationSchemeWorkloadIdentityFederationL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

// Mock the TokenGenerator class
tr.registerMock('../../../src/id-token-generator', {
    TokenGenerator: function() {
        return {
            generate: function() {
                console.log('Mocked token generator called');
                return Promise.resolve('DummyIdToken');
            }
        };
    },
    generateIdToken: function() {
        console.log('Mocked generateIdToken called');
        return Promise.resolve('DummyIdToken');
    }
});

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
tr.setInput('commandOptions', '');

tr.setInput('environmentServiceNameAzureRM', 'AzureRM');
tr.setInput('environmentServiceIdAzureRM', 'AzureRM');

process.env['ENDPOINT_AUTH_SCHEME_AzureRM'] = 'WorkloadIdentityFederation';
process.env['ENDPOINT_DATA_AzureRM_SUBSCRIPTIONID'] = 'DummmySubscriptionId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALID'] = 'DummyServicePrincipalId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_TENANTID'] = 'DummyTenantId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_IDTOKEN'] = 'DummyIdToken';

// Pre-set environment variables that would be set by the handler
process.env['ARM_CLIENT_ID'] = 'DummyServicePrincipalId';
process.env['ARM_TENANT_ID'] = 'DummyTenantId';
process.env['ARM_SUBSCRIPTION_ID'] = 'DummmySubscriptionId';
process.env['ARM_OIDC_TOKEN'] = 'DummyIdToken';
process.env['ARM_USE_OIDC'] = 'true';

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    "which": {
        "terraform": "terraform"
    },
    "checkPath": {
        "terraform": true
    },
    "exec": {
        "terraform apply -auto-approve -input=false": {
            "code": 0,
            "stdout": "Executed Successfully"
        },
        "terraform apply -input=false -auto-approve": {
            "code": 0,
            "stdout": "Executed Successfully"
        },
        "terraform apply -auto-approve": {
            "code": 0,
            "stdout": "Executed Successfully"
        },
        "terraform providers": {
            "code": 0,
            "stdout": "provider[registry.terraform.io/hashicorp/azurerm]"
        }
    }
}

tr.setAnswers(a);

tr.run();
