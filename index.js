const path = require("path");
const uploadFiles = require("./uploadFiles/index");
const ghCore = require("@actions/core");
const { LokaliseApi } = require("@lokalise/node-api");

const apiKey = ghCore.getInput("api-token");
const projectId = ghCore.getInput("project-id");
const filePath = ghCore.getInput("file-path");

uploadFiles({
  lokalise: new LokaliseApi({ apiKey }),
  projectId,
  filePath: path.join(process.env.GITHUB_WORKSPACE, filePath)
})
  .then(() => console.log("Finished"))
  .catch(error => ghCore.setFailed(error ? error.message : "Unknown error"));
