const {
    window,
    workspace,
    // @ts-ignore
    ExtensionContext,
  } = require("vscode");
  const messages = require("./messages");
  const { getAzionConfig } = require("./helper");
  
  /**
   * @param {ExtensionContext} context
   */
  async function auth(context) {
    const TOKEN = await context.secrets.get("TOKEN");
    if (TOKEN) {
      return TOKEN;
    }
    if (!TOKEN) {
      const tokenInAzionConfig = readTokenInFile();
      if (tokenInAzionConfig) {
        return tokenInAzionConfig;
      }
  
      if (!tokenInAzionConfig) {
        const TOKEN = await window.showInputBox({
          placeHolder: messages.insertToken,
          prompt: messages.azionPersonalToken,
          validateInput: (input) => {
            if (input) return null;
            if (!input) return messages.tokenRequired;
          },
        });
        await context.secrets.store("TOKEN", TOKEN);
        return TOKEN;
      }
    }
  
    function readTokenInFile() {
      if (workspace.workspaceFolders?.length > 0) {
        const currentProjectPath = workspace?.workspaceFolders[0]?.uri.path;
        const config = getAzionConfig(currentProjectPath)?.config;
        if (config) return config?.azion["token"];
        if (!config) return false;
      }
    }
    return false;
  }
  
  module.exports = auth;
  