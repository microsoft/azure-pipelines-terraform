import { getFederatedToken } from "azure-pipelines-tasks-artifacts-common/webapi";

export async function generateIdToken(connectedService : string): Promise<string> {
    let tokenGenerator = new TokenGenerator();
    return await tokenGenerator.generate(connectedService);
}

export interface ITokenGenerator {
    generate(connectedService : string): Promise<string>;
}

export class TokenGenerator implements ITokenGenerator {
    public async generate(connectedService : string): Promise<string> {
        const token = await getFederatedToken(connectedService);
        console.log('##vso[task.setsecret]' + token);
        return token;
    }
}
