const os = require("os");
const path = require("path");

const USER_DOCUMENTS_PATH = path.join(os.homedir(), "documents");
const AZION_FOLDER_NAME = "azion-edge-functions";
const AZION_EDGE_FUNCTIONS_PATH = path.join(USER_DOCUMENTS_PATH, AZION_FOLDER_NAME);
const SUPPORTED_FRAMEWORKS = {
  Flareact: "git@github.com:aziontech/flareact4azion-template.git",
};

module.exports = {
  USER_DOCUMENTS_PATH,
  AZION_FOLDER_NAME,
  AZION_EDGE_FUNCTIONS_PATH,
  SUPPORTED_FRAMEWORKS,
};
