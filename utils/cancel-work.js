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

  console.log("RUN CANCELLED ACTION:");
  await octokit.request(
    "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
    {
      owner,
      repo,
      workflow_id: "cancelled.yml",
      ref: "test-branch",
      inputs: {
        version: "minor",
      },
    }
  );

  console.log("CANCEL ACTION:");
  const {
    data: { workflow_runs: allRuns },
  } = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
    owner,
    repo,
  });

  const runsToCancel = allRuns.filter(
    ({ name, status }) =>
      name === "Cancelled" &&
      ["queued", "waiting", "in-progress", "pending"].includes(status)
  );

  console.log(runsToCancel);

  Promise.all(
    runsToCancel.map((run) => {
      return octokit.rest.actions.cancelWorkflowRun(
        "GET /repos/{owner}/{repo}/actions/runs",
        {
          owner,
          repo,
          run_id: run.id,
        }
      );
    })
  );
}

main()
  .then(() => core.info("Cancel Complete."))
  .catch((e) => core.setFailed(e.message));
