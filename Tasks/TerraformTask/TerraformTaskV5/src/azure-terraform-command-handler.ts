import tasks = require("azure-pipelines-task-lib/task");
import {ToolRunner} from "azure-pipelines-task-lib/toolrunner";
import {TerraformAuthorizationCommandInitializer} from "./terraform-commands";
import {BaseTerraformCommandHandler} from "./base-terraform-command-handler";
import {EnvironmentVariableHelper} from "./environment-variables";
import {generateIdToken} from './id-token-generator';

export class TerraformCommandHandlerAzureRM extends BaseTerraformCommandHandler {
    constructor() {
        super();
        this.providerName = "azurerm";
    }

    public async handleBackend(terraformToolRunner: ToolRunner): Promise<void> {
        let serviceConnectionID = tasks.getInput("backendServiceArm", true);
        const authorizationScheme = this.mapAuthorizationScheme(tasks.getEndpointAuthorizationScheme(serviceConnectionID, true));

        tasks.debug("Setting up backend for authorization scheme: " + authorizationScheme + ".");

        // Setup required backend configuration for storage account blob location
        this.backendConfig.set("storage_account_name", tasks.getInput("backendAzureRmStorageAccountName", true));
        this.backendConfig.set("container_name", tasks.getInput("backendAzureRmContainerName", true));
        this.backendConfig.set("key", tasks.getInput("backendAzureRmKey", true));

        // Setup the optional backend configuration for the storage account blob location with subscription ID and resource group name (set as backend config to ensure it is cached)
        const resourceGroupName = tasks.getInput("backendAzureRmResourceGroupName", false);
        if(resourceGroupName != null && resourceGroupName != "") {
            this.backendConfig.set("resource_group_name", resourceGroupName);
        }

        let subscriptionId = tasks.getInput("backendAzureRmOverrideSubscriptionID", false);
        if(subscriptionId == null || subscriptionId == "") {
            subscriptionId = tasks.getEndpointDataParameter(serviceConnectionID, "subscriptionid", true);
        }
        if(subscriptionId != null && subscriptionId != "" && resourceGroupName != null && resourceGroupName != "") {
            this.backendConfig.set("subscription_id", subscriptionId);
        }

        // Setup Entra ID authentication (set as backend config to ensure it is cached)
        const useEntraIdAuthentication = tasks.getBoolInput("backendAzureRmUseEntraIdForAuthentication", false);
        if(useEntraIdAuthentication) {
            this.backendConfig.set("use_azuread_auth", "true");
        }

        let fallbackToIdTokenGeneration = tasks.getBoolInput("backendAzureRmUseIdTokenGeneration", false);
        let backendAzureRmUseCliFlagsForAuthentication = tasks.getBoolInput("backendAzureRmUseCliFlagsForAuthentication", false);

        await this.setCommonVariables(authorizationScheme, serviceConnectionID, fallbackToIdTokenGeneration, backendAzureRmUseCliFlagsForAuthentication);

        for (let [key, value] of this.backendConfig.entries()) {
            terraformToolRunner.arg(`-backend-config=${key}=${value}`);
        }

        tasks.debug("Finished setting up backend for authorization scheme: " + authorizationScheme + ".");
    }

    public async handleProvider(command: TerraformAuthorizationCommandInitializer) : Promise<void> {
        var serviceConnectionID = tasks.getInput("environmentServiceNameAzureRM", true);
        const authorizationScheme = this.mapAuthorizationScheme(tasks.getEndpointAuthorizationScheme(serviceConnectionID, true));

        tasks.debug("Setting up provider for authorization scheme: " + authorizationScheme + ".");

        // Setup required provider configuration for subscription ID
        let subscriptionId = tasks.getInput("environmentAzureRmOverrideSubscriptionID", false);
        if(subscriptionId == null || subscriptionId == "") {
            subscriptionId = tasks.getEndpointDataParameter(serviceConnectionID, "subscriptionid", true);
        }
        if(subscriptionId != null && subscriptionId != "") {
            EnvironmentVariableHelper.setEnvironmentVariable("ARM_SUBSCRIPTION_ID", subscriptionId);
        }

        let fallbackToIdTokenGeneration = tasks.getBoolInput("environmentAzureRmUseIdTokenGeneration", false);

        await this.setCommonVariables(authorizationScheme, serviceConnectionID, fallbackToIdTokenGeneration, false);

        tasks.debug("Finished up provider for authorization scheme: " + authorizationScheme + ".");
    }

