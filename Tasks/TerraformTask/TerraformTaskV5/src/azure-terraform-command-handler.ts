import tasks = require('azure-pipelines-task-lib/task');
import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformAuthorizationCommandInitializer} from './terraform-commands';
import {BaseTerraformCommandHandler} from './base-terraform-command-handler';

export class TerraformCommandHandlerAzureRM extends BaseTerraformCommandHandler {
    constructor() {
        super();
        this.providerName = "azurerm";
    }

    private setupBackend(serviceConnectionName: string) {
        const authorizationScheme = this.mapAuthorizationScheme(tasks.getEndpointAuthorizationScheme(serviceConnectionName, true));

        tasks.debug('Setting up backend for authorization scheme: ' + authorizationScheme + '.');

        this.backendConfig.set('storage_account_name', tasks.getInput("backendAzureRmStorageAccountName", true));
        this.backendConfig.set('container_name', tasks.getInput("backendAzureRmContainerName", true));
        this.backendConfig.set('key', tasks.getInput("backendAzureRmKey", true));
        const resourceGroupName = tasks.getInput("backendAzureRmResourceGroupName", false);
        if(resourceGroupName != null && resourceGroupName != "") {
            this.backendConfig.set('resource_group_name', resourceGroupName);
        }
        const subscriptionId = tasks.getEndpointDataParameter(serviceConnectionName, "subscriptionid", true);
        if(subscriptionId) {
            process.env['ARM_SUBSCRIPTION_ID'] = subscriptionId;
        }
        process.env['ARM_TENANT_ID'] = tasks.getEndpointAuthorizationParameter(serviceConnectionName, "tenantid", false);

        const useEntraIdAuthentication = tasks.getInput("backendAzureRmUseEntraIdForAuthentication", false) == "true";

        if(useEntraIdAuthentication) {
            process.env['ARM_USE_AZUREAD_AUTH'] = 'true';
        }
        
        switch(authorizationScheme) {
            case AuthorizationScheme.ManagedServiceIdentity:
                process.env['ARM_USE_MSI'] = 'true';
                break;

            case AuthorizationScheme.WorkloadIdentityFederation:
                var workloadIdentityFederationCredentials = this.getWorkloadIdentityFederationCredentials(serviceConnectionName);
                process.env['ARM_CLIENT_ID'] = workloadIdentityFederationCredentials.servicePrincipalId;
                process.env['ARM_OIDC_AZURE_SERVICE_CONNECTION_ID'] = serviceConnectionName;
                process.env['ARM_USE_OIDC'] = 'true';
                break;
            
            case AuthorizationScheme.ServicePrincipal:
                tasks.warning('Client secret authentication is not secure and will be deprecated in the next major version of this task. Please use Workload identity federation authentication instead.');

                var servicePrincipalCredentials = this.getServicePrincipalCredentials(serviceConnectionName);
                process.env['ARM_CLIENT_ID'] = servicePrincipalCredentials.servicePrincipalId;
                process.env['ARM_CLIENT_SECRET'] = servicePrincipalCredentials.servicePrincipalKey;
                break;
        }

        tasks.debug('Finished up backend for authorization scheme: ' + authorizationScheme + '.');
    }

    public async handleBackend(terraformToolRunner: ToolRunner): Promise<void> {
        let serviceConnectionName = tasks.getInput("backendServiceArm", true);
        this.setupBackend(serviceConnectionName);

        for (let [key, value] of this.backendConfig.entries()) {
            terraformToolRunner.arg(`-backend-config=${key}=${value}`);
        }
    }

