## About Terraform

Terraform is an open-source tool created by HashiCorp for developing, changing and versioning infrastructure safely and efficiently. It provides a service known as "Infrastructure as Code" which enables users to define and provision infrastructure using a high-level configuration language.

## About the Terraform extension

This extension provides the following components:
- A service connection for connecting to an Amazon Web Services(AWS) account
- A service connection for connecting to a Google Cloud Platform(GCP) account
- A service connection for connecting to an Oracle Cloud Infrastructure(OCI) account
- A task for installing a specific version of Terraform, if not already installed, on the agent
- A task for executing the core Terraform commands

The Terraform tool installer task acquires a specified version of [Terraform](https://www.terraform.io/) from the Internet or the tools cache and prepends it to the PATH of the Azure Pipelines Agent (hosted or private). This task can be used to change the version of Terraform used in subsequent tasks. Adding this task before the [Terraform task](https://aka.ms/AAf0uqr) in a build definition ensures you are using that task with the right Terraform version.

The Terraform task enables running Terraform commands as part of Azure Build and Release Pipelines providing support for the following Terraform commands
- init
- validate
- show
- plan
- apply
- output
- custom (any command terraform CLI supports natively) 
- destroy

This extension is intended to run on **Windows**, **Linux** and **MacOS** agents.

## Create a new service connection for connecting to an AWS account

The Terraform task requires a AWS service connection for setting up the credentials to connect to an AWS account. For setting up a new AWS service connection:

- On the project page, go to **Project settings** and choose **Service connections**.
- In the **New service connection** list, choose **AWS for Terraform**.
- Enter the following details to set up the service connection:
	- **Connection name\*:** Enter a unique name of the service connection to identify it within the project
	- **Access key id\*:** Enter the access key id for your AWS account
	- **Secret access key\*:** Enter the secret access key associated with the access key id
	- **Region\*:** Enter the region of the Amazon Simple Storage Service(S3) bucket in which you want to store the Terraform remote state file e.g. 'us-east-1'

![Creating an AWS service connection](images/1_AWS_service_endpoint.PNG)

## Create a new service connection for connecting to a GCP account

The Terraform task requires a GCP service connection for setting up the credentials to connect to a GCP service account. For setting up a new GCP service connection:

- Download the JSON key file containing the required credentials
	- In the GCP Console, go to the **[Create service account key](https://console.cloud.google.com/apis/credentials/serviceaccountkey?_ga=2.139902131.-101031797.1559296298)** page.
	- From the **Service account** list, select the existing service account or **New service account** to create a new one.
	- If **New service account** was selected in the previous step, in the **Service account name** field, enter a name.
	- From the **Role** list, select **Project** > **Owner**.
	- Click **Create**. A JSON file that contains your key downloads to your computer.
- On the project page, go to **Project settings** and choose **Service connections**.
- In the **New service connection** list, choose **GCP for Terraform**.
- Enter the following details to set up the service connection:
	- **Connection name\*:** Enter a unique name of the service connection to identify it within the project
	- **Project id\*:** Enter the project id of the GCP project in which the resources will be managed
	- **Client email\*:** Enter the value of the **client_email** field in the JSON key file
	- **Token uri\*:** Enter the value of the **token_uri** field in the JSON key file
	- **Scope\*:** Enter the scope of access to GCP resources e.g. https://www.googleapis.com/auth/cloud-platform. For more information, see [granting roles to service accounts](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts)
	- **Private key\*:** Enter the value of the **private_key** field in the JSON key file

![Creating a GCP service connection](images/2_GCP_service_endpoint.PNG)

## Create a new service connection for connecting to an OCI account

The Terraform task requires an OCI service connection for setting up the credentials to connect to an OCI account. For setting up a new OCI service connection:

- Using OCI Console add an API Key by generating it (https://docs.oracle.com/en-us/iaas/Content/API/Concepts/apisigningkey.htm#two) and download it
- On the project page, go to **Project settings** and choose **Service connections**.
- In the **New service connection** list, choose **OCI for Terraform**.
- Enter the following details to set up the service connection:
	- **Connection name\*:** Enter a unique name of the service connection to identify it within the project
	- **User OCID\*:** Enter the OCI account **user OCID** copying it from your OCI Console User Profile information
	- **Tenancy OCID\*:** Enter the OCI **tenancy OCID** copying it from your OCI Console Tenancy information
	- **Region\*:** Enter the value of the **region** you want to manage with Terraform e.g. eu-frankfurt-1
	- **Key fingerprint\*:** Enter the value of the API Key **fingerprint** copying it from OCI Console generated in the first step
	- **Private key\*:** Enter the value of the contents of the **private_key** file generated and downloaded in the first step

![Creating a GCP service connection](images/8_OCI_service_endpoint.PNG)

## Terraform tool installer task

- Search for **Terraform tool installer** and click on **Add**

![Adding Terraform tool installer task](images/3_Terraform_tool_installer_search.PNG)

- In the **Version** input, select the exact version of terraform you want to install on the build agent. e.g. if you want to install version 0.10.3, enter `0.10.3`

![Using Terraform tool installer task](images/4_Terraform_tool_installer_inputs.PNG)

## Terraform task

- Search for **Terraform** and click on **Add**

![Adding Terraform task](images/5_Terraform_search.PNG)

- Select the required provider from the **Provider** list. The available options denote the following:
	- **azurerm** - Azure Resource Manager
	- **aws** - Amazon Web Services
	- **gcp** - Google Cloud Platform
	- **oci** - Oracle Cloud Infrastructure
- From the **Command** list, select the terraform command to execute.
- In the **Configuration directory** input, select the path to the directory that contains all the relevant terraform config (.tf) files. The task intends to use Terraform to build infrastructure on one provider at a time. So, all the config files in the configuration directory together should not specify more than one provider.
- In the **Additional command arguments** input, provide any additional arguments for the selected command either as key-value pairs(-key=value) or as command line flags(-flag). Multiple options can also be provided delimited by spaces(-key1=value1 -key2=value2 -flag1 -flag2).
Examples:
	- -out=tfplan (for terraform plan)
	- tfplan -auto-approve (for terraform apply)

![Generic inputs](images/6_Terraform_all_inputs.PNG)

- For **plan**, **apply** and **destroy** commands:
    - **Azure Provider Service Connection (only if "azurerm" provider is selected)\*:** Select the AzureRM Service Connection to use for managing the resources used by the plan, apply, show, output, custom and destroy commands
	- **Amazon Web Services connection (only if "aws" provider is selected)\*:** Select the AWS connection to use for managing the resources used by the plan, apply and destroy commands.
	- **Google Cloud Platform connection (only if "gcp" provider is selected)\*:** Select the GCP connection to use for managing the resources used by the plan, apply and destroy commands.
	- **Oracle Cloud Infrastructure connection (only if "oci" provider is selected)\*:** Select the OCI connection to use for managing the resources used by the plan, apply and destroy commands.

![Plan, apply, destroy](images/7_Terraform_plan_apply_destroy.png)

### Setting up AzureRM backend configuration

- **Azure Backend Service Connection\*:** Select the Azure Service Connection to use for AzureRM backend configuration
- **Resource group\*:** Select the name of the resource group in which you want to store the terraform remote state file
- **Storage account\*:** Select the name of the storage account belonging to the selected resource group in which you want to store the terrafor remote state file
- **Container\*:** Select the name of the Azure Blob container belonging to the storage account in which you want to store the terrafor remote state file
- **Key\*:** Specify the relative path to the state file inside the selected container. For example, if you want to store the state file, named terraform.tfstate, inside a folder, named tf, then give the input "tf/terraform.tfstate"
- **Use Env Vars for Authentication\*:** Choose whether to use environment variables for azurerm backend authentication. If selected, the principal details will be created as environment variables for 'ARM_CLIENT_ID' and 'ARM_CLIENT_SECRET' or 'ARM_OIDC_TOKEN'.
- **Use Entra ID for Authentication\*:** Choose whether to use Entra Id authentication to the storage account. If selected, 'use_azuread_auth = true' will be passed to the backend config.

### Setting up AWS backend configuration

- **Amazon Web Services connection\*:** Select the AWS connection to use for AWS backend configuration
- **Bucket\*:** Select the name of the Amazon S3 bucket in which you want to store the terraform remote state file
- **Key\*:** Specify the relative path to the state file inside the selected S3 bucket. For example, if you want to store the state file, named terraform.tfstate, inside a folder, named tf, then give the input "tf/terraform.tfstate"

### Setting up GCP backend configuration

- **Google Cloud Platform connection\*:** Select the GCP connection to use for GCP backend configuration
- **Bucket\*:** Select the name of the GCP storage bucket in which you want to store the terraform remote state file
- **Prefix of state file:** Specify the relative path to the state file inside the GCP bucket. For example, if you give the input as "terraform", then the state file, named default.tfstate, will be stored inside an object called terraform.

### Setting up OCI backend configuration

- **Oracle Cloud Infrastructure connection\*:** Select the OCI connection to use for OCI backend configuration
- **PAR for Terraform remote state file:** Enter the OCI object storage PAR (preauthenticated request) URL pointing to the Terraform statefile. If the file does not exist it will be created. e.g. https://objectstorage.eu-frankfurt-1.oraclecloud.com/p/z93gZjNS0uDL...DarLRlA8uN/n/tenancy-namespace/b/object-storage-bucket/o/terraform.tfstate
- **Generate the Terraform remote state file config\*:** Select 'yes' to automatically create the remote Terraform state file configuration. When 'yes' the PAR above needs to be specified. Select 'no' when the remote Terraform state file configuration is included in the supplied Terraform files (or it is not needed for any reason). When 'no' the PAR above can be left blank.

**NOTE:** If your connection is not listed or if you want to use an existing connection, you can setup a service connection, using the 'Add' or 'Manage' button.
