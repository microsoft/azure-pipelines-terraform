import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let tp = path.join(__dirname, './AzureInitSuccessAuthenticationSchemeManagedServiceIdentityAndDefaultSettingsL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'init');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('commandOptions', '');

tr.setInput('backendServiceArm', 'AzureRM');
tr.setInput('backendAzureRmResourceGroupName', 'DummyResourceGroup');
tr.setInput('backendAzureRmStorageAccountName', 'DummyStorageAccount');
tr.setInput('backendAzureRmContainerName', 'DummyContainer');
tr.setInput('backendAzureRmKey', 'DummyKey');
tr.setInput('backendAzureRmUseEnvironmentVariablesForAuthentication', 'true');
tr.setInput('backendAzureRmUseEntraIdForAuthentication', 'true');

process.env['ENDPOINT_AUTH_SCHEME_AzureRM'] = 'ManagedServiceIdentity';
process.env['ENDPOINT_DATA_AzureRM_SUBSCRIPTIONID'] = 'DummmySubscriptionId';
process.env['ENDPOINT_AUTH_PARAMETER_AzureRM_TENANTID'] = 'DummyTenantId';

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    "which": {
        "terraform": "terraform"
    },
    "checkPath": {
        "terraform": true
    },
    "exec": {
        "terraform init -input=false -backend-config=storage_account_name=DummyStorageAccount -backend-config=container_name=DummyContainer -backend-config=key=DummyKey -backend-config=resource_group_name=DummyResourceGroup -backend-config=subscription_id=DummmySubscriptionId -backend-config=tenant_id=DummyTenantId -backend-config=use_azuread_auth=true -backend-config=use_msi=true": {
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