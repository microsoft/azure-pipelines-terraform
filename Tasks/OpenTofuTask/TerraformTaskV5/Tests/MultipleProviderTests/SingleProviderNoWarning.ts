import ma = require('azure-pipelines-task-lib/mock-answer');
import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');

let tp = path.join(__dirname, './SingleProviderNoWarningL0.js');
let tr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(tp);

tr.setInput('provider', 'azurerm');
tr.setInput('command', 'validate');
tr.setInput('workingDirectory', 'DummyWorkingDirectory');
tr.setInput('commandOptions', '');

let a: ma.TaskLibAnswers = <ma.TaskLibAnswers> {
    "which": {
        "tofu": "tofu"
    },
    "checkPath": {
        "tofu": true
    },
    "exec": {
        "tofu providers": {
            "code": 0,
            "stdout": "provider azurerm"
        }
    }
}

tr.setAnswers(a);
tr.run();