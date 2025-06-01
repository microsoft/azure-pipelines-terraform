import { default as AnsiUp } from 'ansi_up';
import { Card } from "azure-devops-ui/Card";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { Observer } from "azure-devops-ui/Observer";
import * as React from "react";
import "./plan-summary-tab.scss";
import { IListBoxItem } from 'azure-devops-ui/ListBox';
import { IAttachmentService } from '../services/attachments';
import { formatPlanForDisplay } from '../services/plan-formatter';

interface TerraformPlan {
    name: string,
    plan: string,
}

export const NoPublishedPlanMessage = "No terraform plans have been published for this pipeline run. The terraform task must run 'show' with '-json' output format to view plans.";
export const LoadingMessage = "Loading terraform plans...";
export const ErrorLoadingMessage = "An error occurred while loading terraform plans. Check the browser console for more details.";

export default class TerraformPlanDisplay extends React.Component<{ attachments: IAttachmentService }> {

    private readonly attachments: IAttachmentService
    private readonly terraformPlanAttachmentType: string = "terraform-plan-results"

    private plansLoaded = new ObservableValue(false);
    private hasError = new ObservableValue(false);
    private planSelection = new DropdownSelection();
    private chosenPlan = new ObservableValue(-1);
    private plans = new ObservableArray<TerraformPlan>([]);

    constructor(props: { attachments: IAttachmentService } | Readonly<{ attachments: IAttachmentService }>) {
        super(props)
        this.attachments = props.attachments        
    }

    public async componentDidMount() {
        console.log("TerraformPlanDisplay: Component mounting");
        let foundPlans: TerraformPlan[] = [];
        
        try {
            console.log(`Looking for attachments of type: ${this.terraformPlanAttachmentType}`);
            const attachments = await this.attachments.getAttachments(this.terraformPlanAttachmentType);
            console.log(`Retrieved ${attachments?.length || 0} attachments`);
            
            if (attachments && attachments.length > 0) {
                attachments.forEach(attachment => {
                    console.log(`Processing attachment: ${attachment.name}, content length: ${attachment.content?.length || 0} bytes`);
                    if (attachment.content) {
                        foundPlans.push({ name: attachment.name, plan: attachment.content});
                    } else {
                        console.warn(`Attachment ${attachment.name} has no content`);
                    }
                });
            } else {
                console.log("No attachments found or empty attachments array returned");
            }
            
            console.log(`Total plans found: ${foundPlans.length}`);
            
            if (foundPlans.length > 0) {
                this.plans.change(0, ...foundPlans);
                const initialSelection = foundPlans.length - 1;
                this.planSelection.select(initialSelection);
                this.chosenPlan.value = initialSelection;
            }
        } catch (error) {
            console.error(`Error loading terraform plans: ${error}`);
            this.hasError.value = true;
        } finally {
            this.plansLoaded.value = true;
            console.log("TerraformPlanDisplay: Component mounted");
        }
    }

    private onSelect = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) => {
        this.chosenPlan.value = parseInt(item.id);
    }

    public render(): JSX.Element {
        return (
            <div className="terraform-plan-container">
                <Card className="flex-grow flex-column"
                    titleProps={{ text: "Terraform plan output" }}>

                    <Observer chosenPlan={this.chosenPlan} plans={this.plans} plansLoaded={this.plansLoaded} hasError={this.hasError}>
                        {(props: { chosenPlan: number, plans: TerraformPlan[], plansLoaded: boolean, hasError: boolean }) => {
                            const planItems = props.plans.map((e: TerraformPlan, index: number) => {
                                return {
                                    id: index.toString(),
                                    text: e.name
                                }
                            });

                            let html = NoPublishedPlanMessage;

                            if (!props.plansLoaded) {
                                html = LoadingMessage;
                            } else if (props.hasError) {
                                html = ErrorLoadingMessage;
                            } else if (props.chosenPlan > -1) {
                                const planText = props.plans[props.chosenPlan].plan;
                                html = formatPlanForDisplay(planText);
                            }

                            let dropDown = props.plans.length > 1 ? (
                                <div className="flex-row plan-dropdown">
                                    <Dropdown
                                        ariaLabel="Select a plan"
                                        className="plan-dropdown"
                                        placeholder="Select a plan"
                                        items={planItems}
                                        selection={this.planSelection}
                                        onSelect={this.onSelect}
                                    />
                                </div>) : null

                            return (
                                <div className="flex-column">
                                    {dropDown}
                                    <div className="flex-row plan-content">
                                        <div dangerouslySetInnerHTML={{ __html: html }} />
                                    </div>
                                </div>
                            )
                        }}
                    </Observer>
                </Card>
            </div>
        );
    }
}
