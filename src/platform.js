const { APPLICATION, DOMAINS } = require("./service");

/**
 * @param {String} applicationName
 * @param {String} functionName
 * @param {Number} functionId
 * @param {String} TOKEN
 */
async function buildFromScratch(applicationName, functionName, functionId, TOKEN) {
  try {
    let edgeApplication = await createApplication(applicationName, TOKEN);
    const applicationId = edgeApplication.results.id;
    edgeApplication = await enableEdgeFunctions(applicationId, TOKEN);

    const instantiate = await instantiateFunction(functionName, functionId, applicationId, TOKEN);
    const functionInstanceId = instantiate.results.id;

    await updateRulesEngine(applicationId, functionInstanceId, TOKEN);

    const domain = await createDomain(functionName, applicationId, TOKEN);
    const applicationDomain = domain.results.domain_name;

    return applicationDomain;
  } catch (err) {
    console.error(err);
  }
}

async function createApplication(applicationName, TOKEN) {
  const payload = { name: applicationName, delivery_protocol: "http,https" };
  return APPLICATION.post(payload, TOKEN);
}

async function enableEdgeFunctions(applicationId, TOKEN) {
  const payload = { edge_functions: true };
  return APPLICATION.patch(payload, applicationId, TOKEN);
}

async function instantiateFunction(functionName, functionId, applicationId, TOKEN) {
  const payload = { name: functionName, edge_function_id: functionId, args: {} };
  return APPLICATION.functionInstance.post(payload, applicationId, TOKEN);
}

async function updateRulesEngine(applicationId, functionInstanceId, TOKEN) {
  const defaultRules = await APPLICATION.rulesEngine.get(applicationId, TOKEN);
  const defaultRuleId = defaultRules.results[0].id;

  const payload = {
    behaviors: [
      {
        name: "run_function",
        target: functionInstanceId,
      },
    ],
  };
  return APPLICATION.rulesEngine.patch(payload, applicationId, defaultRuleId, TOKEN);
}

async function createDomain(domainName, applicationId, TOKEN) {
  const payload = {
    name: domainName,
    cname_access_only: false,
    digital_certificate_id: null,
    edge_application_id: applicationId,
    is_active: true,
  };
  return DOMAINS.post(payload, TOKEN);
}

module.exports = { buildFromScratch };
