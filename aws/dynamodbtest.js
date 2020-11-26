var AWS = require("aws-sdk");
const _ = require("lodash");
const {getPlayerName} = require("./utils");
const {listFiles} = require("./s3-utils")
const table = "spelunky2dailyv1";
const awsparams = {
  region: "us-west-2",
}
const docClient = new AWS.DynamoDB.DocumentClient(awsparams);
AWS.config.update(awsparams);

async function getFiles() {
  const files = await listFiles()
  console.log(files);
}

async function getPlayers(playerNames) {
  var dynamodb = new AWS.DynamoDB();
  // const tablemeta = await dynamodb.describeTable({TableName: table}).promise();
  // console.log(JSON.stringify(tablemeta, null, 2))
  // var params1 = {
  //   RequestItems: {
  //     [table]: {
  //       Keys: [{
  //         "name": {
  //           S: "JeremyHay"
  //         }
  //       }]
  //     }
  //   },
  // };
  // const test = await dynamodb.batchGetItem(params1).promise()
  // console.log(JSON.stringify(test, null, 2));

  const requestItemsChunks = _(playerNames)
      .map(playerName=>getPlayerName(playerName))
      .uniq()
      .map(playerName => ({
        "name": {
          S: playerName
        }
      }))
      .chunk(100)
      .valueOf();
  const dataByPlayer = {};
  for (let i = 0; i < requestItemsChunks.length; i++) {
    const params = {
      RequestItems: {
        [table]: {
          Keys: requestItemsChunks[i]
        }
      }
    };
    await dynamodb.batchGetItem(params).promise()
        .then((data) => {
          console.log(`got chunk ${i+1}/${requestItemsChunks.length}`);
          const playersDataChunk = data.Responses[table].map(playerdata => AWS.DynamoDB.Converter.unmarshall(playerdata).data);
          _.forEach(playersDataChunk, player => {
            try {
              const playerData = JSON.parse(player)
              dataByPlayer[playerData.name] = playerData;
            }
            catch (e) {
              console.log("unable to parse data for player", player)
            }
          })
        })
        .catch(function (err) {
          if (err) {
            console.error("Unable to get items. Error JSON:", JSON.stringify(err, null, 2));
            console.error("params are", JSON.stringify(params,null, 2))
          }
        });
  }
  return dataByPlayer;
}

async function putPlayers(players) {

  const requestChunks = _(players)
      .uniqBy(player => getPlayerName(player.name))
      .map(player => ({
        PutRequest: {
          Item: {
            "name": getPlayerName(player.name),
            "data": JSON.stringify(player, null, 2),
          }
        }
      }))
      .chunk(25)
      .valueOf();

  console.log("Adding a new chunk...");

  for (let i = 0; i < requestChunks.length; i++) {
    const chunk = requestChunks[i];
    await docClient.batchWrite({
      RequestItems: {
        [table]: chunk
      }
    }).promise()
        .then(() => {
          console.log(`Added player chunk ${i+1}/${requestChunks.length}`);
        })
        .catch(function (err) {
          if (err) {
            console.error(`Unable to add chunk ${i}. Error JSON:`, JSON.stringify(err, null, 2), players.map(p=>p.name));
          }
        });
  }


}

//
// getFiles();
// putFiles();
module.exports = {putPlayers, getPlayers}
