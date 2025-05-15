import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import * as path from 'path';

describe('Terraform Test Suite', function () {

    before(() => {
        //NOTE: This is here because when debugging in VSCode this is populated and the spawn() method in the testing framework which starts a new NodeJS process does not handle the path with spaces that is set in it.
        delete process.env.NODE_OPTIONS
    });

    after(() => {});

    /* terraform init tests */

    function runValidations(validator: () => void, tr: ttm.MockTestRunner) {
        try {
            validator();
        }
        catch (error) {
            console.log("STDERR", tr.stderr);
            console.log("STDOUT", tr.stdout);
            throw error;
        }
    }

    it('azure init should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureInitSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AzureInitSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr)
    });

    it('azure init should succeed with no additional args and default settings', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessNoAdditionalArgsAndDefaultSettings.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureInitSuccessNoAdditionalArgsAndDefaultSettingsL0 should have succeeded.'), 'Should have printed: AzureInitSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr)
    });

    it('azure init should succeed with lower case authentication scheme', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessLowerCaseAuthenticationScheme.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureInitSuccessLowerCaseAuthenticationSchemeL0 should have succeeded.'), 'Should have printed: AzureInitSuccessLowerCaseAuthenticationSchemeL0 should have succeeded.');
        }, tr)

    });

    it('azure init should succeed with missing authentication scheme', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessMissingAuthenticationScheme.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureInitSuccessMissingAuthenticationSchemeL0 should have succeeded.'), 'Should have printed: AzureInitSuccessMissingAuthenticationSchemeL0 should have succeeded.');
        }, tr);
    });


    it('azure init should succeed with malformed authentication scheme', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessMalformedAuthenticationScheme.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureInitSuccessMalformedAuthenticationSchemeL0 should have succeeded.'), 'Should have printed: AzureInitSuccessMalformedAuthenticationSchemeL0 should have succeeded.');
        }, tr);
    });

    it('azure init should succeed with authentication scheme ManagedServiceIdentity', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessAuthenticationSchemeManagedServiceIdentity.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureInitSuccessAuthenticationSchemeManagedServiceIdentityL0 should have succeeded.'), 'Should have printed: AzureInitSuccessAuthenticationSchemeManagedServiceIdentityL0 should have succeeded.');
        }, tr);
    });

    it('azure init should succeed with authentication scheme ManagedServiceIdentity and DefaultSettings', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessAuthenticationSchemeManagedServiceIdentityAndDefaultSettings.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureInitSuccessAuthenticationSchemeManagedServiceIdentityAndDefaultSettingsL0 should have succeeded.'), 'Should have printed: AzureInitSuccessAuthenticationSchemeManagedServiceIdentityAndDefaultSettingsL0 should have succeeded.');
        }, tr);
    });

    it('azure init should succeed with authentication scheme WorkloadIdentityFederation', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederation.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationL0 should have succeeded.'), 'Should have printed: AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationL0 should have succeeded.');
        }, tr);
    });

    it('azure init should succeed with authentication scheme WorkloadIdentityFederation and default settings', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationAndDefaultSettings.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationAndDefaultSettingsL0 should have succeeded.'), 'Should have printed: AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationAndDefaultSettingsL0 should have succeeded.');
        }, tr);
    });

    it('azure init should succeed with authentication scheme WorkloadIdentityFederation and id token fallback', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationAndIDTokenFallback.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationAndIDTokenFallbackL0 should have succeeded.'), 'Should have printed: AzureInitSuccessAuthenticationSchemeWorkloadIdentityFederationAndIDTokenFallbackL0 should have succeeded.');
        }, tr);
    });

    it('azure init should succeed with additional args', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureInitSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: AzureInitSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('azure init should succeed with empty working directory', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitSuccessEmptyWorkingDir.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureInitSuccessEmptyWorkingDirL0 should have succeeded.'), 'Should have printed: AzureInitSuccessEmptyWorkingDirL0 should have succeeded.');
        }, tr);
    });

    it('azure init should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './InitTests/Azure/AzureInitFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('There are some problems with the configuration, described below.\n\nThe Terraform configuration must be valid before initialization so that Terraform can determine which modules and providers need to be installed.'), 'Should have shown error message');
        }, tr);
    });

    it('aws init should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './InitTests/AWS/AWSInitSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSInitSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AWSInitSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('aws init should succeed with additional args', async () => {
        let tp = path.join(__dirname, './InitTests/AWS/AWSInitSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSInitSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: AWSInitSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('aws init should succeed with empty working directory', async () => {
        let tp = path.join(__dirname, './InitTests/AWS/AWSInitSuccessEmptyWorkingDir.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSInitSuccessEmptyWorkingDirL0 should have succeeded.'), 'Should have printed: AWSInitSuccessEmptyWorkingDirL0 should have succeeded.');
        }, tr);
    });

    it('aws init should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './InitTests/AWS/AWSInitFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('There are some problems with the configuration, described below.\n\nThe Terraform configuration must be valid before initialization so that Terraform can determine which modules and providers need to be installed.'), 'Should have shown error message');
        }, tr);
    });

    it('gcp init should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './InitTests/GCP/GCPInitSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPInitSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: GCPInitSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('gcp init should succeed with additional args', async () => {
        let tp = path.join(__dirname, './InitTests/GCP/GCPInitSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPInitSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: GCPInitSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('gcp init should succeed with empty working directory', async () => {
        let tp = path.join(__dirname, './InitTests/GCP/GCPInitSuccessEmptyWorkingDir.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPInitSuccessEmptyWorkingDirL0 should have succeeded.'), 'Should have printed: GCPInitSuccessEmptyWorkingDirL0 should have succeeded.');
        }, tr);
    });

    it('gcp init should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './InitTests/GCP/GCPInitFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('There are some problems with the configuration, described below.\n\nThe Terraform configuration must be valid before initialization so that Terraform can determine which modules and providers need to be installed.'), 'Should have shown error message');
        }, tr);
    });

    /* terraform validate tests */

    it('azure validate should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './ValidateTests/Azure/AzureValidateSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureValidateSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AzureValidateSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('azure validate should succeed with additional args', async () => {
        let tp = path.join(__dirname, './ValidateTests/Azure/AzureValidateSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureValidateSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: AzureValidateSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('azure validate should succeed with empty working directory', async () => {
        let tp = path.join(__dirname, './ValidateTests/Azure/AzureValidateSuccessEmptyWorkingDir.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureValidateSuccessEmptyWorkingDirL0 should have succeeded.'), 'Should have printed: AzureValidateSuccessEmptyWorkingDirL0 should have succeeded.');
        }, tr);
    });

    it('azure validate should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './ValidateTests/Azure/AzureValidateFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('aws validate should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './ValidateTests/AWS/AWSValidateSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSValidateSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AWSValidateSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('aws validate should succeed with additional args', async () => {
        let tp = path.join(__dirname, './ValidateTests/AWS/AWSValidateSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSValidateSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: AWSValidateSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('aws validate should succeed with empty working directory', async () => {
        let tp = path.join(__dirname, './ValidateTests/AWS/AWSValidateSuccessEmptyWorkingDir.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSValidateSuccessEmptyWorkingDirL0 should have succeeded.'), 'Should have printed: AWSValidateSuccessEmptyWorkingDirL0 should have succeeded.');
        }, tr);
    });

    it('aws validate should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './ValidateTests/AWS/AWSValidateFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('gcp validate should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './ValidateTests/GCP/GCPValidateSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPValidateSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: GCPValidateSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('gcp validate should succeed with additional args', async () => {
        let tp = path.join(__dirname, './ValidateTests/GCP/GCPValidateSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPValidateSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: GCPValidateSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('gcp validate should succeed with empty working directory', async () => {
        let tp = path.join(__dirname, './ValidateTests/GCP/GCPValidateSuccessEmptyWorkingDir.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPValidateSuccessEmptyWorkingDirL0 should have succeeded.'), 'Should have printed: GCPValidateSuccessEmptyWorkingDirL0 should have succeeded.');
        }, tr);
    });

    it('gcp validate should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './ValidateTests/GCP/GCPValidateFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 1, 'tool should have been invoked one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    /* terraform plan tests */

    it('azure plan should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './PlanTests/Azure/AzurePlanSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzurePlanSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AzurePlanSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('azure plan should succeed with additional args', async () => {
        let tp = path.join(__dirname, './PlanTests/Azure/AzurePlanSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzurePlanSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: AzurePlanSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('azure plan should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './PlanTests/Azure/AzurePlanFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('azure plan should fail with empty working directory', async () => {
        let tp = path.join(__dirname, './PlanTests/Azure/AzurePlanFailEmptyWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('Error: No configuration files'), 'Should have shown error message');
        }, tr);
    });

    it('aws plan should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './PlanTests/AWS/AWSPlanSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSPlanSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AWSPlanSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('aws plan should succeed with additional args', async () => {
        let tp = path.join(__dirname, './PlanTests/AWS/AWSPlanSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSPlanSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: AWSPlanSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('aws plan should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './PlanTests/AWS/AWSPlanFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('aws plan should fail with empty working directory', async () => {
        let tp = path.join(__dirname, './PlanTests/AWS/AWSPlanFailEmptyWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Error: No configuration files'), 'Should have shown error message');
        }, tr);
    });

    it('gcp plan should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './PlanTests/GCP/GCPPlanSuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPPlanSuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: GCPPlanSuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('gcp plan should succeed with additional args', async () => {
        let tp = path.join(__dirname, './PlanTests/GCP/GCPPlanSuccessAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPPlanSuccessAdditionalArgsL0 should have succeeded.'), 'Should have printed: GCPPlanSuccessAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('gcp plan should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './PlanTests/GCP/GCPPlanFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('gcp plan should fail with empty working directory', async () => {
        let tp = path.join(__dirname, './PlanTests/GCP/GCPPlanFailEmptyWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Error: No configuration files'), 'Should have shown error message');
        }, tr);
    });

    /* terraform apply tests */

    it('azure apply should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './ApplyTests/Azure/AzureApplySuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warnings');
            assert(tr.stdOutContained('AzureApplySuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AzureApplySuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('azure apply should succeed with authentication scheme ManagedServiceIdentity', async () => {
        let tp = path.join(__dirname, './ApplyTests/Azure/AzureApplySuccessAuthenticationSchemeManagedServiceIdentity.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureApplySuccessAuthenticationSchemeManagedServiceIdentityL0 should have succeeded.'), 'Should have printed: AzureApplySuccessAuthenticationSchemeManagedServiceIdentityL0 should have succeeded.');
        }, tr);
    });

    it('azure apply should succeed with authentication scheme WorkloadIdentityFederation', async () => {
        let tp = path.join(__dirname, './ApplyTests/Azure/AzureApplySuccessAuthenticationSchemeWorkloadIdentityFederation.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AzureApplySuccessAuthenticationSchemeWorkloadIdentityFederationL0 should have succeeded.'), 'Should have printed: AzureApplySuccessAuthenticationSchemeWorkloadIdentityFederationL0 should have succeeded.');
        }, tr);
    });

    it('azure apply should succeed with additional args with -auto-approve', async () => {
        let tp = path.join(__dirname, './ApplyTests/Azure/AzureApplySuccessAdditionalArgsWithAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureApplySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.'), 'Should have printed: AzureApplySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('azure apply should succeed with additional args without -auto-approve', async () => {
        let tp = path.join(__dirname, './ApplyTests/Azure/AzureApplySuccessAdditionalArgsWithoutAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.'), 'Should have printed: AzureApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('azure apply should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './ApplyTests/Azure/AzureApplyFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('azure apply should fail with empty working directory', async () => {
        let tp = path.join(__dirname, './ApplyTests/Azure/AzureApplyFailEmptyWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('Error: No configuration files'), 'Should have shown error message');
        }, tr);
    });

    it('aws apply should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './ApplyTests/AWS/AWSApplySuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSApplySuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AWSApplySuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('aws apply should succeed with additional args with -auto-approve', async () => {
        let tp = path.join(__dirname, './ApplyTests/AWS/AWSApplySuccessAdditionalArgsWithAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSApplySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.'), 'Should have printed: AWSApplySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('aws apply should succeed with additional args without -auto-approve', async () => {
        let tp = path.join(__dirname, './ApplyTests/AWS/AWSApplySuccessAdditionalArgsWithoutAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.'), 'Should have printed: AWSApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('aws apply should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './ApplyTests/AWS/AWSApplyFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('aws apply should fail with empty working directory', async () => {
        let tp = path.join(__dirname, './ApplyTests/AWS/AWSApplyFailEmptyWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Error: No configuration files'), 'Should have shown error message');
        }, tr);
    });

    it('gcp apply should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './ApplyTests/GCP/GCPApplySuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPApplySuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: GCPApplySuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('gcp apply should succeed with additional args with -auto-approve', async () => {
        let tp = path.join(__dirname, './ApplyTests/GCP/GCPApplySuccessAdditionalArgsWithAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPApplySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.'), 'Should have printed: GCPApplySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('gcp apply should succeed with additional args without -auto-approve', async () => {
        let tp = path.join(__dirname, './ApplyTests/GCP/GCPApplySuccessAdditionalArgsWithoutAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.'), 'Should have printed: GCPApplySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('gcp apply should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './ApplyTests/GCP/GCPApplyFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('gcp apply should fail with empty working directory', async () => {
        let tp = path.join(__dirname, './ApplyTests/GCP/GCPApplyFailEmptyWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Error: No configuration files'), 'Should have shown error message');
        }, tr);
    });

    /* terraform destroy tests */

    it('azure destroy should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './DestroyTests/Azure/AzureDestroySuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureDestroySuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AzureDestroySuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('azure destroy should succeed with additional args with -auto-approve', async () => {
        let tp = path.join(__dirname, './DestroyTests/Azure/AzureDestroySuccessAdditionalArgsWithAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureDestroySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.'), 'Should have printed: AzureDestroySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('azure destroy should succeed with additional args without -auto-approve', async () => {
        let tp = path.join(__dirname, './DestroyTests/Azure/AzureDestroySuccessAdditionalArgsWithoutAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('AzureDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.'), 'Should have printed: AzureDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('azure destroy should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './DestroyTests/Azure/AzureDestroyFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 1, 'should have 1 warning');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('aws destroy should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './DestroyTests/AWS/AWSDestroySuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSDestroySuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: AWSDestroySuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('aws destroy should succeed with additional args with -auto-approve', async () => {
        let tp = path.join(__dirname, './DestroyTests/AWS/AWSDestroySuccessAdditionalArgsWithAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSDestroySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.'), 'Should have printed: AWSDestroySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('aws destroy should succeed with additional args without -auto-approve', async () => {
        let tp = path.join(__dirname, './DestroyTests/AWS/AWSDestroySuccessAdditionalArgsWithoutAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('AWSDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.'), 'Should have printed: AWSDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('aws destroy should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './DestroyTests/AWS/AWSDestroyFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    it('gcp destroy should succeed with no additional args', async () => {
        let tp = path.join(__dirname, './DestroyTests/GCP/GCPDestroySuccessNoAdditionalArgs.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPDestroySuccessNoAdditionalArgsL0 should have succeeded.'), 'Should have printed: GCPDestroySuccessNoAdditionalArgsL0 should have succeeded.');
        }, tr);
    });

    it('gcp destroy should succeed with additional args with -auto-approve', async () => {
        let tp = path.join(__dirname, './DestroyTests/GCP/GCPDestroySuccessAdditionalArgsWithAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPDestroySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.'), 'Should have printed: GCPDestroySuccessAdditionalArgsWithAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('gcp destroy should succeed with additional args without -auto-approve', async () => {
        let tp = path.join(__dirname, './DestroyTests/GCP/GCPDestroySuccessAdditionalArgsWithoutAutoApprove.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('GCPDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.'), 'Should have printed: GCPDestroySuccessAdditionalArgsWithoutAutoApproveL0 should have succeeded.');
        }, tr);
    });

    it('gcp destroy should fail with invalid working directory', async () => {
        let tp = path.join(__dirname, './DestroyTests/GCP/GCPDestroyFailInvalidWorkingDirectory.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.failed, 'task should have failed');
            assert(tr.invokedToolCount === 2, 'tool should have been invoked two times. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 1, 'should have one error');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
            assert(tr.stdOutContained('Execution failed: invalid config files'), 'Should have shown error message');
        }, tr);
    });

    /* test for multiple providers */

    it('warnIfMultipleProviders should not warn for single provider', async () => {
        let tp = path.join(__dirname, './MultipleProviderTests/SingleProviderNoWarning.js');
        let tr : ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'should have invoked tool one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 0, 'should have no warnings');
        }, tr);
    });

    it('warnIfMultipleProviders should warn correctly for multiple providers', async () => {
        let tp = path.join(__dirname, './MultipleProviderTests/MultipleProviderWarning.js');
        let tr : ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.succeeded, 'task should have succeeded');
            assert(tr.invokedToolCount === 1, 'should have invoked tool one time. actual: ' + tr.invokedToolCount);
            assert(tr.errorIssues.length === 0, 'should have no errors');
            assert(tr.warningIssues.length === 1, 'should have one warning');
            assert(tr.createdWarningIssue('Multiple provider blocks specified in the .tf files in the current working directory.'), 'Should have created warning: Multiple provider blocks specified in the .tf files in the current working drectory.');
        }, tr);
    });

    /* test for compareVersions method of BaseTerraformCommandHandler class */

    it('compareVersions should compare two versions correctly', async () => {
        let tp = path.join(__dirname, './L0CompareVersions.js');
        let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

        await tr.runAsync();

        runValidations(() => {
            assert(tr.stdOutContained('compareVersions("0.20.7", "0.20.8") should have been -1') , 'Should have printed: compareVersions("0.20.7", "0.20.8") should have been -1'+tr.stdout);
            assert(tr.stdOutContained('compareVersions("0.20.9", "0.20.8") should have been 1') , 'Should have printed: compareVersions("0.20.9", "0.20.8") should have been 1');
            assert(tr.stdOutContained('compareVersions("0.2.9", "0.2.9") should have been 0') , 'Should have printed: compareVersions("0.2.9", "0.2.9") should have been 0');
            assert(tr.stdOutContained('compareVersions("0.20.9", "0.20.09") should have been 0') , 'Should have printed: compareVersions("0.20.9", "0.20.09") should have been 0');
            assert(tr.stdOutContained('compareVersions("0.21.9", "0.20.9") should have been 1') , 'Should have printed: compareVersions("0.21.9", "0.20.9") should have been 1');
            assert(tr.stdOutContained('compareVersions("1.20.10", "0.20.11") should have been 1') , 'Should have printed: compareVersions("1.20.10", "0.20.11") should have been 1');
        }, tr);
    });

});