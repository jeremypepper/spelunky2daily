var AWS = require("aws-sdk");
const _ = require("lodash");
AWS.config.update({
  region: "us-west-2",
});

var docClient = new AWS.DynamoDB.DocumentClient();

var table = "spelunky2daily";


var params = {
    Item:{
        "name": "test1",
        "data": {
            rank:1,
            percentile: 90,
            days: [1,2,3,4,5]
        }
    }
};
const params2 = _.cloneDeep(params)
params2.Item.name = "test2"


console.log("Adding a new item...");
const requestPayloadJSON = {
    RequestItems: {
        "spelunky2daily": [{
            PutRequest: {
                ...params
            }
        },{
            PutRequest: {
                ...params2
            }
        }]
    }
}
console.log(JSON.stringify(requestPayloadJSON, null, 2))
docClient.batchWrite(requestPayloadJSON, function(err, data) {
    if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
    }
});