    private async setCommonVariables(authorizationScheme: AuthorizationScheme, serviceConnectionID: string, fallbackToIdTokenGeneration: boolean, useCliFlagsForBackend: boolean) : Promise<void> {
        EnvironmentVariableHelper.setEnvironmentVariable("ARM_TENANT_ID", tasks.getEndpointAuthorizationParameter(serviceConnectionID, "tenantid", false));

        switch(authorizationScheme) {
            case AuthorizationScheme.ManagedServiceIdentity:
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_USE_MSI", "true");
                break;

            case AuthorizationScheme.WorkloadIdentityFederation:
                var workloadIdentityFederationCredentials = await this.getWorkloadIdentityFederationCredentials(serviceConnectionID, fallbackToIdTokenGeneration);
                if(useCliFlagsForBackend) {
                    // By persisting the client ID in the backend config, we can support multiple service connections for backend and provider auth.
                    this.backendConfig.set("client_id", workloadIdentityFederationCredentials.servicePrincipalId);
                    this.backendConfig.set("use_oidc", "true");
                } else {
                    EnvironmentVariableHelper.setEnvironmentVariable("ARM_CLIENT_ID", workloadIdentityFederationCredentials.servicePrincipalId);
                    EnvironmentVariableHelper.setEnvironmentVariable("ARM_USE_OIDC", "true");
                }

                if (fallbackToIdTokenGeneration) {
                    tasks.debug("ID token generation fallback is enabled, generating ID Token.");
                    EnvironmentVariableHelper.setEnvironmentVariable("ARM_OIDC_TOKEN", workloadIdentityFederationCredentials.oidcToken);
                } else {
                    tasks.debug("ID token generation fallback is disabled, using ID Token Refresh.");
                    if(useCliFlagsForBackend) {
                        // By persisting the service connection ID in the backend config, we can support multiple service connections for backend and provider auth.
                        this.backendConfig.set("ado_pipeline_service_connection_id", serviceConnectionID);
                    } else {
                        EnvironmentVariableHelper.setEnvironmentVariable("ARM_OIDC_AZURE_SERVICE_CONNECTION_ID", serviceConnectionID);
                    }
                    EnvironmentVariableHelper.setEnvironmentVariable("ARM_OIDC_REQUEST_TOKEN", tasks.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false));
                }

                break;

            case AuthorizationScheme.ServicePrincipal:
                tasks.warning("Client secret authentication is not secure and will be deprecated in the next major version of this task. Please use Workload identity federation authentication instead.");

                var servicePrincipalCredentials = this.getServicePrincipalCredentials(serviceConnectionID);
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_CLIENT_ID", servicePrincipalCredentials.servicePrincipalId);
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_CLIENT_SECRET", servicePrincipalCredentials.servicePrincipalKey);
                break;
        }
    }

    private getServicePrincipalCredentials(serviceConnectionID: string) : ServicePrincipalCredentials {
        let servicePrincipalCredentials : ServicePrincipalCredentials = {
            servicePrincipalId: tasks.getEndpointAuthorizationParameter(serviceConnectionID, "serviceprincipalid", true),
            servicePrincipalKey: tasks.getEndpointAuthorizationParameter(serviceConnectionID, "serviceprincipalkey", true)
        }
        return servicePrincipalCredentials;
    }

    private async getWorkloadIdentityFederationCredentials(serviceConnectionID: string, getIdToken: boolean) : Promise<WorkloadIdentityFederationCredentials> {
        let workloadIdentityFederationCredentials : WorkloadIdentityFederationCredentials = {
            servicePrincipalId: tasks.getEndpointAuthorizationParameter(serviceConnectionID, "serviceprincipalid", true),
            oidcToken: ""
        }
        if(getIdToken) {
            workloadIdentityFederationCredentials.oidcToken = await generateIdToken(serviceConnectionID);
        }
        return workloadIdentityFederationCredentials;
    }

    private mapAuthorizationScheme(authorizationScheme: string) : AuthorizationScheme {
        if(authorizationScheme == undefined) {
            tasks.warning("The authorization scheme could not be found for your Service Connection, using Workload identity federation by default, but this could cause issues.");
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

        tasks.debug("No matching authorization scheme was found, using ServicePrincipal by default, but this could cause issues.");
        return AuthorizationScheme.ServicePrincipal;
    }
}

interface ServicePrincipalCredentials {
    servicePrincipalId: string;
    servicePrincipalKey: string;
}

interface WorkloadIdentityFederationCredentials {
    servicePrincipalId: string;
    oidcToken: string;
}

enum AuthorizationScheme {
    ServicePrincipal = "serviceprincipal",
    ManagedServiceIdentity = "managedserviceidentity",
    WorkloadIdentityFederation = "workloadidentityfederation"
}
