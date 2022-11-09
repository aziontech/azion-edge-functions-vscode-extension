// @ts-nocheck
const fetch = require("node-fetch");

const API = "https://api.azionapi.net";

const REQ_HEADERS = {
  Accept: "application/json; version=3",
  "Content-Type": "application/json",
};

const FUNCTIONS = {
  get: async (TOKEN, URL) => {
    return fetch(URL ? URL : API + "/edge_functions", {
      method: "GET",
      headers: {
        Authorization: `Token ${TOKEN}`,
        ...REQ_HEADERS,
      },
    })
      .then((res) => res.json())
      .then((body) => body);
  },
  patch: async (TOKEN, functionId, payload) => {
    return fetch(`${API}/edge_functions/${functionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      redirect: "follow",
      headers: {
        Authorization: `Token ${TOKEN}`,
        ...REQ_HEADERS,
      },
    })
      .then((res) => res.json())
      .then((body) => body);
  },
};

const APPLICATION = {
  post: async (payload, TOKEN) => {
    return fetch(`${API}/edge_applications`, {
      method: "POST",
      body: JSON.stringify(payload),
      redirect: "follow",
      headers: {
        Authorization: `Token ${TOKEN}`,
        ...REQ_HEADERS,
      },
    })
      .then((res) => res.json())
      .then((body) => body);
  },
  patch: async (payload, applicationId, TOKEN) => {
    return fetch(`${API}/edge_applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      redirect: "follow",
      headers: {
        Authorization: `Token ${TOKEN}`,
        ...REQ_HEADERS,
      },
    })
      .then((res) => res.json())
      .then((body) => body);
  },
  functionInstance: {
    post: async (payload, applicationId, TOKEN) => {
      return fetch(`${API}/edge_applications/${applicationId}/functions_instances`, {
        method: "POST",
        body: JSON.stringify(payload),
        redirect: "follow",
        headers: {
          Authorization: `Token ${TOKEN}`,
          ...REQ_HEADERS,
        },
      })
        .then((res) => res.json())
        .then((body) => body);
    },
  },
  rulesEngine: {
    get: async (applicationId, TOKEN) => {
      return fetch(`${API}/edge_applications/${applicationId}/rules_engine/request/rules`, {
        method: "GET",
        redirect: "follow",
        headers: {
          Authorization: `Token ${TOKEN}`,
          ...REQ_HEADERS,
        },
      })
        .then((res) => res.json())
        .then((body) => body);
    },
    patch: async (payload, applicationId, ruleId, TOKEN) => {
      return fetch(
        `${API}/edge_applications/${applicationId}/rules_engine/request/rules/${ruleId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
          redirect: "follow",
          headers: {
            Authorization: `Token ${TOKEN}`,
            ...REQ_HEADERS,
          },
        }
      )
        .then((res) => res.json())
        .then((body) => body);
    },
  },
};

const DOMAINS = {
  post: async (payload, TOKEN) => {
    return fetch(`${API}/domains`, {
      method: "POST",
      body: JSON.stringify(payload),
      redirect: "follow",
      headers: {
        Authorization: `Token ${TOKEN}`,
        ...REQ_HEADERS,
      },
    })
      .then((res) => res.json())
      .then((body) => body);
  },
};

module.exports = { FUNCTIONS, APPLICATION, DOMAINS };
