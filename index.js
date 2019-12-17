#!/usr/bin/env node
const { watchEnvFiles, decryptFiles } = require('./lib');
const dotenv = require('dotenv');

const config = (options) => {
  const { watch, baseFolder } = options;
  dotenv.config(options);
  if (process.env.DOTENV_DECRYPT_SECRET) {
    decryptFiles(baseFolder);
  } else if (process.env.DOTENV_ENCRYPT_SECRET) {
    watchEnvFiles(watch);
  }
};

module.exports = {
  config,
};
