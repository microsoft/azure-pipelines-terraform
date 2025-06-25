import tasks = require('azure-pipelines-task-lib/task');
import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {OpenTofuAuthorizationCommandInitializer} from './opentofu-commands';
import {BaseOpenTofuCommandHandler} from './base-opentofu-command-handler';

export class OpenTofuCommandHandlerAWS extends BaseOpenTofuCommandHandler {
    constructor() {
        super();
        this.providerName = "aws";
    }

    private setupBackend(backendServiceName: string) {
        this.backendConfig.set('bucket', tasks.getInput("backendAWSBucketName", true));
        this.backendConfig.set('key', tasks.getInput("backendAWSKey", true));
        this.backendConfig.set('region', tasks.getEndpointAuthorizationParameter(backendServiceName, "region", true));
        this.backendConfig.set('access_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "username", true));
        this.backendConfig.set('secret_key', tasks.getEndpointAuthorizationParameter(backendServiceName, "password", true));
    }

    public async handleBackend(opentofuToolRunner: ToolRunner) : Promise<void> {
        let backendServiceName = tasks.getInput("backendServiceAWS", true);
        this.setupBackend(backendServiceName);

        for (let [key, value] of this.backendConfig.entries()) {
            opentofuToolRunner.arg(`-backend-config=${key}=${value}`);
        }
    }

    public async handleProvider(command: OpenTofuAuthorizationCommandInitializer) : Promise<void> {
        if (command.serviceProvidername) {
            process.env['AWS_ACCESS_KEY_ID']  = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "username", false);
            process.env['AWS_SECRET_ACCESS_KEY']  = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "password", false);            
        }
    }
}