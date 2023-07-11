import tasks = require('azure-pipelines-task-lib/task');
import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformAuthorizationCommandInitializer} from './terraform-commands';
import {BaseTerraformCommandHandler} from './base-terraform-command-handler';
import { getHandlerFromToken, WebApi } from "azure-devops-node-api";
import { ITaskApi } from "azure-devops-node-api/TaskApi";

export class TerraformCommandHandlerAzureRM extends BaseTerraformCommandHandler {
    constructor() {
        super();
        this.providerName = "azurerm";
    }

    backendIdToken: string;
    environmentIdToken: string;

    private async setupBackend(backendServiceName: string) : Promise<void> {
        const authorizationScheme = AuthorizationScheme[tasks.getEndpointAuthorizationScheme(tasks.getInput("backendServiceArm", true), false)];

        tasks.debug('Setting up provider for authorization scheme: ' + authorizationScheme + '.');

        this.backendConfig.set('storage_account_name', tasks.getInput("backendAzureRmStorageAccountName", true));
        this.backendConfig.set('container_name', tasks.getInput("backendAzureRmContainerName", true));
        this.backendConfig.set('key', tasks.getInput("backendAzureRmKey", true));
        this.backendConfig.set('resource_group_name', tasks.getInput("backendAzureRmResourceGroupName", true));
        this.backendConfig.set('subscription_id', tasks.getEndpointDataParameter(backendServiceName, "subscriptionid", true));
        this.backendConfig.set('tenant_id', tasks.getEndpointAuthorizationParameter(backendServiceName, "tenantid", true));

        switch(authorizationScheme) {
            case AuthorizationScheme.ServicePrincipal:
                var servicePrincipalCredentials : ServicePrincipalCredentials = this.getServicePrincipalCredentials(backendServiceName);
                this.backendConfig.set('client_id', servicePrincipalCredentials.servicePrincipalId);
                this.backendConfig.set('client_secret', servicePrincipalCredentials.servicePrincipalKey);
                break;

            case AuthorizationScheme.ManagedServiceIdentity:
                this.backendConfig.set('use_msi', 'true');
                break;

            case AuthorizationScheme.WorkloadIdentityFederation:
                var workloadIdentityFederationCredentials = await this.getWorkloadIdentityFederationCredentials(backendServiceName);
                this.backendConfig.set('client_id', workloadIdentityFederationCredentials.servicePrincipalId);
                this.backendConfig.set('oidc_token', workloadIdentityFederationCredentials.idToken);
                this.backendConfig.set('use_oidc', 'true');
                break;
        }
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
            const authorizationScheme  = AuthorizationScheme[tasks.getEndpointAuthorizationScheme(tasks.getInput("environmentServiceNameAzureRM", true), false)];

            tasks.debug('Setting up provider for authorization scheme: ' + authorizationScheme + '.');

            process.env['ARM_SUBSCRIPTION_ID']  = tasks.getEndpointDataParameter(command.serviceProvidername, "subscriptionid", false);
            process.env['ARM_TENANT_ID']        = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "tenantid", false);

            switch(authorizationScheme) {
                case AuthorizationScheme.ServicePrincipal:
                    var servicePrincipalCredentials = this.getServicePrincipalCredentials(command.serviceProvidername);
                    process.env['ARM_CLIENT_ID'] = servicePrincipalCredentials.servicePrincipalId;
                    process.env['ARM_CLIENT_SECRET'] = servicePrincipalCredentials.servicePrincipalKey;
                    break;
    
                case AuthorizationScheme.ManagedServiceIdentity:
                    process.env['ARM_USE_MSI'] = 'true';
                    break;
    
                case AuthorizationScheme.WorkloadIdentityFederation:
                    var workloadIdentityFederationCredentials = await this.getWorkloadIdentityFederationCredentials(command.serviceProvidername);
                    process.env['ARM_CLIENT_ID'] = workloadIdentityFederationCredentials.servicePrincipalId;
                    process.env['ARM_OIDC_TOKEN'] = workloadIdentityFederationCredentials.idToken;
                    process.env['ARM_USE_OIDC'] = 'true';
                    break;
            }
        }
    }

    private getServicePrincipalCredentials(connectionName: string) : ServicePrincipalCredentials {
        var servicePrincipalCredentials : ServicePrincipalCredentials;
        servicePrincipalCredentials.servicePrincipalId = tasks.getEndpointAuthorizationParameter(connectionName, "serviceprincipalid", true);
        servicePrincipalCredentials.servicePrincipalKey = tasks.getEndpointAuthorizationParameter(connectionName, "serviceprincipalkey", true);
        return servicePrincipalCredentials;
    }

    private async getWorkloadIdentityFederationCredentials(connectionName: string) : Promise<WorkloadIdentityFederationCredentials> {
        var workloadIdentityFederationCredentials : WorkloadIdentityFederationCredentials;
        workloadIdentityFederationCredentials.servicePrincipalId = tasks.getEndpointAuthorizationParameter(connectionName, "serviceprincipalid", true);
        workloadIdentityFederationCredentials.idToken = await this.getIdToken(connectionName)
        return workloadIdentityFederationCredentials;
    }

    private async getIdToken(connectedService: string) : Promise<string> {
        const jobId = tasks.getVariable("System.JobId");
        const planId = tasks.getVariable("System.PlanId");
        const projectId = tasks.getVariable("System.TeamProjectId");
        const hub = tasks.getVariable("System.HostType");
        const uri = tasks.getVariable("System.CollectionUri");
        const token = this.getSystemAccessToken();

        const authHandler = getHandlerFromToken(token);
        const connection = new WebApi(uri, authHandler);
        const api: ITaskApi = await connection.getTaskApi();
        const response = await api.createOidcToken({}, projectId, hub, planId, jobId, connectedService);
        if (response == null) {
            return null;
        }

        return response.oidcToken;
    }

    private getSystemAccessToken() : string {
        tasks.debug('Getting credentials for local feeds');
        const auth = tasks.getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
        if (auth.scheme === 'OAuth') {
            tasks.debug('Got auth token');
            return auth.parameters['AccessToken'];
        }
        else {
            tasks.warning('Could not determine credentials to use');
        }
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