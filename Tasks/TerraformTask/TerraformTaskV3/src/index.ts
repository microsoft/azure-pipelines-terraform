import tasks = require('azure-pipelines-task-lib/task');
import {ParentCommandHandler} from './parent-handler';
import path = require('path');

async function run() {
    tasks.setResourcePath(path.join(__dirname, '..', 'task.json'));

    // This task version is deprecated. The agent emits the notice from the "deprecated"
    // and "deprecationMessage" fields in task.json, so do not warn from here as well.
    // Never gate on FAIL_DEPRECATED_BUILD_TASK either: the service sets it during
    // deprecation brownouts and it cannot be overridden in a pipeline, so honouring it
    // hard-fails every Terraform step.
    // TODO(release): once the release date is known, add "removalDate": "YYYY-MM-DD"
    // (12 weeks out) plus that date in deprecationMessage, in task.json and task.loc.json.
    let parentHandler = new ParentCommandHandler();
    try {
        await parentHandler.execute(tasks.getInput("provider"), tasks.getInput("command"));
        tasks.setResult(tasks.TaskResult.Succeeded, "");
    } catch (error) {
        tasks.setResult(tasks.TaskResult.Failed, error);
    }
}

run();