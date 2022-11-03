const commands = {
  init: (/** @type {String} */ targerDir, /** @type {String} */ templateRepo) =>
    `npx azion-framework-adapter init ${targerDir} ${templateRepo}`,
  flareact: {
    build: (/** @type {String} */ projectPath, /** @type {String} */ configPath) =>
      `cd ${projectPath} && npx azion-framework-adapter build --config ${configPath}`,
  },
  publish: (/** @type {String} */ projectPath) =>
    `cd ${projectPath} && npx azion-framework-adapter publish`,
};

module.exports = commands;
