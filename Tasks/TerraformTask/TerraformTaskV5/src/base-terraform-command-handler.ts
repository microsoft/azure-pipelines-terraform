import {TerraformToolHandler, ITerraformToolHandler} from './terraform';
import {ToolRunner, IExecOptions, IExecSyncOptions, IExecSyncResult} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformBaseCommandInitializer, TerraformAuthorizationCommandInitializer} from './terraform-commands';
import tasks = require('azure-pipelines-task-lib/task');
import path = require('path');
import * as uuidV4 from 'uuid/v4';
const fs = require('fs');
const del = require('del');

export abstract class BaseTerraformCommandHandler {
    providerName: string;
    terraformToolHandler: ITerraformToolHandler;
    backendConfig: Map<string, string>;

    abstract handleBackend(terraformToolRunner: ToolRunner) : Promise<void>;
    abstract handleProvider(command: TerraformAuthorizationCommandInitializer) : Promise<void>;
    
    constructor() {
        this.providerName = "";
        this.terraformToolHandler = new TerraformToolHandler(tasks);
        this.backendConfig = new Map<string, string>();
    }

    public compareVersions(version1: string, version2: string) {
        let versionNumbers1: string[] = version1.split('.');
        let versionNumbers2: string[] = version2.split('.');

        const smallerLength = Math.min(versionNumbers1.length, versionNumbers2.length);
        
        let versionNumbersInt1: number[] = new Array(smallerLength);
        let versionNumbersInt2: number[] = new Array(smallerLength);
        
        for (let i = 0; i < smallerLength; i++) {
            versionNumbersInt1[i] = parseInt(versionNumbers1[i], 10);
            versionNumbersInt2[i] = parseInt(versionNumbers2[i], 10);
            if (versionNumbersInt1[i] > versionNumbersInt2[i]) return 1;
            if (versionNumbersInt1[i] < versionNumbersInt2[i]) return -1;        
        }

        return versionNumbersInt1.length == versionNumbersInt2.length ? 0: (versionNumbersInt1.length < versionNumbersInt2.length ? -1 : 1);
    }

    public warnIfMultipleProviders(): void {
        let terraformPath;
        try {
            terraformPath = tasks.which("terraform", true);
        } catch(err) {
            throw new Error(tasks.loc("TerraformToolNotFound"));
        }

        let terraformToolRunner: ToolRunner = tasks.tool(terraformPath);
        terraformToolRunner.arg("providers");
        let commandOutput = terraformToolRunner.execSync(<IExecSyncOptions>{
            cwd: tasks.getInput("workingDirectory")
        });

        let countProviders = ["aws", "azurerm", "google", "oracle"].filter(provider => commandOutput.stdout.includes(provider)).length;
        
        tasks.debug(countProviders.toString());
        if (countProviders > 1) {
            tasks.warning("Multiple provider blocks specified in the .tf files in the current working directory.");
        }
    }

    public getServiceProviderNameFromProviderInput(): string {
        let provider: string = tasks.getInput("provider", true);
        
        switch (provider) {
            case "azurerm": return "AzureRM";
            case "aws"    : return "AWS";
            case "gcp"    : return "GCP";
            case "oci"    : return "OCI";
        }
    }

