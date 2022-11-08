const {
  window,
  workspace,
  commands,
  Uri,
  // eslint-disable-next-line no-unused-vars
  ExtensionContext,
} = require("vscode");

const path = require("path");
const open = require("open");

const auth = require("../auth");
const messages = require("../messages");
const { createProgress, createFile, getAzionConfig, exec } = require("../helper");
const { USER_DOCUMENTS_PATH, SUPPORTED_FRAMEWORKS } = require("../constants");
const { buildFromScratch } = require("../platform");

const adapterCommands = require("./commands");
const azionConfig = require("./azion.config");

/**
 * @param {ExtensionContext} context
 */
async function createJamstackFunction(context) {
  try {
    const currentProjectFramework = await window.showQuickPick(Object.keys(SUPPORTED_FRAMEWORKS), {
      placeHolder: messages.selectFramework,
    });

    const projectName = await window.showInputBox({
      prompt: messages.projectName,
      placeHolder: messages.insertProjectName,
      validateInput: (input) => {
        return input ? null : messages.functionNameRequired;
      },
    });
    if (projectName) {
      const repository = await window.showInputBox({
        prompt: messages.repository,
        placeHolder: messages.insertTemplateRepository,
      });

      const targetDir = path.join(USER_DOCUMENTS_PATH, projectName);
      const selectedFrameworkDefaultTemplate = SUPPORTED_FRAMEWORKS[currentProjectFramework];
      const templateRepo = repository || selectedFrameworkDefaultTemplate;

      await createProgress(
        messages.initAdapter,
        exec(adapterCommands.init(targetDir, templateRepo))
      );

      const myJamstackFunction = {
        path: targetDir,
        name: projectName,
      };

      const TOKEN = await auth(context);

      azionConfig.azion.framework = currentProjectFramework;
      azionConfig.azion.function_name = projectName;
      azionConfig.azion.token = TOKEN;

      createFile("azion", JSON.stringify(azionConfig, null, 2), myJamstackFunction.path, "json");
      const projectUri = Uri.file(myJamstackFunction.path);
      await commands.executeCommand("vscode.openFolder", projectUri);
    }
    if (!projectName) {
      return;
    }
  } catch (err) {
    console.error(err);
    window.showErrorMessage(err.stderr || err.stdout || messages.somethingWrong);
  }
}
async function buildJamstackFunction(context) {
  const currentProjectPath = workspace.workspaceFolders[0].uri.path;
  const { config, path } = getAzionConfig(currentProjectPath);
  const projectName = config.azion.function_name;

  const projectFramework = config.azion.framework;

  try {
    if (projectFramework) {
      if (projectFramework === "Flareact") {
        await createProgress(
          messages.building(projectName),
          exec(adapterCommands.flareact.build(currentProjectPath, path))
        );
        window.showInformationMessage(messages.builded);
      }
    }

    if (!projectFramework) {
      window.showErrorMessage(messages.azionConfigError);
    }
  } catch (err) {
    console.error(err);
    window.showErrorMessage(err.stderr || err.stdout || messages.somethingWrong);

    if (err.stdout.includes("Cannot find module"))
      window.showErrorMessage(messages.modulesNotFound);
  }
}

/**
 * @param {ExtensionContext} context
 */
async function publishJamstackFunction(context) {
  const TOKEN = await auth(context);
  const currentProjectPath = workspace.workspaceFolders[0].uri.path;
  const projectName = path.basename(currentProjectPath);

  try {
    const { stdout, stderr } = await createProgress(
      messages.publishing(projectName),
      exec(adapterCommands.publish(currentProjectPath))
    );

    // parsing adapter stdout
    const functionId = stdout.split("id: ")[1];
    let applicationDomain = await createProgress(
      messages.configuringPlatform,
      buildFromScratch(projectName, projectName, functionId, TOKEN)
    );

    applicationDomain = `https://${applicationDomain}`;

    window.showInformationMessage(messages.published(projectName));
    window.showInformationMessage(messages.propagate);
    await open(applicationDomain);
  } catch (err) {
    console.error(err);
    window.showErrorMessage(err.stderr || err.stdout || err.somethingWrong);
  }
}

module.exports = { createJamstackFunction, buildJamstackFunction, publishJamstackFunction };
