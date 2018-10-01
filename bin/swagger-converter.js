#! /usr/bin/env node
const request = require("request");
const fs = require("fs");
const converter = require("../index.js");
const PostmanConverter = require("../converters/PostmanConverter");
const InsomniaConverter = require("../converters/InsomniaConverter");

let entryFile = null;
let entryUrl = null;
let entryClient = null;

for (const [index, value] of process.argv.entries()) {
  if (["-f", "-F", "-file"].includes(value) && process.argv[index + 1]) {
    entryFile = process.argv[index + 1];
  }
  if (["-u", "-U", "-url"].includes(value) && process.argv[index + 1]) {
    entryUrl = process.argv[index + 1];
  }
  if (["-c", "-C", "-converter"].includes(value) && process.argv[index + 1]) {
    entryClient = process.argv[index + 1];
  }
}

if (!entryFile && !entryUrl) {
  console.log("Missing entry file");
  return;
}

const convert = json => {
  console.log(
    JSON.stringify(
      converter({
        swaggers: [
          {
            name: "",
            json: json
          }
        ],
        converter: entryClient === 'insomnia' ? InsomniaConverter : PostmanConverter
      })
    )
  );
};

if (entryUrl) {
  request({ uri: entryUrl, method: "GET" }, (err, response, body) => {
    if (err) {
      console.log("An error occured when trying to get file");
    } else {
      convert(body);
    }
  });
}

if (entryFile) {
  let json = null;
  try {
    json = JSON.parse(fs.readFileSync(entryFile, "utf8"));
  } catch (error) {
    console.log("An error occured when trying to get file");
  }
  if (json) {
    convert(json);
  }
}