    public async init(): Promise<number> {
        let initCommand = new TerraformBaseCommandInitializer(
            "init",
            tasks.getInput("workingDirectory"),
            tasks.getInput("commandOptions")
        );
        
        let terraformTool;
        
        terraformTool = this.terraformToolHandler.createToolRunner(initCommand);
        await this.handleBackend(terraformTool);
        
        return await terraformTool.execAsync(<IExecOptions> {
            cwd: initCommand.workingDirectory
        });
    }
    public async show(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let cmd;
        const outputTo = tasks.getInput("outputTo");
        const outputFormat = tasks.getInput("outputFormat");
        if (outputFormat == "json"){
                cmd = tasks.getInput("commandOptions") != null ? `-json  ${tasks.getInput("commandOptions")}`:`-json`;
            }else{
                cmd = tasks.getInput("commandOptions") != null ? tasks.getInput("commandOptions"):``;
            }
    
        let showCommand = new TerraformAuthorizationCommandInitializer(
            "show",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            cmd
        );
        let terraformTool;
        terraformTool = this.terraformToolHandler.createToolRunner(showCommand);
        await this.handleProvider(showCommand);
        
        if(outputTo == "console"){
            let commandOutput = await terraformTool.execSync(<IExecSyncOptions> {
                cwd: showCommand.workingDirectory,
            });
            
            // If JSON format is used, attach the output for the Terraform Plan tab
            if (outputFormat == "json") {
                const planName = tasks.getInput("fileName") || "terraform-plan";
                const attachmentType = "terraform-plan-results";
                
                // Create a file in the task's working directory
                const workDir = tasks.getVariable('System.DefaultWorkingDirectory') || '.';
                // Create an absolute path for the plan file
                const planFilePath = path.join(workDir, `${planName}.json`);
                
                // Write the output to the file
                tasks.writeFile(planFilePath, commandOutput.stdout);
                
                // Debug info to help troubleshoot
                console.log(`Writing plan to file: ${planFilePath}`);
                console.log(`File exists: ${tasks.exist(planFilePath)}`);
                console.log(`File size: ${fs.statSync(planFilePath).size} bytes`);
                console.log(`First 100 chars: ${commandOutput.stdout.substring(0, 100)}...`);
                
                // Get current task info for debugging
                console.log(`Task ID: ${tasks.getVariable('SYSTEM_TASKID') || 'unknown'}`);
                console.log(`Task Instance ID: ${tasks.getVariable('SYSTEM_TASKINSTANCEID') || 'unknown'}`);
                
                // Save as attachment using the file path
                console.log(`Adding attachment: type=${attachmentType}, name=${planName}, path=${planFilePath}`);
                tasks.addAttachment(attachmentType, planName, planFilePath);
                
                console.log(`Terraform plan output saved for visualization in the Terraform Plan tab`);
            }
            
            // Output to console
            console.log(commandOutput.stdout);
            return commandOutput.exitCode;
        }else if(outputTo == "file"){
            const showFilePath = path.resolve(tasks.getInput("filename"));
            let commandOutput = await terraformTool.execSync(<IExecSyncOptions> {
                cwd: showCommand.workingDirectory,
            });
            
            tasks.writeFile(showFilePath, commandOutput.stdout);
            tasks.setVariable('showFilePath', showFilePath, false, true);
            
            // If JSON format is used, attach the output for the Terraform Plan tab
            if (outputFormat == "json") {
                const planName = tasks.getInput("fileName") || path.basename(showFilePath);
                const attachmentType = "terraform-plan-results";
                
                // Debug info to help troubleshoot
                console.log(`Using existing file for plan output: ${showFilePath}`);
                console.log(`File exists: ${tasks.exist(showFilePath)}`);
                console.log(`File size: ${fs.statSync(showFilePath).size} bytes`);
                console.log(`First 100 chars: ${fs.readFileSync(showFilePath, 'utf8').substring(0, 100)}...`);
                
                // Get current task info for debugging
                console.log(`Task ID: ${tasks.getVariable('SYSTEM_TASKID') || 'unknown'}`);
                console.log(`Task Instance ID: ${tasks.getVariable('SYSTEM_TASKINSTANCEID') || 'unknown'}`);
                
                // Save as attachment - using the file path that was already written to
                console.log(`Adding attachment: type=${attachmentType}, name=${planName}, path=${showFilePath}`);
                tasks.addAttachment(attachmentType, planName, showFilePath);
                
                console.log(`Terraform plan output saved for visualization in the Terraform Plan tab`);
            }
            
            return commandOutput.exitCode;
        }
    }
    public async output(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let commandOptions = tasks.getInput("commandOptions") != null ? `-json ${tasks.getInput("commandOptions")}`:`-json`
        
        let outputCommand = new TerraformAuthorizationCommandInitializer(
            "output",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            commandOptions
        );

        let terraformTool;
        terraformTool = this.terraformToolHandler.createToolRunner(outputCommand);
        await this.handleProvider(outputCommand);

        const jsonOutputVariablesFilePath = path.resolve(`output-${uuidV4()}.json`);
        let commandOutput = await terraformTool.execSync(<IExecSyncOptions>{
            cwd: outputCommand.workingDirectory,
        });

        tasks.writeFile(jsonOutputVariablesFilePath, commandOutput.stdout);
        tasks.setVariable('jsonOutputVariablesPath', jsonOutputVariablesFilePath, false, true);

        return commandOutput;
    }
    
