

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

module.exports = { uploadFile, readJsonFile, doesPathExist}
