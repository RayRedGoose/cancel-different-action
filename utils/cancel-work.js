import * as core from "@actions/core";
import * as github from "@actions/github";

if (!github) {
  throw new Error("Module not found: github");
}

if (!core) {
  throw new Error("Module not found: core");
}

async function main() {
  const {
    repo: { owner, repo },
  } = github.context;

  const { GITHUB_TOKEN } = process.env;
  const octokit = github.getOctokit(GITHUB_TOKEN);

  console.log("RUN ACTION TO CHECK CANCELATION:");
  await octokit.request(
    "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
    {
      owner,
      repo,
      workflow_id: "cancelled.yml",
      ref: "test",
      inputs: {
        version: "minor",
      },
    }
  );

  await octokit.request(
    "GET /repos/{owner}/{repo}/actions/runs?status=in_progress",
    { owner, repo }
  );

  console.log("CANCEL ACTION:");
  const {
    data: { workflow_runs: allRuns },
  } = await octokit.request(
    "GET /repos/{owner}/{repo}/actions/runs?status=in_progress",
    {
      owner,
      repo,
    }
  );

  console.log(
    "ALL RUNS:",
    allRuns.map(({ name, status }) => ({ name, status }))
  );
  const runsToClean = allRuns.filter((run) => run.name === "Cancelled");
  console.log("RUNS TO BE CANCELLED:", runsToClean);

  if (runsToClean.length) {
    console.log("cancelling....");
    await octokit.rest.actions.cancelWorkflowRun(
      "GET /repos/{owner}/{repo}/actions/runs",
      {
        owner,
        repo,
        run_id: runsToClean[0].id,
      }
    );
    console.log("cancelation is done");
    return;
  }

  console.log("Successfully done without any cancelations");
}

const runWorkflow = async (options) => {
  try {
    await octokit.request(
      "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
      {
        owner,
        repo,
        workflow_id: "cancelled.yml",
        ref: "test",
        inputs: {
          version: "minor",
        },
      }
    );
    console.log("Successfully completed dispatch job");
  } catch (error) {
    console.log(error.message);
  }
};

main()
  .then(() => core.info("Cancel Complete."))
  .catch((e) => core.setFailed(e.message));
