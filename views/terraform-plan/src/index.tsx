import React from 'react';
import ReactDOM from "react-dom";
import * as SDK from "azure-devops-extension-sdk";
import TerraformPlanDisplay from "./plan-summary-tab/plan-summary-tab";
import { MockAttachmentService, AzdoAttachmentService, IAttachmentService } from './services/attachments';

const renderComponent = (attachments: IAttachmentService) => {
    ReactDOM.render(<TerraformPlanDisplay attachments={attachments} />, document.getElementById("root"));
}

// For local testing
if (process.env.NODE_ENV === "development") {

    const mockAttachments = new MockAttachmentService();
    const testData = require('./plan-summary-tab/test-data');
    mockAttachments.setAttachments(
        {
            name: 'test_deploy.tfplan',
            type: 'terraform-plan-results',
            content: testData.examplePlan1
        }, 
        {
            name: 'stage_deploy.tfplan',
            type: 'terraform-plan-results',
            content: testData.examplePlan2
        }
    );
    renderComponent(mockAttachments);
} else {    
    SDK.init().then(() => {
        try {
            // The task ID must match the ID in your task.json
            const taskId: string = "FE504ACC-6115-40CB-89FF-191386B5E7BF"; // Task ID from TerraformTaskV5/task.json
            console.log("SDK initialized successfully");
            // Log SDK configuration information
            try {
                const config = SDK.getConfiguration();
                console.log("SDK configuration:", JSON.stringify(config));
            } catch (configError) {
                console.log("Error getting SDK configuration:", configError);
            }
            
            const azdoAttachments = new AzdoAttachmentService(taskId);
            renderComponent(azdoAttachments);
        } catch (error) {
            console.error("Error initializing the Azure DevOps extension:", error);
            // Display an error message instead of failing silently
            document.getElementById("root")!.innerHTML = 
                `<div style="padding: 20px; color: #a80000;">
                    <h2>Error Loading Extension</h2>
                    <p>There was a problem loading the Terraform Plan view. Please try refreshing the page.</p>
                    <details>
                        <summary>Technical details</summary>
                        <pre>${error instanceof Error ? error.message : String(error)}</pre>
                    </details>
                </div>`;
        }
    }).catch(error => {
        console.error("SDK initialization failed:", error);
        // Display an error message
        document.getElementById("root")!.innerHTML = 
            `<div style="padding: 20px; color: #a80000;">
                <h2>Extension Initialization Failed</h2>
                <p>Could not initialize the Azure DevOps extension. This may be due to missing permissions or network issues.</p>
                <details>
                    <summary>Technical details</summary>
                    <pre>${error instanceof Error ? error.message : String(error)}</pre>
                </details>
            </div>`;
    });
}
