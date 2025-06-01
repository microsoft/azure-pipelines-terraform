import * as SDK from "azure-devops-extension-sdk";
import { BuildRestClient, BuildServiceIds, IBuildPageDataService } from "azure-devops-extension-api/Build";
import { CommonServiceIds, getClient, IProjectPageService } from "azure-devops-extension-api";
import urlparse from "url-parse";

export interface Attachment {
    name: string;
    type: string;
    content: string;
    timelineId?: string;
    recordId?: string;
}

export interface IAttachmentService {
    getAttachments(attachmentType: string): Promise<Attachment[]>;
}

export class MockAttachmentService implements IAttachmentService {
    private attachments: Attachment[] = [];

    constructor() {}

    setAttachments(...attachments: Attachment[]) {
        this.attachments = attachments;
    }

    async getAttachments(attachmentType: string): Promise<Attachment[]> {
        return this.attachments.filter(a => a.type === attachmentType);
    }
}

interface ThisBuildInfo {
    projectId: string;
    buildId: number;
}

interface AzdoAttachment {
    projectId: string;
    buildId: number;
    timelineId: string;
    recordId: string;
    name: string;
    href: string;
    type: string;
}

export class AzdoAttachmentService implements IAttachmentService {
    private readonly buildClient: BuildRestClient;

    constructor(private readonly taskId: string) {
        this.buildClient = getClient(BuildRestClient);
        console.log(`AzdoAttachmentService initialized with task ID: ${this.taskId}`);
    }

    async getAttachments(type: string): Promise<Attachment[]> {
        const attachments: Attachment[] = [];
        try {
            const buildInfo = await this.getThisBuildInfo();
            console.log(`Successfully retrieved build info: Project ID=${buildInfo.projectId}, Build ID=${buildInfo.buildId}`);
            
            const azdoAttachments = await this.getPlanAttachmentNames(buildInfo.projectId, buildInfo.buildId, type);
            
            console.log(`Found ${azdoAttachments.length} attachments for type ${type}`);
            
            if (azdoAttachments.length > 0) {
                console.log(`First attachment details: ${JSON.stringify({
                    name: azdoAttachments[0].name,
                    projectId: azdoAttachments[0].projectId,
                    buildId: azdoAttachments[0].buildId,
                    type: azdoAttachments[0].type,
                    href: azdoAttachments[0].href
                })}`);
            }
            
            // Process each attachment sequentially
            for (const a of azdoAttachments) {
                try {
                    const content = await this.getAttachmentContent(a);
                    attachments.push({
                        name: a.name,
                        type: a.type,
                        content,
                        timelineId: a.timelineId,
                        recordId: a.recordId
                    });
                } catch (e) {
                    console.error(`Failed to get content for attachment ${a.name}: ${e}`);
                }
            }
        } catch (e) {
            console.error(`Error in getAttachments: ${e}`);
        }
        
        return attachments;
    }

    private async getThisBuildInfo(): Promise<ThisBuildInfo> {
        await SDK.init();
        
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const buildService = await SDK.getService<IBuildPageDataService>(BuildServiceIds.BuildPageDataService);
        const projectFromContext = await projectService.getProject();
        const buildFromContext = await buildService.getBuildPageData();
        
        if (!projectFromContext || !buildFromContext) {
            throw new Error('Not running in Azure DevOps context.');
        } else {
            console.log(`Running for project ${projectFromContext.id} and build ${buildFromContext.build?.id.toString()}`);
        }
        
        if (!buildFromContext.build?.id) {
            console.log("Cannot get build id.");
            throw new Error('Cannot get build from page data');
        }
        
        const buildId = buildFromContext.build.id;
        
        return {
            projectId: projectFromContext.id,
            buildId: buildId
        };
    }

    private async getPlanAttachmentNames(project: string, buildId: number, attachmentType: string): Promise<AzdoAttachment[]> {
        console.log(`Getting attachments for project: ${project}, build: ${buildId}, type: ${attachmentType}`);
        
        const attachments = await this.buildClient.getAttachments(
            project,
            buildId,
            attachmentType
        );
        
        console.log(`Raw attachments count: ${attachments.length}`);
        
        return attachments.map(a => {
            const attachmentUrl = urlparse(a._links.self.href);
            console.log(`Parsing attachment URL: ${attachmentUrl.href}`);
            
            const segments = attachmentUrl.pathname.split('/').filter(s => s.length > 0);
            const allowedHosts = ['visualstudio.com', 'dev.azure.com'];
            const isVSTSUrl = allowedHosts.includes(attachmentUrl.hostname);
            
            // Determine the correct indices based on URL structure
            let projectIndex = -1;
            let buildIdIndex = -1;
            let timelineIdIndex = -1;
            let recordIdIndex = -1;
            
            // Find key segments in the URL
            for (let i = 0; i < segments.length; i++) {
                if (segments[i] === '_apis' && i + 1 < segments.length && segments[i + 1] === 'build' && i + 2 < segments.length && segments[i + 2] === 'builds') {
                    buildIdIndex = i + 3;
                    timelineIdIndex = i + 4;
                    recordIdIndex = i + 5;
                    break;
                }
            }
            
            // Find project index - it's usually before _apis
            for (let i = 0; i < segments.length; i++) {
                if (segments[i] === '_apis') {
                    projectIndex = i - 1;
                    break;
                }
            }
            
            // Ensure we found valid indices
            if (projectIndex < 0 || buildIdIndex < 0 || timelineIdIndex < 0 || recordIdIndex < 0) {
                console.error(`Failed to parse attachment URL: ${attachmentUrl.href}`);
                console.log(`URL segments: ${JSON.stringify(segments)}`);
                
                if (isVSTSUrl) {
                    // Fallback for VSTS URLs
                    return {
                        projectId: segments[1],
                        buildId: Number.parseInt(segments[5]),
                        timelineId: segments[6], 
                        recordId: segments[7],
                        name: a.name,
                        type: attachmentType,
                        href: a._links.self.href
                    };
                }
                
                // General fallback - use the project ID passed to the method
                return {
                    projectId: project,
                    buildId: buildId,
                    timelineId: segments[segments.length - 3] || "",
                    recordId: segments[segments.length - 2] || "",
                    name: a.name,
                    type: attachmentType,
                    href: a._links.self.href
                };
            }
            
            return {
                projectId: segments[projectIndex],
                buildId: Number.parseInt(segments[buildIdIndex]),
                timelineId: segments[timelineIdIndex],
                recordId: segments[recordIdIndex],
                name: a.name,
                type: attachmentType,
                href: a._links.self.href
            };
        });
    }

    private async getAttachmentContent(attachment: AzdoAttachment): Promise<string> {
        console.log(`Getting content for attachment: ${attachment.name}`);
        console.log(`Attachment details: projectId=${attachment.projectId}, buildId=${attachment.buildId}, timelineId=${attachment.timelineId}, recordId=${attachment.recordId}`);
        
        try {
            const content = await this.buildClient.getAttachment(
                attachment.projectId,
                attachment.buildId,
                attachment.timelineId,
                attachment.recordId,
                attachment.type,
                attachment.name
            );
            
            const td = new TextDecoder();
            return td.decode(content);
        } catch (error) {
            console.error(`Error fetching attachment content: ${error.message}`);
            console.error(`Failed URL: ${attachment.href}`);
            throw error;
        }
    }
}
