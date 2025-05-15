import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let tp = path.join(__dirname, './AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationAndDefaultSettingsL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'init');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('commandOptions', '');

tr.setInput('backendServiceArm', 'AzureRM');
tr.setInput('backendAzureRmStorageAccountName', 'DummyStorageAccount');
tr.setInput('backendAzureRmContainerName', 'DummyContainer');
tr.setInput('backendAzureRmKey', 'DummyKey');
tr.setInput('backendAzureRmUseEntraIdForAuthentication', 'true');

process.env['ENDPOINT_AUTH_SCHEME_AzureRM'] = 'WorkloadIdentityFederation';
process.env['ENDPOINT_DATA_AzureRM_SUBSCRIPTIONID'] = 'DummmySubscriptionId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_SERVICEPRINCIPALID'] = 'DummyServicePrincipalId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_TENANTID'] = 'DummyTenantId';
process.env['ENDPOINT_AUTH_PARAMETER_SYSTEMVSSCONNECTION_ACCESSTOKEN'] = 'DummyAccessToken';

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    "which": {
        "terraform": "terraform"
    },
    "checkPath": {
        "terraform": true
    },
    "exec": {
        "terraform init -backend-config=storage_account_name=DummyStorageAccount -backend-config=container_name=DummyContainer -backend-config=key=DummyKey -backend-config=use_azuread_auth=true -backend-config=client_id=DummyServicePrincipalId -backend-config=use_oidc=true -backend-config=oidc_azure_service_connection_id=AzureRM": {
            "code": 0,
            "stdout": "Executed Successfully"
        }
    }
}

var mock = {
    "generateIdToken" : function(command) { return Promise.resolve('12345'); }
 }

tr.registerMock('./id-token-generator', mock);
tr.setAnswers(a);
tr.run();