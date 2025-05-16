import tasks = require("azure-pipelines-task-lib/task");

export async function generateIdToken(serviceConnectionID : string): Promise<string> {
    let tokenGenerator = new TokenGenerator();
    return await tokenGenerator.generate(serviceConnectionID);
}

export interface ITokenGenerator {
    generate(serviceConnectionID : string): Promise<string>;
}

export class TokenGenerator implements ITokenGenerator {
    public async generate(serviceConnectionID : string): Promise<string> {
        const url = process.env["SYSTEM_OIDCREQUESTURI"]+"?api-version=7.1&serviceConnectionId=" + serviceConnectionID;
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
