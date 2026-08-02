import tasks = require('azure-pipelines-task-lib/task');
import {ParentCommandHandler} from './parent-handler';
import path = require('path');

async function run() {
    tasks.setResourcePath(path.join(__dirname, '..', 'task.json'));

    // This task version is deprecated. Set FAIL_DEPRECATED_BUILD_TASK to validate a
    // migration against the hard failure before the removal date.
    // TODO(release): once the release date is known, add "removalDate": "YYYY-MM-DD" to
    // task.json and task.loc.json (12 weeks out) and put that date in the DeprecatedTask
    // message in task.json and Strings/resources.resjson/en-US/resources.resjson.
    const failDeprecated = tasks.getVariable('FAIL_DEPRECATED_BUILD_TASK');
    if (failDeprecated != null && failDeprecated.toLowerCase() === 'true') {
        tasks.setResult(tasks.TaskResult.Failed, tasks.loc('DeprecatedTask'));
        return;
    }
    tasks.warning(tasks.loc('DeprecatedTask'));

    let parentHandler = new ParentCommandHandler();
    try {
        await parentHandler.execute(tasks.getInput("provider"), tasks.getInput("command"));
        tasks.setResult(tasks.TaskResult.Succeeded, "");
    } catch (error) {
        tasks.setResult(tasks.TaskResult.Failed, error);
    }
}

run();