import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let tp = path.join(__dirname, './AWSApplySuccessAdditionalArgsWithoutAutoApproveL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'aws');
tr.setInput('command', 'apply');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('environmentServiceNameAWS', 'AWS');
tr.setInput('commandOptions', '-no-color');

process.env['ENDPOINT_AUTH_SCHEME_AWS'] = 'Basic';
process.env['ENDPOINT_AUTH_PARAMETER_AWS_USERNAME'] = 'DummyUsername';
process.env['ENDPOINT_AUTH_PARAMETER_AWS_PASSWORD'] = 'DummyPassword';
process.env['ENDPOINT_AUTH_PARAMETER_AWS_REGION'] = 'DummyRegion';

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    "which": {
        "terraform": "terraform"
    },
    "checkPath": {
        "terraform": true
    },
    "exec": {
        "terraform providers": {
            "code": 0,
            "stdout": "provider[registry.terraform.io/hashicorp/aws]"
        },
        "terraform apply -auto-approve -no-color": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform apply -auto-approve -no-color -input=false": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform apply -auto-approve -input=false -no-color": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform apply -input=false -auto-approve -no-color": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform apply -no-color -auto-approve -input=false": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform apply -no-color -input=false -auto-approve": {
            "code": 0,
            "stdout": "Executed successfully"
        },
        "terraform apply -input=false -no-color -auto-approve": {
            "code": 0,
            "stdout": "Executed successfully"
        }
    }
}

tr.setAnswers(a);
tr.run();