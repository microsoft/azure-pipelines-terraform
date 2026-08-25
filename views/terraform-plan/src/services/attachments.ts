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

// Matches the host itself or any subdomain of it, so that <org>.visualstudio.com is
// recognised while a lookalike such as evil-visualstudio.com is not.
const ALLOWED_HOSTS = ['visualstudio.com', 'dev.azure.com'];

function isAllowedHost(hostname: string): boolean {
    return ALLOWED_HOSTS.some(host => hostname === host || hostname.endsWith(`.${host}`));
}

export class AzdoAttachmentService implements IAttachmentService {
    private readonly buildClient: BuildRestClient;

    constructor() {
        this.buildClient = getClient(BuildRestClient);
    }

    async getAttachments(type: string): Promise<Attachment[]> {
        const attachments: Attachment[] = [];
        try {
            const buildInfo = await this.getThisBuildInfo();
            const azdoAttachments = await this.getPlanAttachmentNames(buildInfo.projectId, buildInfo.buildId, type);

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
            // Re-throw so the caller can tell a genuine failure (build context,
            // permissions, API errors) apart from a run with no published plans.
            console.error(`Error in getAttachments: ${e}`);
            throw e;
        }

        return attachments;
    }

    private async getThisBuildInfo(): Promise<ThisBuildInfo> {
        // SDK.init() is awaited by the caller in index.tsx before this service is built.
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        const buildService = await SDK.getService<IBuildPageDataService>(BuildServiceIds.BuildPageDataService);
        const projectFromContext = await projectService.getProject();
        const buildFromContext = await buildService.getBuildPageData();

        if (!projectFromContext || !buildFromContext) {
            throw new Error('Not running in Azure DevOps context.');
        }

        if (!buildFromContext.build?.id) {
            throw new Error('Cannot get build from page data');
        }

        return {
            projectId: projectFromContext.id,
            buildId: buildFromContext.build.id
        };
    }

    private async getPlanAttachmentNames(project: string, buildId: number, attachmentType: string): Promise<AzdoAttachment[]> {
        const attachments = await this.buildClient.getAttachments(
            project,
            buildId,
            attachmentType
        );

        return attachments.map(a => {
            const attachmentUrl = urlparse(a._links.self.href);
            const segments = attachmentUrl.pathname.split('/').filter(s => s.length > 0);
            const isVSTSUrl = isAllowedHost(attachmentUrl.hostname);

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

                if (isVSTSUrl) {
                    // Best-effort fallback for the classic *.visualstudio.com layout:
                    //   /<collection>/<project>/_apis/build/builds/<buildId>/<timelineId>/<recordId>/...
                    //        [0]         [1]      [2]    [3]    [4]     [5]        [6]         [7]
                    // Only reached when the segment scan above failed to locate _apis/build/builds,
                    // so treat these positions as a guess rather than a guarantee.
                    const VSTS_PROJECT = 1, VSTS_BUILD_ID = 5, VSTS_TIMELINE_ID = 6, VSTS_RECORD_ID = 7;
                    return {
                        projectId: segments[VSTS_PROJECT],
                        buildId: Number.parseInt(segments[VSTS_BUILD_ID]),
                        timelineId: segments[VSTS_TIMELINE_ID],
                        recordId: segments[VSTS_RECORD_ID],
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
            console.error(`Error fetching attachment content: ${error instanceof Error ? error.message : String(error)}`);
            console.error(`Failed URL: ${attachment.href}`);
            throw error;
        }
    }
}
