# Terraform : Provision infrastructure on Azure, Amazon Web Services(AWS) and Google Cloud Platform(GCP) using the terraform command-line


## Overview

This task enables running Terraform commands as part of Azure Build and Release Pipelines. It supports the following Terraform commands
- init
- validate
- plan
- apply
- destroy
- show
- output
- custom

The following providers are currently supported:
- AzureRM
- Amazon Web Services
- Google Cloud Platform


## Contact Information 
 
Please report a problem at [Developer Community Forum](https://developercommunity.visualstudio.com/spaces/21/index.html) if you are facing problems in making this task work.  You can also share feedback about the task like, what more functionality should be added to the task, what other tasks you would like to have, at the same place.


## Pre-requisites for the task


The only pre-requisite for the task is that Terraform must be installed on the Azure Pipelines build agent. If you want an exact version of Terraform on the agent then you can use the [Terraform tool installer task](https://aka.ms/AAf1a0p). Terraform Task V3 only supports `terraform >= 0.12`.


## Parameters of the task

- **Display name\*:** Provide a name to identify the task among others in your pipeline.

- **Provider\*:** Select the provider in which your resources will be managed by Terraform. Currently, the following providers are supported:
	- azurerm
	- aws
	- gcp

- **Command\*:** Select the terraform command to execute. Currently, the following commands are supported: 
	- init
    - validate
    - plan
    - apply
    - destroy
	- show
    - output
    - custom

- **Configuration directory\*:** Select the directory that contains all the relevant terraform config (.tf) files. The task intends to use Terraform to build infrastructure on one provider at a time. So, all the config files in the configuration directory together should not specify more than one provider.

- **Additional command arguments\*:** Provide any additional arguments for the selected command either as key-value pairs(-key=value) or as command line flags(-flag). Multiple options can also be provided delimited by spaces(-key1=value1 -key2=value2 -flag1 -flag2).

Examples:
	- -out=tfplan (for terraform plan)
	- tfplan -auto-approve (for terraform apply)

Options specific to **terraform init** command

- Options specific to **AzureRM backend configuration**
	- **Azure subscription\*:** Select the Azure subscription to use for AzureRM backend configuration
	- **Resource group\*:** Select the name of the resource group in which you want to store the terraform remote state file
	- **Storage account\*:** Select the name of the storage account belonging to the selected resource group in which you want to store the terrafor remote state file
	- **Container\*:** Select the name of the Azure Blob container belonging to the storage account in which you want to store the terrafor remote state file
	- **Key\*:** Specify the relative path to the state file inside the selected container. For example, if you want to store the state file, named terraform.tfstate, inside a folder, named tf, then give the input "tf/terraform.tfstate"

- Options specific to **Amazon Web Services(AWS) backend configuration**
	- **Amazon Web Services connection\*:** Select the AWS connection to use for AWS backend configuration
	- **Bucket\*:** Select the name of the Amazon S3 bucket in which you want to store the terraform remote state file
	- **Key\*:** Specify the relative path to the state file inside the selected S3 bucket. For example, if you want to store the state file, named terraform.tfstate, inside a folder, named tf, then give the input "tf/terraform.tfstate"

- Options specific to **Google Cloud Platform(GCP) backend configuration**
	- **Google Cloud Platform connection\*:** Select the GCP connection to use for GCP backend configuration
	- **Bucket\*:** Select the name of the GCP storage bucket in which you want to store the terraform remote state file
	- **Prefix of state file:** Specify the relative path to the state file inside the GCP bucket. For example, if you give the input as "terraform", then the state file, named default.tfstate, will be stored inside an object called terraform.

Options specific to **terraform plan, apply, show, output, custom and destroy** commands

- **Azure subscription (only if "azurerm" provider is selected)\*:** Select the AzureRM subscription to use for managing the resources used by the plan, apply, show, output, custom and destroy commands
- **Amazon Web Services connection (only if "aws" provider is selected)\*:** Select the AWS connection to use for managing the resources used by the plan, apply, show, output, custom and destroy commands
- **Google Cloud Platform connection (only if "gcp" provider is selected)\*:** Select the GCP connection to use for managing the resources used by the plan, apply, show, output, custom and destroy commands

Options specific to  **show**  
- **outputTo\*:** (console or file). You can choose to save output to file or only show output in console (i.e log) 
- **outputFormat\*:** (json or default) . Output in json or default format

Options specific to  **custom**  
When selecting custom you can use any command that is supported natively by terraform.
- **customCommand\*:** pass any command that is supported natively by terraform
- **outputTo\*:** (console or file).You can choose to save output to file or only show output in console (i.e log)

## Output Variables
* **changesPresent:** This varaible is set to true if the plan command finds changes to apply. Can be used by subsequent tasks. Give the producing task a reference name. Then, in a downstream step, you can use the form $(\<ReferenceName\>.changesPresent) to refer to it.

* **customFilePath:** This variable refers to the location of the file that was created with use of the 'custom' command. <br><br>Note: This variable will only be set if 'command' input is set to 'custom' and if you select **outputTo\*:** 'file'.

* **showFilePath:** This variable refers to the location of the file that was created. This file can be used by tasks which are written for tools such as [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/terraform/)<br><br>Note: This variable will only be set if 'command' input is set to 'show'.
* **jsonOutputVariablesPath:** The location of the JSON file which contains the output variables set by the user in the terraform config files.<br><br>Note: This variable will only be set if 'command' input is set to 'output'.

## Example Task Usage
Below is a basic example usage of a few commands within the TerraformTaskV3 task.

```yaml
- task: TerraformTaskV3@3
  displayName: Initialize Terraform
  inputs:
    provider: 'azurerm'
    command: 'init'
    backendServiceArm: 'your-service-connection'
    backendAzureRmResourceGroupName: 'your-rg-name'
    backendAzureRmStorageAccountName: 'your-stg-name'
    backendAzureRmContainerName: 'your-container-name'
    backendAzureRmKey: 'state.tfstate'

- task: TerraformTaskV3@3
  name: terraformPlan
  displayName: Create Terraform Plan
  inputs:
    provider: 'azurerm'
    command: 'plan'
    commandOptions: '-out main.tfplan'
    environmentServiceNameAzureRM: 'your-service-connection'

# Only runs if the 'terraformPlan' task has detected changes the in state. 
- task: TerraformTaskV3@3
  displayName: Apply Terraform Plan
  condition: eq(variables['terraformPlan.changesPresent'], 'true')
  inputs:
    provider: 'azurerm'
    command: 'apply'
    commandOptions: 'main.tfplan'
    environmentServiceNameAzureRM: 'your-service-connection'
```
