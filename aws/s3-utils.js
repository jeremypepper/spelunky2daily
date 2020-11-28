const { DateTime } = require("luxon");
const axios = require("axios");

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
// AWS.config.credentials = credentials;


// Create unique bucket name
const bucketName = 'spelunky2daily';

async function uploadFile(filePath, fileContents) {
// Use S3 ManagedUpload class as it supports multipart uploads
  try {
    var upload = new AWS.S3.ManagedUpload({
      params: {
        Bucket: bucketName,
        Key: filePath,
        ContentType: 'application/json',
        Body: Buffer.from(fileContents),
        ACL: "public-read"
      }
    })
  } catch(err) {
    console.error(`error in ${filePath}`, err)
    return;
  }
  return upload.promise().then(
      function (data) {
        console.log("Successfully uploaded file", filePath);
      },
      function (err) {
        console.error("There was an error uploading file: ", filePath, err);
      }
  );
}

function readJsonFile(filePath) {
  const download = s3.getObject({
    Bucket: bucketName,
    Key: filePath,
  });
  return download.promise().then(data => JSON.parse(data.Body.toString('utf-8')))
      .catch((err)=>{
        console.error("error downloading data", filePath, err);
        throw err;
      })
}

async function doesPathExist(filePath) {
  const params = {
    Bucket: bucketName,
    Key: filePath,
  };
  console.log("params", params)
  try {
    await s3.headObject(params).promise()
    return true;
  } catch(err) {
    console.log(params, err)
    return false;
  }
}

async function listFiles() {
  const params = {
    Bucket: bucketName,
    Delimiter: '/',
    Prefix: 'players/'
  }
  try {
  return s3.listObjects(params).promise();
  } catch(err) {
    console.log(params, err)
    return false;
  }
}

async function fetchDayDataToS3(date) {
  try {
    const data = await axios({
      method: "get",
      url: `http://vdzserver.org/spelunky2/${date}.json`,
    });
    const json = data.data;
    const path = getDayFilePath(date);
    console.log(path);
    await uploadFile(path, JSON.stringify(json))
    // fs.writeFileSync(path, JSON.stringify(json));
  } catch(e) {
    console.error("error fetching data for date", date, e);
  }
}

async function fetchAllDaysData(refetchFromDate) {
  let date = DateTime.local().toUTC().startOf('day').plus({ days: -1 });
  while(date >= refetchFromDate) {
    const formattedDay = date.toFormat("yyyy-MM-dd");
    const path = getDayFilePath(formattedDay);
    if (!await doesPathExist(path)) {
      await fetchDayDataToS3(formattedDay);
    } else {
      console.log(`path exists for ${path}, skipping fetch`)
    }
    date = date.plus({ days: -1 });
  }
}

function getDayFilePath(formattedDay) {
  return `dates/${formattedDay}.json`;
}

module.exports = { uploadFile, readJsonFile, doesPathExist, listFiles, fetchAllDaysData, getDayFilePath}
