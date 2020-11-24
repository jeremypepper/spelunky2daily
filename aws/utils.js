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

class LevelDefintion {
  constructor(value, world, sublevel, worldName) {
    this.value = value;
    this.world = world;
    this.sublevel = sublevel;
    this.worldName = worldName;
  }

  toString() {
    if (this.value === 23) {
      return "ocean";
    }
    return `${this.world}-${this.sublevel}`
  }
}

function getLevelDefinition(levelNumber) {
  if (levelNumber <= 4) {
    return new LevelDefintion(levelNumber, 1, levelNumber, "dwelling");
    // return {
    //   world: 1,
    //   sublevel: levelNumber,
    //   worldName: "dwelling"
    // }
  } else if (levelNumber <= 8) {
    // volcana/jungle
    return new LevelDefintion(levelNumber, 2,levelNumber - 4, "volcana/jungle");
  } else if (levelNumber === 9) {
    // olmec
    return new LevelDefintion(levelNumber,
      3,
      1,
      "olmec"
    );
  } else if (levelNumber <= 13) {
    return new LevelDefintion(levelNumber,
      4,
      levelNumber - 9,
      "tidepool/temple");
  } else if (levelNumber <= 14) {
    // ice caves
    return new LevelDefintion(levelNumber,
      5,
      1,
      "icecaves"
    );
  } else if (levelNumber <= 18) {
    // disco babylon
    return new LevelDefintion(levelNumber,
      6,
      levelNumber - 14,
      "neobabylon"
    );
  } else if (levelNumber <= 22) {
    return new LevelDefintion(levelNumber,
      7,
      levelNumber - 18,
      "sunkencity"
    );
  } else {
    // cosmic ocean
    return new LevelDefintion(levelNumber,
      7,
      levelNumber - 18,
      "cosmic ocean"
    );
  }
}

module.exports =  {
  parseDate,
  getLevelDefinition,
  getPlayerName,
}
