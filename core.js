const path = require("path");

const LANG_ISO_PLACEHOLDER = "%LANG_ISO%";

let _context;
let _lokalise;

module.exports = async (context, { LokaliseApi, fs }) => {
  _context = context;
  _lokalise = new LokaliseApi({ apiKey: context.apiKey });
  _fs = fs;

  const languageCodes = await getLanguageISOCodes();

  const starterPromise = Promise.resolve(null);
  const log = result => console.log(result);
  const uploadFile = async lang => {
    try {
      const buff = await readLanguageFile(lang);
      const buffMe = new Buffer(buff);
      const data = await _lokalise.files.upload(context.projectId, {
        data: buffMe.toString("base64"),
        filename: buildLanguageFilePath(lang),
        lang_iso: lang
      });
    } catch (error) {
      console.error(`Error reading language file ${lang}: ${error.message}`);
    }
  };
  await languageCodes.reduce(
    async (p, lang) => p.then(() => uploadFile(lang)),
    starterPromise
  );
};

function buildLanguageFilePath(languageCode) {
  return path.join(
    _context.directory,
    _context.filename.replace(LANG_ISO_PLACEHOLDER, languageCode)
  );
}

async function getLanguageISOCodes() {
  const languages = await _lokalise.languages.list({
    project_id: _context.projectId
  });
  return languages.map(x => x.lang_iso);
}

function readLanguageFile(lang) {
  const path = buildLanguageFilePath(lang);
  return new Promise((resolve, reject) => {
    _fs.readFile(path, "utf-8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      console.log("Read language file " + path);
      resolve(data);
    });
  });
}
