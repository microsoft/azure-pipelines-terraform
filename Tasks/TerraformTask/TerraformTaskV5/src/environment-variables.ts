import tasks = require('azure-pipelines-task-lib/task');

export class EnvironmentVariableHelper {
    public static setEnvironmentVariable(name: string, value: string): void {
        if (name && value) {
            process.env[name] = value;
            tasks.debug(`Set environment variable: ${name} = ${value}`);
        }
    }
}