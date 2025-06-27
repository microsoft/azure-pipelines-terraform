import { ToolRunner } from 'azure-pipelines-task-lib/toolrunner'
import { OpenTofuBaseCommandInitializer } from './opentofu-commands'

export interface IOpenTofuToolHandler {
    createToolRunner(command?: OpenTofuBaseCommandInitializer): ToolRunner;
}

export class OpenTofuToolHandler implements IOpenTofuToolHandler {
    private readonly tasks: any;
    
    constructor(tasks: any) {
        this.tasks = tasks;
    }

    public createToolRunner(command?: OpenTofuBaseCommandInitializer): ToolRunner {
        let opentofuPath;
        try {
            opentofuPath = this.tasks.which("tofu", true);
        } catch(err) {
            throw new Error(this.tasks.loc("OpenTofuToolNotFound"));
        }
        
        let opentofuToolRunner: ToolRunner = this.tasks.tool(opentofuPath);
        if (command) {
            opentofuToolRunner.arg(command.name);
            if (command.additionalArgs) {
                opentofuToolRunner.line(command.additionalArgs);
            }
        }

        return opentofuToolRunner;
    }
}