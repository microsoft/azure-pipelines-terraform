import tasks = require("azure-pipelines-task-lib/task");
import {ToolRunner} from "azure-pipelines-task-lib/toolrunner";
import {TerraformAuthorizationCommandInitializer} from "./terraform-commands";
import {BaseTerraformCommandHandler} from "./base-terraform-command-handler";
import {EnvironmentVariableHelper} from "./environment-variables";

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

        // Setup the optional backend configuration for the storage account blob location with subscription and resource group
        const resourceGroupName = tasks.getInput("backendAzureRmResourceGroupName", false);
        if(resourceGroupName != null && resourceGroupName != "") {
            this.backendConfig.set("resource_group_name", resourceGroupName);
        }
        const subscriptionId = tasks.getEndpointDataParameter(serviceConnectionID, "subscriptionid", true);
        if(subscriptionId != null && subscriptionId != "" && resourceGroupName != null && resourceGroupName != "") {
            EnvironmentVariableHelper.setEnvironmentVariable("ARM_SUBSCRIPTION_ID", subscriptionId);
        }

        // Setup Entra ID authentication
        const useEntraIdAuthentication = tasks.getBoolInput("backendAzureRmUseEntraIdForAuthentication", false);
        if(useEntraIdAuthentication) {
            EnvironmentVariableHelper.setEnvironmentVariable("ARM_USE_AZUREAD", "true");
        }

        this.setCommonEnvironmentVariables(authorizationScheme, serviceConnectionID);

        for (let [key, value] of this.backendConfig.entries()) {
            terraformToolRunner.arg(`-backend-config=${key}=${value}`);
        }

        tasks.debug("Finished setting up backend for authorization scheme: " + authorizationScheme + ".");
    }

    public async handleProvider(command: TerraformAuthorizationCommandInitializer) : Promise<void> {
        var serviceConnectionID = tasks.getInput("environmentServiceNameAzureRM", true);
        const authorizationScheme = this.mapAuthorizationScheme(tasks.getEndpointAuthorizationScheme(serviceConnectionID, true));

        tasks.debug("Setting up provider for authorization scheme: " + authorizationScheme + ".");

        const subscriptionId = tasks.getEndpointDataParameter(serviceConnectionID, "subscriptionid", true);
        if(subscriptionId != null && subscriptionId != "") {
            EnvironmentVariableHelper.setEnvironmentVariable("ARM_SUBSCRIPTION_ID", subscriptionId);
        }

        this.setCommonEnvironmentVariables(authorizationScheme, serviceConnectionID);

        tasks.debug("Finished up provider for authorization scheme: " + authorizationScheme + ".");
    }

    private setCommonEnvironmentVariables(authorizationScheme: AuthorizationScheme, serviceConnectionID: string) {
        EnvironmentVariableHelper.setEnvironmentVariable("ARM_TENANT_ID", tasks.getEndpointAuthorizationParameter(serviceConnectionID, "tenantid", false));

        switch(authorizationScheme) {
            case AuthorizationScheme.ManagedServiceIdentity:
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_USE_MSI", "true");
                break;

            case AuthorizationScheme.WorkloadIdentityFederation:
                var workloadIdentityFederationCredentials = this.getWorkloadIdentityFederationCredentials(serviceConnectionID);
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_CLIENT_ID", workloadIdentityFederationCredentials.servicePrincipalId);
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_OIDC_AZURE_SERVICE_CONNECTION_ID", serviceConnectionID);
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_USE_OIDC", "true");
                const systemAccessToken = tasks.getVariable("System.AccessToken");
                tasks.setSecret(systemAccessToken);
                EnvironmentVariableHelper.setEnvironmentVariable("SYSTEM_ACCESSTOKEN", systemAccessToken);
                break;

            case AuthorizationScheme.ServicePrincipal:
                tasks.warning("Client secret authentication is not secure and will be deprecated in the next major version of this task. Please use Workload identity federation authentication instead.");

                var servicePrincipalCredentials = this.getServicePrincipalCredentials(serviceConnectionID);
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_CLIENT_ID", servicePrincipalCredentials.servicePrincipalId);
                EnvironmentVariableHelper.setEnvironmentVariable("ARM_CLIENT_SECRET", servicePrincipalCredentials.servicePrincipalKey);
                break;
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
}

enum AuthorizationScheme {
    ServicePrincipal = "serviceprincipal",
    ManagedServiceIdentity = "managedserviceidentity",
    WorkloadIdentityFederation = "workloadidentityfederation"
}
