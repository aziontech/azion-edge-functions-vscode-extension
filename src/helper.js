const {
  window,
  ProgressLocation,
  workspace,
  Uri
} = require("vscode");

const fs = require("fs");
const util = require("util");
const cp = util.promisify(require("child_process").exec);
const path = require("path");

const messages = require("./messages");
const langs = require("./langs");
/**
 * @param {String} title
 * @param {Promise} promise
 */
async function createProgress(title, promise) {
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: title,
      cancellable: true,
    },
    async (progress, token) => {
      token.onCancellationRequested(() => {
        console.warn(messages.userCanceledRunning);
        window.showErrorMessage(messages.requestCanceled);
      });

      setTimeout(() => {
        progress.report({ increment: 0, message: messages.startingProcess });
      }, 1000);

      setTimeout(() => {
        progress.report({ increment: 10, message: messages.cake });
      }, 3000);

      setTimeout(() => {
        progress.report({ increment: 30, message: messages.beer });
      }, 6000);

      setTimeout(() => {
        progress.report({ increment: 45, message: messages.playingDart });
      }, 8000);

      return new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          try {
            const response = await promise;
            progress.report({ increment: 15, message: messages.done });
            resolve(response);
          } catch (err) {
            reject(err);
          }
        }, 2000);
      });
    }
  );
}

/**
 * @param {fs.PathLike} path
 */
function createFolder(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  return path;
}

/**
 * @param {String} name
 * @param {string | NodeJS.ArrayBufferView} content
 * @param {String} targetDir
 * @param {String} extension
 */
function createFile(name, content, targetDir, extension) {
  const fileName = `${name}.${extension}`;
  const filePath = path.join(targetDir, fileName);
  fs.writeFileSync(filePath, content, "utf8");
}

/**
 * @param {String} path
 */
async function createWorkspace(path, name) {
  createFolder(path);
  const workspaceFolderUri = Uri.parse(path);
  workspace.updateWorkspaceFolders(0, undefined, { uri: workspaceFolderUri, name: name });
}

/**
 * @param {String} langName
 */

function getFileExtension(langName) {
  return langs[langName];
}

function getFileContent(path) {
  return fs.readFileSync(path, "utf8");
}

/**
 * @param {String} str
 */
function slashUnicode(str, type = "unicode") {
  if (type === "unicode") return str.replace(/\//g, "\u2215");
  else if (type === "string") return str.replace("\u2215", "/");
  return str;
}

/**
 * @param {String} command
 */
async function exec(command) {
  const { stdout, stderr } = await cp(command);
  return { stdout, stderr };
}

/**
 * @param {string} configPath
 */
function getAzionConfig(configPath) {
  try {
    const azionConfigPath = path.join(configPath, "azion.json");
    let azionConfig = getFileContent(azionConfigPath);
    if (azionConfig) return { config: JSON.parse(azionConfig), path: azionConfigPath };
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = {
  createFolder,
  createFile,
  createProgress,
  createWorkspace,
  getAzionConfig,
  getFileExtension,
  getFileContent,
  slashUnicode,
  exec,
};