    public async plan(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let commandOptions = tasks.getInput("commandOptions") != null ? `${tasks.getInput("commandOptions")} -detailed-exitcode`:`-detailed-exitcode`
        
        // Check if publishPlan is provided (non-empty string means publish)
        const publishPlanName = tasks.getInput("publishPlan") || "";
        
        // If publishPlan is provided, check for -out parameter and add it if not specified
        if (publishPlanName) {
            // Check if -out parameter is already specified
            let outParamSpecified = false;
            let planOutputPath = "";
            
            // Look for -out= in the command options (equals sign format)
            const outEqualParamMatch = commandOptions.match(/-out=([^\s]+)/);
            if (outEqualParamMatch && outEqualParamMatch[1]) {
                outParamSpecified = true;
                planOutputPath = outEqualParamMatch[1];
            }
            
            // Look for -out followed by a space and a value (space-separated format)
            if (!outParamSpecified) {
                const outSpaceParamMatch = commandOptions.match(/-out\s+([^\s-][^\s]*)/);
                if (outSpaceParamMatch && outSpaceParamMatch[1]) {
                    outParamSpecified = true;
                    planOutputPath = outSpaceParamMatch[1];
                }
            }
            
            // If -out parameter is not specified, add it
            if (!outParamSpecified) {
                // Generate a unique filename for the plan output
                const tempPlanFile = path.join(tasks.getVariable('System.DefaultWorkingDirectory') || '.', `terraform-plan-${uuidV4()}.tfplan`);
                commandOptions = `${commandOptions} -out=${tempPlanFile}`;
                planOutputPath = tempPlanFile;
            }
        }
        
        let planCommand = new TerraformAuthorizationCommandInitializer(
            "plan",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            commandOptions
        );
        
        let terraformTool;
        terraformTool = this.terraformToolHandler.createToolRunner(planCommand);
        await this.handleProvider(planCommand);
        this.warnIfMultipleProviders();
    
        let result = await terraformTool.execAsync(<IExecOptions> {
            cwd: planCommand.workingDirectory,
            ignoreReturnCode: true
        });

        if (result !== 0 && result !== 2) {
            throw new Error(tasks.loc("TerraformPlanFailed", result));
        }
        tasks.setVariable('changesPresent', (result === 2).toString(), false, true);
        
        // If publishPlan name is provided, run show command with JSON output to get the plan details
        if (publishPlanName) {
            try {
                // Extract the plan file path from the commandOptions
                let planFilePath = '';
                
                // Look for -out= in the command options (equals sign format)
                const outEqualMatch = commandOptions.match(/-out=([^\s]+)/);
                if (outEqualMatch && outEqualMatch[1]) {
                    planFilePath = outEqualMatch[1];
                } else {
                    // Look for -out followed by a space and a value (space-separated format)
                    const outSpaceMatch = commandOptions.match(/-out\s+([^\s-][^\s]*)/);
                    if (outSpaceMatch && outSpaceMatch[1]) {
                        planFilePath = outSpaceMatch[1];
                    }
                }
                
                if (planFilePath) {
                    // Run terraform show with JSON output on the plan file
                    let showTerraformTool = this.terraformToolHandler.createToolRunner(new TerraformBaseCommandInitializer(
                        "show",
                        planCommand.workingDirectory,
                        `-json ${planFilePath}`
                    ));
                    
                    let showCommandOutput = await showTerraformTool.execSync(<IExecSyncOptions> {
                        cwd: planCommand.workingDirectory,
                    });
                    
                    // Create a JSON file for the plan output
                    const planName = publishPlanName || "terraform-plan";
                    const attachmentType = "terraform-plan-results";
                    const jsonPlanFilePath = path.join(tasks.getVariable('System.DefaultWorkingDirectory') || '.', `${planName}.json`);
                    
                    // Write the output to the file
                    tasks.writeFile(jsonPlanFilePath, showCommandOutput.stdout);
                    
                    // Debug info to help troubleshoot
                    console.log(`Writing plan to file: ${jsonPlanFilePath}`);
                    console.log(`File exists: ${tasks.exist(jsonPlanFilePath)}`);
                    console.log(`File size: ${fs.statSync(jsonPlanFilePath).size} bytes`);
                    
                    // Save as attachment using the file path
                    console.log(`Adding attachment: type=${attachmentType}, name=${planName}, path=${jsonPlanFilePath}`);
                    tasks.addAttachment(attachmentType, planName, jsonPlanFilePath);
                    
                    console.log(`Terraform plan output saved for visualization in the Terraform Plan tab`);
                }
            } catch (error) {
                // Log error but don't fail the task
                console.log(`Error publishing plan: ${error}`);
                tasks.warning(`Failed to publish terraform plan: ${error}`);
            }
        }
        
        return result;
    }

