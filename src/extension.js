const {
  window,
  commands,
  // eslint-disable-next-line no-unused-vars
  Uri,
  // eslint-disable-next-line no-unused-vars
  ExtensionContext,
  // eslint-disable-next-line no-unused-vars
  TextDocument,
  // eslint-disable-next-line no-unused-vars
  FileType,
} = require("vscode");

const {
  createFolder,
  createFile,
  createProgress,
  createWorkspace,
  getFileExtension,
  getFunctionNameByPath,
  slashUnicode,
} = require("./helper");
const { get, patch } = require("./service");
const messages = require("./messages");

const getPath = require("platform-folders").default;

const USER_DOCUMENTS_PATH = getPath("documents");
const AZION_FOLDER_NAME = "azion-edge-functions";
const AZION_EDGE_FUNCTIONS_PATH = `${USER_DOCUMENTS_PATH}/${AZION_FOLDER_NAME}`;
/**
 * @param {ExtensionContext} context
 */
async function activate(context) {
  context.subscriptions.push(commands.registerCommand("azion-functions.init", () => init(context)));
  context.subscriptions.push(
    commands.registerCommand(
      "azion-functions.patch",
      async () => await updateEdgeFunction(window.activeTextEditor?.document, context)
    )
  );
}

function deactivate() {
  window.showInformationMessage(messages.deactivated);
}

/**
 * @param {ExtensionContext} context
 */
async function init(context) {
  context.globalState.update("FUNCTIONS", []); // reset storage functions
  try {
    const newContext = await setToken(context);
    const TOKEN = await newContext.secrets.get("TOKEN");
    if (TOKEN) {
      const myEdgeFunctions = await getAllEdgeFunctions(newContext);
      await createWorkspace(AZION_EDGE_FUNCTIONS_PATH, AZION_FOLDER_NAME);
      myEdgeFunctions.forEach(async (/** @type {Object} */ foo) => {
        await createProgress(messages.creatingFile(foo.name), createLocalFunction(foo));
      });
    }
  } catch (err) {
    console.error(err);
    window.showErrorMessage(`${err}`);
  }
}

/**
 * @param {ExtensionContext} context
 */
async function setToken(context) {
  const TOKEN = await context.secrets.get("TOKEN");
  if (TOKEN) {
    return context;
  } else {
    const TOKEN = await window.showInputBox({ placeHolder: messages.insertToken });
    await context.secrets.store("TOKEN", TOKEN);
    return context;
  }
}

/**
 * @param {ExtensionContext} context
 */
async function getAllEdgeFunctions(context) {
  const aux = [];
  const TOKEN = await context.secrets.get("TOKEN");
  const recursion = async (nextPageURL = null) => {
    try {
      const response = await get(TOKEN, nextPageURL);
      if (response.results) {
        const { results } = response;
        aux.push(...results);
        if (response.links.next) {
          recursion(response.links.next);
        }
      } else throw response;
    } catch (err) {
      throw err;
    }
  };

  if (TOKEN) {
    try {
      await createProgress(messages.synchronizing, recursion());
      context.globalState.update("FUNCTIONS", aux);
      return Promise.resolve(aux);
    } catch (err) {
      context.secrets.delete("TOKEN");
      if (err.detail) {
        throw `Azion API request error: ${err.detail}`;
      } else {
        throw `${messages.somethingWrong} ${messages.checkToken}`;
      }
    }
  }
}

/**
 * @param {TextDocument} doc
 * @param {ExtensionContext} context
 */
async function updateEdgeFunction(doc, context) {
  if (doc) {
    const TOKEN = await context.secrets.get("TOKEN");
    const folderName = getFunctionNameByPath(doc.uri.path);
    const payload = {};

    const nameWithSlashUnicode = slashUnicode(folderName, "string");
    const myEdgeFunctions = await context.globalState.get("FUNCTIONS");

    // function to be edited [index]
    const functionIndex = myEdgeFunctions.findIndex(
      (/** @type {{ name: Object; }} */ foo) => foo.name === nameWithSlashUnicode
    );

    const myEdgeFunction = myEdgeFunctions[functionIndex];
    const { name, id, json_args, code } = myEdgeFunction;

    const isCode = () => doc.uri.path.includes("code.js");
    const isArgs = () => doc.uri.path.includes("args.json");

    const newContent = doc.getText();
    const oldCode = code;
    const oldArgs = json_args;

    if (isCode()) payload.code = newContent;
    if (isArgs()) payload.json_args = newContent;

    if ((isCode() && oldCode !== newContent) || (isArgs() && oldArgs !== newContent)) {
      try {
        const updateEdgeFunction = await createProgress(
          messages.updating,
          patch(TOKEN, id, payload)
        );
        if (!updateEdgeFunction.results) {
          throw updateEdgeFunction;
        }
        //update storage
        if (isCode()) myEdgeFunctions[functionIndex].code = newContent;
        if (isArgs()) myEdgeFunctions[functionIndex].json_args = newContent;
        context.globalState.update("FUNCTIONS", myEdgeFunctions);
        await doc.save();
        window.showInformationMessage(messages.updated(name));
      } catch (err) {
        console.error(err);
        if (err.detail === "Invalid token") context.secrets.delete("TOKEN");
        window.showErrorMessage(`${messages.somethingWrong} ${messages.updatedError(name)}`);
      }
    }
  } else {
    window.showErrorMessage(`${messages.fileMissing}`);
  }
}

/**
 * @param {{ name: String; code: String; language: String; id: Number; json_args: String; }} foo
 */
async function createLocalFunction(foo) {
  const { name, code, language, json_args } = foo;
  const nameWithSlashUnicode = slashUnicode(name);
  const localFunctionPath = `${AZION_EDGE_FUNCTIONS_PATH}/${nameWithSlashUnicode}`;
  const functionExtension = getFileExtension(language);
  const jsonArgsString = JSON.stringify(json_args);
  createFolder(localFunctionPath);
  createFile("code", code, localFunctionPath, functionExtension);
  createFile("args", jsonArgsString, localFunctionPath, "json");
}

module.exports = {
  activate,
  deactivate,
};
