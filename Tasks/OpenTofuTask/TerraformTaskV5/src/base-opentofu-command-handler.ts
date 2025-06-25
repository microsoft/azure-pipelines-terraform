import {OpenTofuToolHandler, IOpenTofuToolHandler} from './terraform';
import {ToolRunner, IExecOptions, IExecSyncOptions, IExecSyncResult} from 'azure-pipelines-task-lib/toolrunner';
import {OpenTofuBaseCommandInitializer, OpenTofuAuthorizationCommandInitializer} from './opentofu-commands';
import tasks = require('azure-pipelines-task-lib/task');
import path = require('path');
import * as uuidV4 from 'uuid/v4';
const fs = require('fs');
const del = require('del');

export abstract class BaseOpenTofuCommandHandler {
    providerName: string;
    opentofuToolHandler: IOpenTofuToolHandler;
    backendConfig: Map<string, string>;

    abstract handleBackend(opentofuToolRunner: ToolRunner) : Promise<void>;
    abstract handleProvider(command: OpenTofuAuthorizationCommandInitializer) : Promise<void>;
    
    constructor() {
        this.providerName = "";
        this.opentofuToolHandler = new OpenTofuToolHandler(tasks);
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
        let opentofuPath;
        try {
            opentofuPath = tasks.which("tofu", true);
        } catch(err) {
            throw new Error(tasks.loc("OpenTofuToolNotFound"));
        }

        let opentofuToolRunner: ToolRunner = tasks.tool(opentofuPath);
        opentofuToolRunner.arg("providers");
        let commandOutput = opentofuToolRunner.execSync(<IExecSyncOptions>{
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
        let initCommand = new OpenTofuBaseCommandInitializer(
            "init",
            tasks.getInput("workingDirectory"),
            tasks.getInput("commandOptions")
        );
        
        let opentofuTool;
        
        opentofuTool = this.opentofuToolHandler.createToolRunner(initCommand);
        await this.handleBackend(opentofuTool);
        
        return await opentofuTool.execAsync(<IExecOptions> {
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
    
        let showCommand = new OpenTofuAuthorizationCommandInitializer(
            "show",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            cmd
        );
        let opentofuTool;
        opentofuTool = this.opentofuToolHandler.createToolRunner(showCommand);
        await this.handleProvider(showCommand);
        
        if(outputTo == "console"){
            return await opentofuTool.execAsync(<IExecOptions> {
            cwd: showCommand.workingDirectory});
        }else if(outputTo == "file"){
            const showFilePath = path.resolve(tasks.getInput("filename"));
            let commandOutput = await opentofuTool.execSync(<IExecSyncOptions> {
                cwd: showCommand.workingDirectory,
            });
            
            tasks.writeFile(showFilePath, commandOutput.stdout);
            tasks.setVariable('showFilePath', showFilePath, false, true);
            
            return commandOutput;
        }
    }
    public async output(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let commandOptions = tasks.getInput("commandOptions") != null ? `-json ${tasks.getInput("commandOptions")}`:`-json`
        
        let outputCommand = new OpenTofuAuthorizationCommandInitializer(
            "output",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            commandOptions
        );

        let opentofuTool;
        opentofuTool = this.opentofuToolHandler.createToolRunner(outputCommand);
        await this.handleProvider(outputCommand);

        const jsonOutputVariablesFilePath = path.resolve(`output-${uuidV4()}.json`);
        let commandOutput = await opentofuTool.execSync(<IExecSyncOptions>{
            cwd: outputCommand.workingDirectory,
        });

        tasks.writeFile(jsonOutputVariablesFilePath, commandOutput.stdout);
        tasks.setVariable('jsonOutputVariablesPath', jsonOutputVariablesFilePath, false, true);

        return commandOutput;
    }
    
    public async plan(): Promise<number> {
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let commandOptions = tasks.getInput("commandOptions") != null ? `${tasks.getInput("commandOptions")} -detailed-exitcode`:`-detailed-exitcode`
        let planCommand = new OpenTofuAuthorizationCommandInitializer(
            "plan",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            commandOptions
        );
        
        let opentofuTool;
        opentofuTool = this.opentofuToolHandler.createToolRunner(planCommand);
        await this.handleProvider(planCommand);
        this.warnIfMultipleProviders();
    
        let result = await opentofuTool.execAsync(<IExecOptions> {
            cwd: planCommand.workingDirectory,
            ignoreReturnCode: true
        });

        if (result !== 0 && result !== 2) {
            throw new Error(tasks.loc("OpenTofuPlanFailed", result));
        }
        tasks.setVariable('changesPresent', (result === 2).toString(), false, true);
        return result;
    }

    public async custom(): Promise<number> {
        const outputTo = tasks.getInput("outputTo");
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let customCommand = new OpenTofuAuthorizationCommandInitializer(
            tasks.getInput("customCommand"),
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            tasks.getInput("commandOptions")
        );
        
        let opentofuTool;
        opentofuTool = this.opentofuToolHandler.createToolRunner(customCommand);
        await this.handleProvider(customCommand);

        if(outputTo == "console"){
            return await opentofuTool.execAsync(<IExecOptions> {
            cwd: customCommand.workingDirectory});
        }else if(outputTo == "file"){
            const customFilePath = path.resolve(tasks.getInput("filename"));
            let commandOutput = await opentofuTool.execSync(<IExecSyncOptions> {
                cwd: customCommand.workingDirectory});
            
            tasks.writeFile(customFilePath, commandOutput.stdout);
            tasks.setVariable('customFilePath', customFilePath, false, true);
            return commandOutput;
            }
    }

    public async apply(): Promise<number> {
        let opentofuTool;
        let serviceName = `environmentServiceName${this.getServiceProviderNameFromProviderInput()}`;
        let autoApprove: string = '-auto-approve';
        let additionalArgs: string = tasks.getInput("commandOptions") || autoApprove;

        if (additionalArgs.includes(autoApprove) === false) {
            additionalArgs = `${autoApprove} ${additionalArgs}`;
        }

        let applyCommand = new OpenTofuAuthorizationCommandInitializer(
            "apply",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            additionalArgs
        );

        opentofuTool = this.opentofuToolHandler.createToolRunner(applyCommand);
        await this.handleProvider(applyCommand);
        this.warnIfMultipleProviders();

        return await opentofuTool.execAsync(<IExecOptions> {
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

        let destroyCommand = new OpenTofuAuthorizationCommandInitializer(
            "destroy",
            tasks.getInput("workingDirectory"),
            tasks.getInput(serviceName, true),
            additionalArgs
        );

        let opentofuTool;
        opentofuTool = this.opentofuToolHandler.createToolRunner(destroyCommand);
        await this.handleProvider(destroyCommand);
        this.warnIfMultipleProviders();

        return await opentofuTool.execAsync(<IExecOptions> {
            cwd: destroyCommand.workingDirectory
        });
    };

    public async validate(): Promise<number> {
        let validateCommand = new OpenTofuBaseCommandInitializer(
            "validate",
            tasks.getInput("workingDirectory"),
            tasks.getInput("commandOptions")
        );

        let opentofuTool;
        opentofuTool = this.opentofuToolHandler.createToolRunner(validateCommand);
        
        return await opentofuTool.execAsync(<IExecOptions>{
            cwd: validateCommand.workingDirectory
        });
    }
}