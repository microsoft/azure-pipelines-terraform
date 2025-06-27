import { BaseOpenTofuCommandHandler } from './base-opentofu-command-handler';
import { OpenTofuCommandHandlerAzureRM } from './azure-opentofu-command-handler';
import { OpenTofuCommandHandlerAWS } from './aws-opentofu-command-handler';
import { OpenTofuCommandHandlerGCP } from './gcp-opentofu-command-handler';
import { OpenTofuCommandHandlerOCI } from './oci-opentofu-command-handler';

export interface IParentCommandHandler {
    execute(providerName: string, command: string): Promise<number>;
}

export class ParentCommandHandler implements IParentCommandHandler {
    public async execute(providerName: string, command: string): Promise<number> {
        // Create corresponding command handler according to provider name
        let provider: BaseOpenTofuCommandHandler;

        switch(providerName) {
            case "azurerm":
                provider = new OpenTofuCommandHandlerAzureRM();
                break;
            
            case "aws":
                provider = new OpenTofuCommandHandlerAWS();
                break;
            
            case "gcp":
                provider = new OpenTofuCommandHandlerGCP();
                break;
            
            case "oci":
                provider = new OpenTofuCommandHandlerOCI();
                break;
        }

        // Run the corrresponding command according to command name
        return await provider[command]();
    }
}