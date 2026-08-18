import {TerraformToolHandler, ITerraformToolHandler} from './terraform';
import {ToolRunner, IExecOptions, IExecSyncOptions, IExecSyncResult} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformBaseCommandInitializer, TerraformAuthorizationCommandInitializer} from './terraform-commands';
import tasks = require('azure-pipelines-task-lib/task');
import path = require('path');
import { v4 as uuidV4 } from 'uuid';
const del = require('del');

export abstract class BaseTerraformCommandHandler {
    // Must match terraformPlanAttachmentType in views/terraform-plan; the tab queries
    // build attachments by exactly this type.
    protected static readonly planAttachmentType: string = "terraform-plan-results";

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
        await this.handleProvider(showCommand);
        
        if(outputTo == "console"){
            // JSON is captured rather than streamed so it can be attached for the plan
            // tab. Other formats keep streaming straight to the log.
            if (outputFormat == "json") {
                let commandOutput = await terraformTool.execSync(<IExecSyncOptions> {
                    cwd: showCommand.workingDirectory,
                });

                // execSync resolves on a non-zero exit code where exec would reject.
                if (commandOutput.code !== 0) {
                    throw new Error(`Terraform show failed with exit code ${commandOutput.code}`);
                }

                this.publishPlanAttachment(tasks.getInput("fileName") || "terraform-plan", commandOutput.stdout);

                console.log(commandOutput.stdout);
                return commandOutput.code;
            }

            return terraformTool.exec(<IExecOptions> {
            cwd: showCommand.workingDirectory});
        }else if(outputTo == "file"){
            // Required here: fileName is optional at the schema level because it doubles
            // as the plan display name for outputFormat=json, but writing to a file
            // without it would throw an unhelpful path.resolve TypeError.
            const showFilePath = path.resolve(tasks.getInput("workingDirectory") || tasks.getVariable('System.DefaultWorkingDirectory') || '.', tasks.getInput("filename", true));
            let commandOutput = await terraformTool.execSync(<IExecSyncOptions> {
                cwd: showCommand.workingDirectory,
            });

            // Guarded for json only: execSync resolves on a non-zero exit code, so partial
            // stdout would otherwise be attached to the plan tab as a valid plan.
            if (outputFormat == "json" && commandOutput.code !== 0) {
                throw new Error(`Terraform show failed with exit code ${commandOutput.code}`);
            }

            tasks.writeFile(showFilePath, commandOutput.stdout);
            tasks.setVariable('showFilePath', showFilePath, false, true);

            if (outputFormat == "json") {
                tasks.addAttachment(
                    BaseTerraformCommandHandler.planAttachmentType,
                    tasks.getInput("fileName") || path.basename(showFilePath),
                    showFilePath);
            }

            return commandOutput.code;
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

        const publishPlanName = tasks.getInput("publishPlan") || "";

        // A plan file we created, and are therefore responsible for removing.
        let generatedPlanFile = "";

        // Publishing needs a plan file to run `terraform show -json` against.
        if (publishPlanName && !this.extractPlanFilePath(commandOptions)) {
            generatedPlanFile = path.join(tasks.getVariable('System.DefaultWorkingDirectory') || '.', `terraform-plan-${uuidV4()}.tfplan`);
            // Quoted for ToolRunner.line(), which splits options on whitespace.
            commandOptions = `${commandOptions} -out="${generatedPlanFile}"`;
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

        let result = await terraformTool.exec(<IExecOptions> {
            cwd: planCommand.workingDirectory,
            ignoreReturnCode: true
        });

        if (result !== 0 && result !== 2) {
            throw new Error(tasks.loc("TerraformPlanFailed", result));
        }
        tasks.setVariable('changesPresent', (result === 2).toString(), false, true);

        if (publishPlanName) {
            try {
                const planFilePath = this.extractPlanFilePath(commandOptions);

                if (planFilePath) {
                    let showTerraformTool = this.terraformToolHandler.createToolRunner(new TerraformBaseCommandInitializer(
                        "show",
                        planCommand.workingDirectory,
                        `-json "${planFilePath}"`
                    ));

                    let showCommandOutput = await showTerraformTool.execSync(<IExecSyncOptions> {
                        cwd: planCommand.workingDirectory,
                    });

                    // execSync resolves on a non-zero exit code; without this a failed show
                    // publishes empty stdout as a plan instead of warning.
                    if (showCommandOutput.code !== 0) {
                        throw new Error(`Terraform show failed with exit code ${showCommandOutput.code}`);
                    }

                    this.publishPlanAttachment(publishPlanName, showCommandOutput.stdout);
                }
            } catch (error) {
                // A failed publish must not fail the plan itself.
                console.log(`Error publishing plan: ${error}`);
                tasks.warning(`Failed to publish terraform plan: ${error}`);
            } finally {
                // Never remove a user-supplied -out; later steps may consume it.
                if (generatedPlanFile && tasks.exist(generatedPlanFile)) {
                    try {
                        tasks.rmRF(generatedPlanFile);
                    } catch (cleanupError) {
                        tasks.debug(`Could not remove temporary plan file ${generatedPlanFile}: ${cleanupError}`);
                    }
                }
            }
        }

        return result;
    }

    /**
     * Read the plan file path out of the command options, handling `-out=<path>` and
     * `-out <path>` with optional quoting so paths containing spaces survive. Returns
     * an empty string when no -out is present.
     */
    private extractPlanFilePath(commandOptions: string): string {
        const match = commandOptions.match(/-out(?:=|\s+)(?:"([^"]+)"|'([^']+)'|([^\s]+))/);
        return match ? (match[1] || match[2] || match[3] || '') : '';
    }

    /** Write plan JSON to the working directory and attach it for the plan tab. */
    private publishPlanAttachment(planName: string, planJson: string): void {
        const workDir = tasks.getVariable('System.DefaultWorkingDirectory') || '.';
        const planFilePath = path.join(workDir, `${BaseTerraformCommandHandler.toSafeFileName(planName)}.json`);

        tasks.writeFile(planFilePath, planJson);
        tasks.addAttachment(BaseTerraformCommandHandler.planAttachmentType, planName, planFilePath);
    }

    /**
     * Reduce a user-supplied plan name to a single safe path segment. The name is free
     * text, so without this a value containing separators would write outside the
     * working directory. Only the file name is affected; the attachment keeps the
     * name as entered.
     */
    private static toSafeFileName(planName: string): string {
        return planName.replace(/[^A-Za-z0-9._-]/g, '_') || 'terraform-plan';
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
            return terraformTool.exec(<IExecOptions> {
            cwd: customCommand.workingDirectory});
        }else if(outputTo == "file"){
            const customFilePath = path.resolve(tasks.getInput("workingDirectory") || tasks.getVariable('System.DefaultWorkingDirectory') || '.', tasks.getInput("filename"));
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

        return terraformTool.exec(<IExecOptions> {
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
        await Promise.resolve("This is here because the unit tests fail without it.");
        
        return terraformTool.exec(<IExecOptions>{
            cwd: validateCommand.workingDirectory
        });
    }
}
