const config = {
    kv: {
      accessKeyId: "<AWS_ACCESS_KEY_ID>",
      secretAccessKey: "<AWS_SECRET_ACCESS_KEY>",
      bucket: "<AWS_BUCKET_NAME>",
      region: "<AWS_REGION>",
      path: "__static_content",
    },
    azion: {
      function_name: "<FUNCTION_NAME>",
      token: "<AZION_PEROSNAL_TOKEN>",
      framework: "<FRAMEWORK>",
    },
  };
  
  module.exports = config;
  