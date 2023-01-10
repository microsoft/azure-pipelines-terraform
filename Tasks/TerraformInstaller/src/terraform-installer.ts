import tasks = require('azure-pipelines-task-lib/task');
import tools = require('azure-pipelines-tool-lib/tool');
import path = require('path');
import os = require('os');
import fs = require('fs');

const uuidV4 = require('uuid/v4');
const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');

const terraformToolName = "terraform";
const isWindows = os.type().match(/^Win/);
const proxy = tasks.getHttpProxyConfiguration();
export async function downloadTerraform(inputVersion: string): Promise<string> {
    var latestVersion: string = "";
    if(inputVersion.toLowerCase() === 'latest') {
        console.log(tasks.loc("GettingLatestTerraformVersion"));
        if(proxy == null){
            await fetch('https://checkpoint-api.hashicorp.com/v1/check/terraform')
            .then((response: { json: () => any; }) => response.json())
            .then((data: { [x: string]: any; }) => {
                latestVersion = data.current_version;
            })
            .catch((exception: any) => {
                console.warn(tasks.loc("TerraformVersionNotFound"));

                latestVersion = '1.1.6';
            })
        }
        else
        {

            var proxyUrl = proxy.proxyUsername !="" ? proxy.proxyUrl.split("://")[0] + '://' + proxy.proxyUsername + ':' + proxy.proxyPassword + '@' + proxy.proxyUrl.split("://")[1]:proxy.proxyUrl;
            var proxyAgent = new HttpsProxyAgent(proxyUrl);
            await fetch('https://checkpoint-api.hashicorp.com/v1/check/terraform', { agent: proxyAgent})
            .then((response: { json: () => any; }) => response.json())
            .then((data: { [x: string]: any; }) => {
                latestVersion = data.current_version;
            })
            .catch((exception: any) => {
                console.warn(tasks.loc("TerraformVersionNotFound"));
                latestVersion = '1.1.6';
            })
        }
    }
    var version = latestVersion != "" ? tools.cleanVersion(latestVersion) : tools.cleanVersion(inputVersion);

    if (!version) {
        throw new Error(tasks.loc("InputVersionNotValidSemanticVersion", inputVersion));
    }

    let cachedToolPath = tools.findLocalTool(terraformToolName, version);
    if (!cachedToolPath) {
        let terraformDownloadUrl = getTerraformDownloadUrl(version);
        let fileName = `${terraformToolName}-${version}-${uuidV4()}.zip`;
        let terraformDownloadPath;

        try {
            terraformDownloadPath = await tools.downloadTool(terraformDownloadUrl, fileName);
        } catch (exception) {
            throw new Error(tasks.loc("TerraformDownloadFailed", terraformDownloadUrl, exception));
        }

        let terraformUnzippedPath = await tools.extractZip(terraformDownloadPath);
        cachedToolPath = await tools.cacheDir(terraformUnzippedPath, terraformToolName, version);
    }

    let terraformPath = findTerraformExecutable(cachedToolPath);
    if (!terraformPath) {
        throw new Error(tasks.loc("TerraformNotFoundInFolder", cachedToolPath));
    }

    if (!isWindows) {
        fs.chmodSync(terraformPath, "777");
    }

    tasks.setVariable('terraformLocation', terraformPath);

    return terraformPath;
}

function getTerraformDownloadUrl(version: string): string {
    let platform: string;
    let architecture: string;

    switch(os.type()) {
        case "Darwin":
            platform = "darwin";
            break;
        
        case "Linux":
            platform = "linux";
            break;
        
        case "Windows_NT":
            platform = "windows";
            break;
        
        default:
            throw new Error(tasks.loc("OperatingSystemNotSupported", os.type()));
    }

    switch(os.arch()) {
        case "x64":
            architecture = "amd64";
            break;
        
        case "x32":
            architecture = "386";
            break;
            
         case "arm64":
            architecture = "arm64";
            break;
            
         case "arm":
            architecture = "arm";
            break;
            
        default:
            throw new Error(tasks.loc("ArchitectureNotSupported", os.arch()));
    }

    return `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${platform}_${architecture}.zip`;
}

function findTerraformExecutable(rootFolder: string): string {
    let terraformPath = path.join(rootFolder, terraformToolName + getExecutableExtension());
    var allPaths = tasks.find(rootFolder);
    var matchingResultFiles = tasks.match(allPaths, terraformPath, rootFolder);
    return matchingResultFiles[0];
}

function getExecutableExtension(): string {
    if (isWindows) {
        return ".exe";
    }

    return "";

}
