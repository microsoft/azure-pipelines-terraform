import tasks = require("azure-pipelines-task-lib/task");

export async function generateIdToken(serviceConnectionName : string): Promise<string> {
    let tokenGenerator = new TokenGenerator();
    return await tokenGenerator.generate(serviceConnectionName);
}

export interface ITokenGenerator {
    generate(serviceConnectionName : string): Promise<string>;
}

export class TokenGenerator implements ITokenGenerator {
    public async generate(serviceConnectionName : string): Promise<string> {
        const url = process.env["SYSTEM_OIDCREQUESTURI"]+"?api-version=7.1&serviceConnectionId=" + serviceConnectionName;
        var oidcToken = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+ tasks.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false)
            }
        }).then(async response => {
            var oidcObject = await (response?.json()) as {oidcToken: string};

            if (!oidcObject?.oidcToken){
                throw new Error(tasks.loc("Error_FederatedTokenAquisitionFailed"));
            }
            return oidcObject.oidcToken;
        });

        tasks.setSecret(oidcToken);
        return oidcToken;
    }
}