    public async handleProvider(command: TerraformAuthorizationCommandInitializer) : Promise<void> {
        if (command.serviceProvidername) {
            var serviceConnection = tasks.getInput("environmentServiceNameAzureRM", true);
            const authorizationScheme = this.mapAuthorizationScheme(tasks.getEndpointAuthorizationScheme(serviceConnection, true));

            tasks.debug('Setting up provider for authorization scheme: ' + authorizationScheme + '.');

            const subscriptionId = tasks.getEndpointDataParameter(command.serviceProvidername, "subscriptionid", true);
            if(subscriptionId) {
                process.env['ARM_SUBSCRIPTION_ID']  = tasks.getEndpointDataParameter(command.serviceProvidername, "subscriptionid", false);
            }
            process.env['ARM_TENANT_ID'] = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "tenantid", false);

            switch(authorizationScheme) {
                case AuthorizationScheme.ManagedServiceIdentity:
                    process.env['ARM_USE_MSI'] = 'true';
                    break;
    
                case AuthorizationScheme.WorkloadIdentityFederation:
                    var workloadIdentityFederationCredentials = this.getWorkloadIdentityFederationCredentials(command.serviceProvidername);
                    process.env['ARM_CLIENT_ID'] = workloadIdentityFederationCredentials.servicePrincipalId;
                    process.env['ARM_OIDC_AZURE_SERVICE_CONNECTION_ID'] = serviceConnection;
                    process.env['ARM_USE_OIDC'] = 'true';
                    break;

                case AuthorizationScheme.ServicePrincipal:
                    tasks.warning('Client secret authentication is not secure and will be deprecated in the next major version of this task. Please use Workload identity federation authentication instead.');

                    var servicePrincipalCredentials = this.getServicePrincipalCredentials(command.serviceProvidername);
                    process.env['ARM_CLIENT_ID'] = servicePrincipalCredentials.servicePrincipalId;
                    process.env['ARM_CLIENT_SECRET'] = servicePrincipalCredentials.servicePrincipalKey;
                    break;
            }

            tasks.debug('Finished up provider for authorization scheme: ' + authorizationScheme + '.');
        }
    }

    private getServicePrincipalCredentials(connectionName: string) : ServicePrincipalCredentials {
        let servicePrincipalCredentials : ServicePrincipalCredentials = {
            servicePrincipalId: tasks.getEndpointAuthorizationParameter(connectionName, "serviceprincipalid", true),
            servicePrincipalKey: tasks.getEndpointAuthorizationParameter(connectionName, "serviceprincipalkey", true)
        }
        return servicePrincipalCredentials;
    }

    private getWorkloadIdentityFederationCredentials(connectionName: string) : WorkloadIdentityFederationCredentials {
        let workloadIdentityFederationCredentials : WorkloadIdentityFederationCredentials = {
            servicePrincipalId: tasks.getEndpointAuthorizationParameter(connectionName, "serviceprincipalid", true),
        }
        return workloadIdentityFederationCredentials;
    }

    private mapAuthorizationScheme(authorizationScheme: string) : AuthorizationScheme {
        if(authorizationScheme == undefined) {
            tasks.warning('The authorization scheme could not be found for your Service Connection, using Workload identity federation by default, but this could cause issues.');
            return AuthorizationScheme.WorkloadIdentityFederation;
        }

        if(authorizationScheme.toLowerCase() == AuthorizationScheme.ServicePrincipal) {
            return AuthorizationScheme.ServicePrincipal;
        }

        if(authorizationScheme.toLowerCase() == AuthorizationScheme.ManagedServiceIdentity) {
            return AuthorizationScheme.ManagedServiceIdentity;
        }

        if(authorizationScheme.toLowerCase() == AuthorizationScheme.WorkloadIdentityFederation) {
            return AuthorizationScheme.WorkloadIdentityFederation;
        }

        tasks.debug('No matching authorization scheme was found, using ServicePrincipal by default, but this could cause issues.');
        return AuthorizationScheme.ServicePrincipal;
    }
}

interface ServicePrincipalCredentials {
    servicePrincipalId: string;
    servicePrincipalKey: string;
}

interface WorkloadIdentityFederationCredentials {
    servicePrincipalId: string;
}

enum AuthorizationScheme {
    ServicePrincipal = "serviceprincipal",
    ManagedServiceIdentity = "managedserviceidentity",
    WorkloadIdentityFederation = "workloadidentityfederation"
}
