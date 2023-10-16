import tasks = require('azure-pipelines-task-lib/task');
import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformAuthorizationCommandInitializer} from './terraform-commands';
import {BaseTerraformCommandHandler} from './base-terraform-command-handler';
import {generateIdToken} from './id-token-generator';

export class TerraformCommandHandlerAzureRM extends BaseTerraformCommandHandler {
    constructor() {
        super();
        this.providerName = "azurerm";
    }

    backendIdToken: string;
    environmentIdToken: string;

    private async setupBackend(backendServiceName: string) : Promise<void> {
        const authorizationScheme = this.mapAuthorizationScheme(tasks.getEndpointAuthorizationScheme(tasks.getInput("backendServiceArm", true), true));

        tasks.debug('Setting up backend for authorization scheme: ' + authorizationScheme + '.');

        this.backendConfig.set('storage_account_name', tasks.getInput("backendAzureRmStorageAccountName", true));
        this.backendConfig.set('container_name', tasks.getInput("backendAzureRmContainerName", true));
        this.backendConfig.set('key', tasks.getInput("backendAzureRmKey", true));
        this.backendConfig.set('resource_group_name', tasks.getInput("backendAzureRmResourceGroupName", true));
        const subscriptionId = tasks.getEndpointDataParameter(backendServiceName, "subscriptionid", true);
        if(subscriptionId) {
            this.backendConfig.set('subscription_id', tasks.getEndpointDataParameter(backendServiceName, "subscriptionid", true));
        }
        this.backendConfig.set('tenant_id', tasks.getEndpointAuthorizationParameter(backendServiceName, "tenantid", true));

        switch(authorizationScheme) {
            case AuthorizationScheme.ManagedServiceIdentity:
                this.backendConfig.set('use_msi', 'true');
                break;

            case AuthorizationScheme.WorkloadIdentityFederation:
                var workloadIdentityFederationCredentials = await this.getWorkloadIdentityFederationCredentials(backendServiceName);
                this.backendConfig.set('client_id', workloadIdentityFederationCredentials.servicePrincipalId);
                this.backendConfig.set('oidc_token', workloadIdentityFederationCredentials.idToken);
                this.backendConfig.set('use_oidc', 'true');
                break;
            
            case AuthorizationScheme.ServicePrincipal:
                var servicePrincipalCredentials = this.getServicePrincipalCredentials(backendServiceName);
                this.backendConfig.set('client_id', servicePrincipalCredentials.servicePrincipalId);
                this.backendConfig.set('client_secret', servicePrincipalCredentials.servicePrincipalKey);
                break;
        }

        tasks.debug('Finished up backend for authorization scheme: ' + authorizationScheme + '.');
    }

    public async handleBackend(terraformToolRunner: ToolRunner): Promise<void> {
        let backendServiceName = tasks.getInput("backendServiceArm", true);
        await this.setupBackend(backendServiceName);

        for (let [key, value] of this.backendConfig.entries()) {
            terraformToolRunner.arg(`-backend-config=${key}=${value}`);
        }
    }

    public async handleProvider(command: TerraformAuthorizationCommandInitializer) : Promise<void> {
        if (command.serviceProvidername) {
            const authorizationScheme = this.mapAuthorizationScheme(tasks.getEndpointAuthorizationScheme(tasks.getInput("environmentServiceNameAzureRM", true), true));

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
                    var workloadIdentityFederationCredentials = await this.getWorkloadIdentityFederationCredentials(command.serviceProvidername);
                    process.env['ARM_CLIENT_ID'] = workloadIdentityFederationCredentials.servicePrincipalId;
                    process.env['ARM_OIDC_TOKEN'] = workloadIdentityFederationCredentials.idToken;
                    process.env['ARM_USE_OIDC'] = 'true';
                    break;

                case AuthorizationScheme.ServicePrincipal:
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

    private async getWorkloadIdentityFederationCredentials(connectionName: string) : Promise<WorkloadIdentityFederationCredentials> {       
        let workloadIdentityFederationCredentials : WorkloadIdentityFederationCredentials = {
            servicePrincipalId: tasks.getEndpointAuthorizationParameter(connectionName, "serviceprincipalid", true),
            idToken: await generateIdToken(connectionName)
        }
        return workloadIdentityFederationCredentials;
    }

    private mapAuthorizationScheme(authorizationScheme: string) : AuthorizationScheme {
        if(authorizationScheme == undefined) {
            tasks.debug('The authorization scheme is missing, using ServicePrincipal by default, but this could cause issues.');
            return AuthorizationScheme.ServicePrincipal;
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
    idToken: string;
}

enum AuthorizationScheme {
    ServicePrincipal = "serviceprincipal",
    ManagedServiceIdentity = "managedserviceidentity",
    WorkloadIdentityFederation = "workloadidentityfederation"   
}