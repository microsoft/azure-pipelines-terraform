import tasks = require('azure-pipelines-task-lib/task');
import { getHandlerFromToken, WebApi } from "azure-devops-node-api";
import { ITaskApi } from "azure-devops-node-api/TaskApi";

export async function generateIdToken(connectedService : string): Promise<string> {
    let tokenGenerator = new TokenGenerator();
    return await tokenGenerator.generate(connectedService);
}

export interface ITokenGenerator {
    generate(connectedService : string): Promise<string>;
}

export class TokenGenerator implements ITokenGenerator {
    public async generate(connectedService : string): Promise<string> {
        return await this.getIdToken(connectedService);
    }

    private async getIdToken(connectedService: string) : Promise<string> {
      const jobId = tasks.getVariable("System.JobId");
      const planId = tasks.getVariable("System.PlanId");
      const projectId = tasks.getVariable("System.TeamProjectId");
      const hub = tasks.getVariable("System.HostType");
      const uri = tasks.getVariable("System.CollectionUri");
      const token = this.getSystemAccessToken();

      const authHandler = getHandlerFromToken(token);
      const connection = new WebApi(uri, authHandler);
      const api: ITaskApi = await connection.getTaskApi();
      const response = await api.createOidcToken({}, projectId, hub, planId, jobId, connectedService);
      if (response == null) {
          return null;
      }

      return response.oidcToken;
  }

  private getSystemAccessToken() : string {
      tasks.debug('Getting credentials for local feeds');
      const auth = tasks.getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
      if (auth.scheme === 'OAuth') {
          tasks.debug('Got auth token');
          return auth.parameters['AccessToken'];
      }
      else {
          tasks.warning('Could not determine credentials to use');
      }
  }
}