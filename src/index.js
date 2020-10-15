const path = require("path");
const fs = require("fs");

const LANG_ISO_PLACEHOLDER = "%LANG_ISO%";

const getContext = (text) => {
  const foundText = text.match(
    /<!--- LOKALIZE CONTEXT FOR TRANSLATORS -->(\n| )*((.|\n)*)(\n| )*<!--- LOKALIZE CONTEXT FOR TRANSLATORS -->/
  );
  return foundText ? foundText[2] : "";
};

const getClubhouseLink = (text) => {
  const clubhouseLink = text.match(/Clubhouse Story: (.*)/);
  return clubhouseLink ? clubhouseLink[0] : "";
};

const getAllImages = (text) => {
  const listOfImages = text.match(
    /(http|ftp|https):\/\/(user-images.githubusercontent.com)([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?/g
  );
  return listOfImages || [];
};

const getTaskDescription = (description) => {
  if (description) {
    const contextText = getContext(description).trim();
    if (!contextText) {
      return description;
    }
    const clubhouseLink = getClubhouseLink(description);
    const allImages = getAllImages(description);

    return `${clubhouseLink ? `${clubhouseLink}\n` : ""}${contextText}${
      allImages && allImages.length > 0
        ? `\n${allImages.map((path) => `screenshot: ${path}`).join("\n")}`
        : ""
    }`;
  }
  return "";
};

async function getLanguageISOCodes(lokalise, projectId) {
  const languages = await lokalise.languages.list({
    project_id: projectId,
  });
  return languages.map((x) => x.lang_iso);
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
  callback,
}) {
  const starterPromise = Promise.resolve(null);
  const uploadFile = async (lang, callback) => {
    try {
      const filename = filePath.replace(LANG_ISO_PLACEHOLDER, lang);
      const file = await readLanguageFile(filename);
      const buff = Buffer.from(file);
      let process = await lokalise.files.upload(projectId, {
        data: buff.toString("base64"),
        filename,
        lang_iso: lang,
        tags: [tag],
      });
      let inteval = setInterval(async () => {
        if (process.status === "finished") {
          clearInterval(inteval);
          console.log("Uploaded language file: " + filename);
          callback();
        } else {
          process = await lokalise.queuedProcesses.get(process.process_id, {
            project_id: projectId,
          });
          console.log(process);
        }
      }, 1000);
      console.log("Uploaded language file " + filename);
    } catch (error) {
      ghCore.setFailed(error ? error.message : "Unknown error");
      console.error(`Error reading language file ${lang}: ${error.message}`);
    }
  };
  await languageCodes.reduce(
    async (p, lang) => p.then(() => uploadFile(lang, callback)),
    starterPromise
  );
}

module.exports = async ({
  lokalise,
  projectId,
  filePath,
  tag,
  locales,
  callback,
}) => {
  const languageCodes =
    locales || (await getLanguageISOCodes(lokalise, projectId));

  return await uploadFiles({
    lokalise,
    languageCodes,
    projectId,
    filePath,
    tag,
    callback,
  });
};
