const {uploadFile, readJsonFile, doesPathExist} = require("./s3-utils");
const {getPlayerName} = require("./utils");

const axios = require("axios");
const { DateTime } = require("luxon");
const DAYS_FOR_DECAYING_SCORE = 10;
const DECAY_CONST = 0.9;
const LAST_DAY = DateTime.fromFormat("2020-09-14 +0000", "yyyy-MM-dd ZZZ").toUTC()
// const LAST_DAY = DateTime.fromFormat("2020-11-14 +0000", "yyyy-MM-dd ZZZ").toUTC()
const _ = require("lodash");
let latestDate;
const LOOKBACK_DAYS = -1;
function getDayFilePath(formattedDay) {
  return `dates/${formattedDay}.json`;
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

async function fetchAllDaysData() {
  let date = DateTime.local().toUTC().startOf('day').plus({ days: LOOKBACK_DAYS });
  latestDate = date.toFormat("yyyy-MM-dd");
  while(date >= LAST_DAY) {
    const formattedDay = date.toFormat("yyyy-MM-dd");
    const path = getDayFilePath(formattedDay);
    if (!await doesPathExist(path)) {
      await fetchDayDataToS3(formattedDay);
    } else {
      console.log(`path exists for ${path}, skipping fetch`)
    }
    date = date.plus({ days: LOOKBACK_DAYS });
  }
}

function getLevelAtPercentile(dayJSON, percentile) {
  const maxRank = dayJSON.length - 1;
  const index = Math.floor((1 - percentile) * maxRank);
  return dayJSON[index].level;
}

async function processData() {
  const dataByPlayer = {};
  const dataByDate = {};
  const percentilesByDate = {};
  let date = DateTime.local().toUTC().startOf('day').plus({ days: LOOKBACK_DAYS });
  while(date >= LAST_DAY) {
    let formattedDay = date.toFormat("yyyy-MM-dd");
    const path = `dates/${formattedDay}.json`
    const json = await readJsonFile(path);
    dataByDate[formattedDay] = json;
    _.forEach(json, (player, rank) => {
      const name = player.name;
      // append what place they were in (indexed starting at 1)
      player.rank = rank + 1;
      player.percentile = 100 - ( rank  / (json.length -1)) * 100;
      let playerData = dataByPlayer[name];
      if (!playerData) {
        playerData = {
          name,
          scoreData: {},
        };
        dataByPlayer[name] = playerData;
      }
      // append the data for the day
      playerData.scoreData[formattedDay] = player;
    });

    // find percentiles
    const percentiles = {
      p25: getLevelAtPercentile(json,0.25),
      p50: getLevelAtPercentile(json,0.50),
      p75: getLevelAtPercentile(json,0.75),
      p80: getLevelAtPercentile(json,0.80),
      p90: getLevelAtPercentile(json,0.90),
      p95: getLevelAtPercentile(json,0.95),
      p99: getLevelAtPercentile(json,0.99),
    }
    percentilesByDate[date] = percentiles;
    date = date.plus({ days: LOOKBACK_DAYS });
  }

  // calculate last 10 days
  _.forEach(dataByPlayer, (playerData, playerName) => {
    const scores = [];
    const percentiles = [];
    for (let i = DAYS_FOR_DECAYING_SCORE; i > 0; i--) {
      date = DateTime.local().toUTC().startOf('day').plus({ days: LOOKBACK_DAYS - i });
      const dataForDay = playerData.scoreData[date.toFormat("yyyy-MM-dd")];
      if (dataForDay) {
        // calculate a decaying percentile score (more days ago means more decay)
        scores.push(dataForDay.percentile * Math.pow(DECAY_CONST, i));
        percentiles.push(dataForDay.percentile);
      }
    }
    playerData["tenDayPercentiles"] = percentiles;
    playerData["tenDayDecayingPercentileScore"] = scores.length > 0
        ? _(scores).sortBy().reverse().take(DAYS_FOR_DECAYING_SCORE/2).sum()
        : 0;
    playerData["scoresByDay"] = scores;
  });
  const tenDayPercentileScoreList = _(dataByPlayer)
      .map((playerData, playerName) => {
        return {
          playerName,
          tenDayDecayingPercentileScore: playerData.tenDayDecayingPercentileScore,
          tenDayPercentiles: playerData.tenDayPercentiles,
          scoresByDay: playerData.scoresByDay
        }
      })
      .filter( player => player.scoresByDay.length > 0)
      .sortBy("tenDayDecayingPercentileScore")
      .reverse()
      .valueOf()

  return { dataByPlayer, dataByDate, tenDayPercentileScoreList, percentilesByDate };
}

function attachSummaries(dataByPlayer) {
  _.forEach(dataByPlayer, (player) => {
    function rankNumber(scoreData, property) {
      const ranks = _(scoreData).map(property).valueOf();
      const sortedRanks = _(ranks).sortBy().valueOf();
      return {
        mean: _.mean(sortedRanks),
        median: sortedRanks[Math.round(sortedRanks.length / 2) - 1],
        max: _.last(sortedRanks),
        min: _.first(sortedRanks),
      };
    }
    const rankSummary = rankNumber(player.scoreData, "rank");
    const percentileSummary = rankNumber(player.scoreData, "percentile");
    _.extend(player, {
      rankSummary,
      percentileSummary,
    });
  });
}

async function writeDataSummaries(dataByPlayer, dataByDate, tenDayPercentileScoreList, percentilesByDate) {
  const playersInLast7Days = _.values(tenDayPercentileScoreList);
  const playersEver = _.values(dataByPlayer).length;
  console.log("players in last 7 days:", playersInLast7Days.length)
  console.log("players ever", playersEver);
  await uploadFile('tenDayPercentileScoreList.json',
      JSON.stringify(tenDayPercentileScoreList));
  await uploadFile('percentilesByDate.json',
      JSON.stringify(percentilesByDate));
  await uploadFile('latest-date.json',  JSON.stringify({
    date: latestDate,
    dates: _.keys(dataByDate)
  }))

  // write out each player that has played in the last 10 days
  const players = playersInLast7Days;
  const playerPromises = []
  for (let i = 0; i < players.length; i++) {
    const playerName = getPlayerName(players[i].playerName);
    const player = dataByPlayer[playerName];
    if (!playerName) {
      return;
    }
    const folderName = playerName.charAt(0).toLowerCase();
    const folderPath = `players/${folderName}`;
    const filePath = `${folderPath}/${playerName}.json`;
    console.log(`writing ${i}/${players.length} ${filePath}`);
    playerPromises.push(uploadFile(filePath, JSON.stringify(player)));
  }
  console.log("waiting for all players to upload")
  await Promise.all(playerPromises);

  console.log("uploading processed data by date")
  const dates = _.keys(dataByDate);
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const data = dataByDate[date];
    await uploadFile(`processeddates/${date}.json`, JSON.stringify(data));
  }
}

async function run() {
  console.log("fetching all days")
  await fetchAllDaysData();
  console.log("processing all days")
  const { dataByPlayer, dataByDate, tenDayPercentileScoreList, percentilesByDate } = await processData();
  attachSummaries(dataByPlayer);
  await writeDataSummaries(dataByPlayer, dataByDate, tenDayPercentileScoreList, percentilesByDate);
}


module.exports = {run};
