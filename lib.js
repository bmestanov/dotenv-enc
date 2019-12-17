#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
// using the same IV to avoid git noise
// and warnings for createCipher/createDecipher
const iv = Buffer.from('95a8adbadff0e9b65d2615fb850e701d', 'hex');

const encFilename = fileName => `.#${fileName}`;

const encSecret = () => (
  process.env.DOTENV_DECRYPT_SECRET || process.env.DOTENV_ENCRYPT_SECRET
);

const encryptedPath = (filePath) => {
  const fileName = path.basename(filePath);
  const dir = path.dirname(filePath);
  return path.resolve(dir, encFilename(fileName));
};

const decryptedPath = (filePath) => {
  const fileName = path.basename(filePath);
  const dir = path.dirname(filePath);
  return path.resolve(dir, fileName.slice(2));
};

const encrypt = (buffer, key) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // Create the new (encrypted) buffer
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
};

const decrypt = (encrypted, key) => {
   const decipher = crypto.createDecipheriv(algorithm, key, iv);
   // Decrypt it
   const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
   return result;
};

const writeEncryptedEnvFile = (filePath) => {
  const key = crypto.createHash('sha256').update(encSecret()).digest('base64').substr(0, 32);
  const fileBuffer = fs.readFileSync(filePath);
  const encryptedFileBuffer = encrypt(fileBuffer, key);
  fs.writeFile(encryptedPath(filePath), encryptedFileBuffer, { encoding: 'binary' }, () => {});
};

const writeDecryptedEnvFile = (filePath) => {
  const key = crypto.createHash('sha256').update(encSecret()).digest('base64').substr(0, 32);
  const fileBuffer = fs.readFileSync(filePath);
  const decryptedFileBuffer = decrypt(fileBuffer, key);
  fs.writeFileSync(decryptedPath(filePath), decryptedFileBuffer.toString());
};

const watchEnvFiles = (paths) => {
  chokidar.watch(paths)
    .on('add', writeEncryptedEnvFile)
    .on('change', writeEncryptedEnvFile)
    .on('unlink', path => fs.unlinkSync(encryptedPath(path)));
};

const decryptFiles = (baseFolder = process.env.PWD) => {
  chokidar.watch(
    path.resolve(baseFolder, '.#*')
  )
  .on('add', (path) => {
    writeDecryptedEnvFile(path);
  });
};

module.exports = {
  watchEnvFiles,
  decryptFiles,
};
