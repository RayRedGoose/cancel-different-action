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
    eventName,
    sha,
    ref,
    repo: { owner, repo },
  } = github.context;

  const { GITHUB_TOKEN } = process.env;
  console.log("github", GITHUB_TOKEN);

  const octokit = github.getOctokit(GITHUB_TOKEN);

  const data = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
    owner,
    repo,
  });

  console.log(data);
}

main()
  .then(() => core.info("Cancel Complete."))
  .catch((e) => core.setFailed(e.message));
