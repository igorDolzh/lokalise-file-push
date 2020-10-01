const path = require("path");
const fs = require("fs");
const { LokaliseApi } = require("@lokalise/node-api");

const LANG_ISO_PLACEHOLDER = "%LANG_ISO%";

async function getLanguageISOCodes(lokalise, projectId) {
  const languages = await lokalise.languages.list({
    project_id: projectId,
  });
  return languages.map((x) => x.lang_iso);
}

async function getKeysByTag(lokalise, tag, projectId) {
  const keys = await lokalise.keys.list({
    project_id: projectId,
    filter_tags: tag,
  });
  console.log(tag, keys);
  return keys.map((x) => x.key_id);
}

function readLanguageFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      console.log("Read language file " + path);
      resolve(data);
    });
  });
}

async function uploadFiles({
  lokalise,
  languageCodes,
  projectId,
  filePath,
  tag,
}) {
  const starterPromise = Promise.resolve(null);
  const uploadFile = async (lang) => {
    try {
      const filename = filePath.replace(LANG_ISO_PLACEHOLDER, lang);
      const file = await readLanguageFile(filename);
      const buff = Buffer.from(file);
      const data = await lokalise.files.upload(projectId, {
        data: buff.toString("base64"),
        filename,
        lang_iso: lang,
        tags: [tag],
      });
      console.log("Uploaded language file " + filename);
    } catch (error) {
      console.error(`Error reading language file ${lang}: ${error.message}`);
    }
  };
  await languageCodes.reduce(
    async (p, lang) => p.then(() => uploadFile(lang)),
    starterPromise
  );
}

const start = async () => {
  const lokalise = new LokaliseApi({
    apiKey: "ab4c07cb903faae7c231775be95a7b6fbe4ee94b",
  });
  console.log(lokalise);
  const projectId = "555095675eb16c7253d6f3.87410578";
  const tag = "pre-release";
  const teamName = "Pleo Team";
  const userEmail = "igor@pleo.io";
  const languageCodes = await getLanguageISOCodes(lokalise, projectId);
  const keys = await getKeysByTag(lokalise, tag, projectId);
  console.log(languageCodes, keys);
  const teams = await lokalise.teams.list();
  const team = teams.find(({ name }) => name === teamName);

  const teamUsers = await lokalise.teamUsers.list({ team_id: team.team_id });
  const user = teamUsers.find(({ email }) => email === userEmail);
  console.log(teamUsers);
  const res = await lokalise.tasks.create(
    {
      title: "Hello",
      description: "Do it ASAP!",
      languages: languageCodes.map((language) => ({
        language_iso: language,
        users: [user.user_id],
      })),
      auto_close_languages: true,
      auto_close_task: true,
      keys,
    },
    {
      project_id: projectId,
    }
  );
  console.log(res);
  //   await uploadFiles({
  //     lokalise,
  //     languageCodes,
  //     projectId,
  //     filePath,
  //     tag,
  //   });
};

start();
