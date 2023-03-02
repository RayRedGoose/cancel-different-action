import * as github from "@actions/github";

if (!github) {
  throw new Error("Module not found: github");
}

async function main() {
  const {
    GITHUB_TOKEN: token,
    GITHUB_REPOSITORY_OWNER: owner,
    GITHUB_REPOSITORY: fullRepoName,
  } = process.env;

  const octokit = github.getOctokit(token);
  const [_, repo] = fullRepoName.split("/");

  await octokit.request(
    "GET /repos/{owner}/{repo}/actions/runs?status=in_progress",
    { owner, repo }
  );

  setTimeout(async () => {
    console.log("GET ALL ACTIVE ACTIONS:");
    const {
      data: { workflow_runs: allRuns },
    } = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
      owner,
      repo,
    });

    console.log(
      "ALL RUNS:",
      allRuns.map(({ name, status }) => ({ name, status }))
    );
    const runsToClean = allRuns.filter(
      ({ name, status }) =>
        name === "Release" && ["in_progress", "queued"].includes(status)
    );
    console.log("RUNS TO BE CANCELLED:", runsToClean);

    if (runsToClean.length) {
      console.log(`cancelling run with id ${runsToClean[0].id}....`);
      await octokit.request(
        "POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel",
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
  }, 1000);

  // console.log("RUN ACTION TO CHECK CANCELATION:");
  // await octokit.request(
  //   "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
  //   {
  //     owner,
  //     repo,
  //     workflow_id: "release.yml",
  //     ref: "test",
  //     inputs: {
  //       version: "minor",
  //     },
  //   }
  // );
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

main().catch((err) => {
  console.error("Error:\n", err.message);
  console.error("Stack:\n", err.stack);
  process.exit(1);
});
