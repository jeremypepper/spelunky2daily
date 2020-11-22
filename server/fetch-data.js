const {getPlayerName} = require("../src/utils");

const fs = require("fs");
const axios = require("axios");
const { DateTime } = require("luxon");
const DAYS_TO_FETCH = 30;
const DAYS_FOR_DECAYING_SCORE = 10;
const DECAY_CONST = 0.9;
const LAST_DAY = DateTime.fromFormat("2020-09-14 +0000", "yyyy-MM-dd ZZZ").toUTC()
const _ = require("lodash");
let latestDate;
function getDayFilePath(formattedDay) {
  return `../public/dates/${formattedDay}.json`;
}

async function fetchDayDataToFile(date) {
  const data = await axios({
    method: "get",
    url: `http://vdzserver.org/spelunky2/${date}.json`,
  });
  const json = data.data;
  const path = getDayFilePath(date);
  fs.writeFileSync(path, JSON.stringify(json));
  console.log(path);
}

async function fetchAllDaysData() {
  let date = DateTime.local().toUTC().startOf('day').plus({ days: -1 });
  latestDate = date.toFormat("yyyy-MM-dd");
  while(date >= LAST_DAY) {
    let formattedDay = date.toFormat("yyyy-MM-dd");
    if (!fs.existsSync(getDayFilePath(formattedDay))) {
      await fetchDayDataToFile(formattedDay);
    }
    date = date.plus({ days: -1 });
  }
}

async function processData() {
  const dataByPlayer = {};
  const dataByDate = {};
  let date = DateTime.local().toUTC().startOf('day').plus({ days: -1 });
  while(date >= LAST_DAY) {
    let formattedDay = date.toFormat("yyyy-MM-dd");
    const path = getDayFilePath(formattedDay);
    const json = JSON.parse(fs.readFileSync(path));
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
    date = date.plus({ days: -1 });
  }

  // calculate last 10 days
  _.forEach(dataByPlayer, (playerData, playerName) => {
    const scores = [];
    const percentiles = [];
    for (let i = DAYS_FOR_DECAYING_SCORE; i > 0; i--) {
      date = DateTime.local().toUTC().startOf('day').plus({ days: -1 - i });
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
  const tenDayPercentileScoreList = _(dataByPlayer).map((playerData, playerName) => {
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

  return { dataByPlayer, dataByDate, tenDayPercentileScoreList };
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

function writeDataSummaries(dataByPlayer, dataByDate, tenDayPercentileScoreList) {
  // fs.writeFileSync("../public/dataByPlayer.json", JSON.stringify(dataByPlayer));
  // fs.writeFileSync("../public/dataByDate.json", JSON.stringify(dataByDate));
  const playersInLastTenDays = _.values(tenDayPercentileScoreList).length;
  const playersEver = _.values(dataByPlayer).length;
  console.log("players in last 10 days:", playersInLastTenDays)
  console.log("players ever", playersEver);
  fs.writeFileSync("../public/tenDayPercentileScoreList.json", JSON.stringify(tenDayPercentileScoreList));

  fs.writeFileSync("../src/latest-date.json", JSON.stringify({
    date: latestDate,
    dates: _.keys(dataByDate)
  }))
  // write out each player
  _.forEach(dataByPlayer, (player) => {
    console.log("player:", player.name)
    const playerName = getPlayerName(player.name)
    if (!playerName) {
      return;
    }
    const folderName = playerName.charAt(0).toLowerCase();
    const folderPath = `../public/players/${folderName}`;
    const filePath = `${folderPath}/${playerName}.json`;
    console.log(`writing ${filePath}`);
    fs.mkdirSync(folderPath, { recursive: true });

    fs.writeFileSync(filePath, JSON.stringify(player));
  });

  _.forEach(dataByDate, (data, date) => {
    fs.writeFileSync(
      `../public/processeddates/${date}.json`,
      JSON.stringify(data)
    );
  });
}

async function run() {
  await fetchAllDaysData();
  const { dataByPlayer, dataByDate, tenDayPercentileScoreList } = await processData();
  attachSummaries(dataByPlayer);
  writeDataSummaries(dataByPlayer, dataByDate, tenDayPercentileScoreList);
  // console.log(dataByPlayer["JeremyHay"])
}
run();
