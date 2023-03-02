import { Octokit } from "https://cdn.skypack.dev/octokit";

if (!github) {
  throw new Error("Module not found: github");
}

if (!core) {
  throw new Error("Module not found: core");
}

async function main() {
  const { GITHUB_TOKEN } = process.env;
  console.log("process.env", process.env);

  const token = core.getInput("access_token");
  console.log("token", GITHUB_TOKEN);

  const octokit = new Octokit({
    auth: GITHUB_TOKEN,
  });

  const data = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", {
    owner,
    repo,
  });

  console.log(data);
}

main()
  .then(() => core.info("Cancel Complete."))
  .catch((e) => core.setFailed(e.message));