    public async custom(): Promise<number> {
        const outputTo = tasks.getInput("outputTo");
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let customCommand = new TerraformAuthorizationCommandInitializer(
            tasks.getInput("customCommand"),
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            tasks.getInput("commandOptions")
        );
        
        let terraformTool;
        terraformTool = this.terraformToolHandler.createToolRunner(customCommand);
        await this.handleProvider(customCommand);

        if(outputTo == "console"){
            return await terraformTool.execAsync(<IExecOptions> {
            cwd: customCommand.workingDirectory});
        }else if(outputTo == "file"){
            const customFilePath = path.resolve(tasks.getInput("filename"));
            let commandOutput = await terraformTool.execSync(<IExecSyncOptions> {
                cwd: customCommand.workingDirectory});
            
            tasks.writeFile(customFilePath, commandOutput.stdout);
            tasks.setVariable('customFilePath', customFilePath, false, true);
            return commandOutput;
            }
    }

    public async apply(): Promise<number> {
        let terraformTool;
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let autoApprove: string = '-auto-approve';
        let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

        if (additionalArgs.includes(autoApprove) === false) {
            additionalArgs = `${autoApprove} ${additionalArgs}`;
        }

        let applyCommand = new TerraformAuthorizationCommandInitializer(
            "apply",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            additionalArgs
        );

        terraformTool = this.terraformToolHandler.createToolRunner(applyCommand);
        await this.handleProvider(applyCommand);
        this.warnIfMultipleProviders();

        return await terraformTool.execAsync(<IExecOptions> {
            cwd: applyCommand.workingDirectory
        });
    }

    public async destroy(): Promise<number> {
        
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let autoApprove: string = '-auto-approve';
        let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

        if (additionalArgs.includes(autoApprove) === false) {
            additionalArgs = `${autoApprove} ${additionalArgs}`;
        }

        let destroyCommand = new TerraformAuthorizationCommandInitializer(
            "destroy",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            additionalArgs
        );

        let terraformTool;
        terraformTool = this.terraformToolHandler.createToolRunner(destroyCommand);
        await this.handleProvider(destroyCommand);
        this.warnIfMultipleProviders();

        return await terraformTool.execAsync(<IExecOptions> {
            cwd: destroyCommand.workingDirectory
        });
    };

    public async validate(): Promise<number> {
        let validateCommand = new TerraformBaseCommandInitializer(
            "validate",
            tasks.getInput("workingDirectory"),
            tasks.getInput("commandOptions")
        );

        let terraformTool;
        terraformTool = this.terraformToolHandler.createToolRunner(validateCommand);
        
        return await terraformTool.execAsync(<IExecOptions>{
            cwd: validateCommand.workingDirectory
        });
    }
}
