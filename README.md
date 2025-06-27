Azure DevOps OpenTofu Task

Overview

This extension enables you to run OpenTofu commands as part of your Azure Pipelines build and release workflows. This extension is designed as a direct replacement for the Azure DevOps Terraform extension, offering the same functionality but with OpenTofu instead of Terraform.

OpenTofu is an open-source infrastructure as code tool that is a direct fork of Terraform. It allows you to define and provision infrastructure using a declarative configuration language.

Changes from the Terraform Extension
This project is a fork of the Azure DevOps Terraform Tasks that has been modified to work with OpenTofu instead. Key changes include:

Replacing all command executions from terraform to tofu
Renaming handler classes from TerraformCommand* to OpenTofuCommand*
Updating variable names accordingly (e.g., terraformCommandHandler → openTofuCommandHandler)
Modifying import paths to reference the new OpenTofu command handler files
Updating all tests to use the OpenTofu binary and classes
All functionality remains identical to the original extension, including:

Support for AWS, Azure, and GCP providers
All Terraform commands (apply, destroy, init, validate, etc.)
Authentication with cloud providers
Command options and parameters