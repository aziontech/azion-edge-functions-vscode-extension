const { window, ProgressLocation, workspace, FileType, Uri, commands } = require("vscode");
const fs = require("fs");

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
        console.log(messages.userCanceledRunning);
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
        }, 12000);
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
 * @param {String} path
 * @param {String} extension
 */
function createFile(name, content, path, extension) {
  const filePath = `${path}/${name}.${extension}`;
  fs.writeFileSync(filePath, content, "utf8");
}

/**
 * @param {String} path
 */
async function createWorkspace(path, name) {
  createFolder(path);
  const workspaceFolderUri = Uri.parse(path);
  workspace.updateWorkspaceFolders(0, undefined, { uri: workspaceFolderUri, name: name });
  // await commands.executeCommand("vscode.openFolder", workspaceFolderUri);
}

/**
 * @param {String} langName
 */

function getFileExtension(langName) {
  return langs[langName];
}

function getFunctionNameByPath(path) {
  const withoutFile = path.slice(0, path.lastIndexOf("/"));
  let pos = withoutFile.lastIndexOf("/");
  let name = withoutFile.substring(pos + 1);
  name = name.split(".")[0];
  return name;
}

/**
 * @param {String} str
 */
function slashUnicode(str, type = "unicode") {
  if (type === "unicode") return str.replace(/\//g, "\u2215");
  else if (type === "string") return str.replace("\u2215", "/");
  return str;
}

module.exports = {
  createFolder,
  createFile,
  createProgress,
  createWorkspace,
  getFileExtension,
  getFunctionNameByPath,
  slashUnicode,
};
