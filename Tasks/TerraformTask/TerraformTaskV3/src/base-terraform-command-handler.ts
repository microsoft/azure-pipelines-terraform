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

    abstract handleBackend(terraformToolRunner: ToolRunner);
    abstract handleProvider(command: TerraformAuthorizationCommandInitializer);
    
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

        let countProviders = ["aws", "azurerm", "google"].filter(provider => commandOutput.stdout.includes(provider)).length;
        
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
        this.handleBackend(terraformTool);
        
        return terraformTool.exec(<IExecOptions> {
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
        this.handleProvider(showCommand);
        
        if(outputTo == "console"){
            return terraformTool.exec(<IExecOptions> {
            cwd: showCommand.workingDirectory});
        }else if(outputTo == "file"){
            const showFilePath = path.resolve(tasks.getInput("filename"));
            let commandOutput = await terraformTool.execSync(<IExecSyncOptions> {
                cwd: showCommand.workingDirectory,
            });
            
            tasks.writeFile(showFilePath, commandOutput.stdout);
            tasks.setVariable('showFilePath', showFilePath);
            
            return commandOutput;
        }
    }
    public async output(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let additionalArgs: string = `-json`
        let commandOptions = tasks.getInput("commandOptions") != null ? `${tasks.getInput("commandOptions")} -json`:`-json`
        
        let outputCommand = new TerraformAuthorizationCommandInitializer(
            "output",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            commandOptions
        );

        let terraformTool;
        terraformTool = this.terraformToolHandler.createToolRunner(outputCommand);
        this.handleProvider(outputCommand);

        const jsonOutputVariablesFilePath = path.resolve(`output-${uuidV4()}.json`);
        let commandOutput = await terraformTool.execSync(<IExecSyncOptions>{
            cwd: outputCommand.workingDirectory,
        });

        tasks.writeFile(jsonOutputVariablesFilePath, commandOutput.stdout);
        tasks.setVariable('jsonOutputVariablesPath', jsonOutputVariablesFilePath);

        return commandOutput;
    

    }
    
    public async plan(): Promise<number> {
        this.warnIfMultipleProviders();
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let commandOptions = tasks.getInput("commandOptions") != null ? `${tasks.getInput("commandOptions")} -detailed-exitcode`:`-detailed-exitcode`
        let planCommand = new TerraformAuthorizationCommandInitializer(
            "plan",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            commandOptions
        );
        
        let terraformTool;
        terraformTool = this.terraformToolHandler.createToolRunner(planCommand);
        this.handleProvider(planCommand);
    
        let result = await terraformTool.exec(<IExecOptions> {
            cwd: planCommand.workingDirectory,
            ignoreReturnCode: true
        });

        if (result !== 0 && result !== 2) {
            throw new Error(tasks.loc("TerraformPlanFailed", result));
        }
        tasks.setVariable('changesPresent', (result === 2).toString(), false, true);
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
        this.handleProvider(customCommand);


        if(outputTo == "console"){
            return terraformTool.exec(<IExecOptions> {
            cwd: customCommand.workingDirectory});
        }else if(outputTo == "file"){
            const customFilePath = path.resolve(tasks.getInput("filename"));
            let commandOutput = await terraformTool.execSync(<IExecSyncOptions> {
                cwd: customCommand.workingDirectory});
            
            tasks.writeFile(customFilePath, commandOutput.stdout);
            tasks.setVariable('customFilePath', customFilePath);
            return commandOutput;
            }
    }

    public async apply(): Promise<number> {
        let terraformTool;
        this.warnIfMultipleProviders();
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
        this.handleProvider(applyCommand);

        return terraformTool.exec(<IExecOptions> {
            cwd: applyCommand.workingDirectory
        });
    }

        public async destroy(): Promise<number> {
        this.warnIfMultipleProviders();
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
        this.handleProvider(destroyCommand);

        return terraformTool.exec(<IExecOptions> {
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
        

        return terraformTool.exec(<IExecOptions>{
            cwd: validateCommand.workingDirectory
        });
    }
}
