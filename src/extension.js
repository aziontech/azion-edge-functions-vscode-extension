const path = require("path");
const {
  window,
  commands,
  Uri,
  // @ts-ignore
  ExtensionContext,
  // @ts-ignore
  TextDocument,
} = require("vscode");

const auth = require("./auth");

const {
  createFolder,
  createFile,
  createProgress,
  createWorkspace,
  getFileExtension,
  slashUnicode,
} = require("./helper");

const { FUNCTIONS } = require("./service");
const messages = require("./messages");
const { AZION_FOLDER_NAME, AZION_EDGE_FUNCTIONS_PATH } = require("./constants");
const {
  createJamstackFunction,
  buildJamstackFunction,
  publishJamstackFunction,
} = require("./framework-adapter");

/**
 * @param {ExtensionContext} context
 */
async function activate(context) {
  context.subscriptions.push(commands.registerCommand("azion-functions.sync", () => sync(context)));
  context.subscriptions.push(
    commands.registerCommand(
      "azion-functions.patch",
      async () => await updateEdgeFunction(window.activeTextEditor?.document, context)
    )
  );
  context.subscriptions.push(
    commands.registerCommand(
      "azion-functions.create-jamstack",
      async () => await createJamstackFunction(context)
    )
  );
  context.subscriptions.push(
    commands.registerCommand(
      "azion-functions.build-jamstack",
      async () => await buildJamstackFunction(context)
    )
  );
  context.subscriptions.push(
    commands.registerCommand(
      "azion-functions.publish-jamstack",
      async () => await publishJamstackFunction(context)
    )
  );
}

function deactivate() {
  window.showInformationMessage(messages.deactivated);
}

/**
 * @param {ExtensionContext} context
 */
async function sync(context) {
  context.globalState.update("pureFunctions", []); // reset storage functions
  try {
    const TOKEN = await auth(context);
    if (TOKEN) {
      const myEdgeFunctions = await getAllEdgeFunctions(context);
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
async function getAllEdgeFunctions(context) {
  const aux = [];
  const TOKEN = await auth(context);

  const recursion = async (nextPageURL = null) => {
    try {
      const response = await FUNCTIONS.get(TOKEN, nextPageURL);
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
      context.globalState.update("pureFunctions", aux);
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
    const TOKEN = await auth(context);
    const folderName = path.basename(path.parse(doc.uri.path).dir);
    const payload = {};

    const nameWithSlashUnicode = slashUnicode(folderName, "string");
    const myEdgeFunctions = await context.globalState.get("pureFunctions");

    // function to be edited [index]
    const functionIndex = myEdgeFunctions.findIndex(
      (/** @type {{ name: Object; }} */ foo) => foo.name === nameWithSlashUnicode
    );

    const myEdgeFunction = myEdgeFunctions[functionIndex];

    if (myEdgeFunction) {
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
            FUNCTIONS.patch(TOKEN, id, payload)
          );
          if (!updateEdgeFunction.results) {
            throw updateEdgeFunction;
          }

          //update storage
          if (isCode()) myEdgeFunctions[functionIndex].code = newContent;
          if (isArgs()) myEdgeFunctions[functionIndex].json_args = newContent;

          context.globalState.update("pureFunctions", myEdgeFunctions);
          await doc.save();
          window.showInformationMessage(messages.updated(name));
        } catch (err) {
          console.error(err);
          if (err.detail === "Invalid token") context.secrets.delete("TOKEN");
          window.showErrorMessage(`${messages.somethingWrong} ${messages.updatedError(name)}`);
        }
      }
    }

    if (!myEdgeFunction) {
      window.showErrorMessage(`${messages.fileMissing}`);
    }
  }
  if (!doc) {
    window.showErrorMessage(`${messages.fileMissing}`);
  }
}

/**
 * @param {{ name: String; code: String; language: String; id: Number; json_args: String; }} foo
 */
async function createLocalFunction(foo) {
  const { name, code, language, json_args } = foo;
  const nameWithSlashUnicode = slashUnicode(name);
  const localFunctionPath = path.join(AZION_EDGE_FUNCTIONS_PATH, nameWithSlashUnicode);
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
