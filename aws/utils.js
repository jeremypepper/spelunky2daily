const {DateTime} = require("luxon");

function parseDate(dateText) {
  const date = DateTime.fromFormat(dateText, "yyyy-MM-dd").valueOf()
  return date;
}

const regexInvalidCharacters = new RegExp("[^A-Za-z0-9\\-_]", "g")
function getPlayerName(playerName) {
  if (playerName) {
    return playerName.replace(regexInvalidCharacters, '__');
  }
  return '';
}

function getLevelDefinition(levelNumber) {
  if (levelNumber <= 4) {
    return {
      world: 1,
      sublevel: levelNumber,
      worldName: "dwelling"
    }
  } else if (levelNumber <= 8) {
    // volcana/jungle
    return {
      world: 2,
      sublevel: levelNumber - 4,
      worldName: "volcana/jungle"
    }
  } else if (levelNumber === 9) {
    // olmec
    return {
      world: 3,
      sublevel: 1,
      worldName: "olmec"
    }
  } else if (levelNumber <= 13) {
    return {
      world: 4,
      sublevel: levelNumber - 9,
      worldName: "tidepool/temple"
    }
  } else if (levelNumber <= 14) {
    // ice caves
    return {
      world: 5,
      sublevel: 1,
      worldName: "icecaves"
    }
  } else if (levelNumber <= 18) {
    // disco babylon
    return {
      world: 6,
      sublevel: levelNumber - 14,
      worldName: "neobabylon"
    }
  } else if (levelNumber <= 22) {
    return {
      world: 7,
      sublevel: levelNumber - 18,
      worldName: "sunkencity"
    }
  } else {
    // cosmic ocean
    return {
      world: 7,
      sublevel: levelNumber - 18,
      worldName: "cosmic ocean"
    }
  }
}

module.exports =  {
  parseDate,
  getLevelDefinition,
  getPlayerName,
}
