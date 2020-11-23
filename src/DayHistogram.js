import _ from "lodash";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import React from "react";
import {getLevelDefinition} from "./utils";

const getLevel = (playerDayData) => playerDayData.level;
function getLevelButGroupOcean(playerDayData) {
  const level = getLevel(playerDayData);
  return level > 23 ? 23 : level;
}
const getWorldNumber = (playerDayData) => {
    if (playerDayData.level <= 4) {
      // dwelling
      return 1;
    } else if (playerDayData.level <= 8) {
      // volcana/jungle
      return 2;
    } else if (playerDayData.level === 9) {
      // olmec
      return 3;
    } else if (playerDayData.level <= 13) {
      // tide pool / temple
      return 4;
    } else if (playerDayData.level <= 14) {
      // ice caves
      return 5;
    } else if (playerDayData.level <= 18) {
      // disco babylon
      return 6;
    } else if (playerDayData.level <= 22) {
      // sunken city
      return 7;
    } else {
      // cosmic ocean
      return 8;
    }
}
function getWorldNumberBuckets(dayData) {
  return _.countBy(dayData, getLevelButGroupOcean);
}

export default function Histogram(props) {
  if (!props.dayData) {
    return null;
  }
  const worldNumbers = getWorldNumberBuckets(props.dayData);
  const data = [0];
  const maxLevel = _.max(_.keys(worldNumbers).map(number => Number.parseInt(number, 10)))
  for (let i = 1; i <= maxLevel; i++) {
    data[i] = worldNumbers[i] || 0;
  }
  //const data = _.map(worldNumbers, count => count);
  const options = {
    chart: {
      type: 'column'
    },
    title: {text:"Maximum World Reached"},
    credits: {
      enabled: false
    },
    legend:{
      enabled:false,
    },
    yAxis: {
      title: "Number of Players"
    },
    xAxis: {
      min: 1,
      max: 23,
      // categories: [
      //   'Dwelling',
      //   'Volcana/Jungle',
      //   'Olmec',
      //   'Tide Pool/Temple',
      //   'Ice Caves',
      //   'Neo Babylon',
      //   'Sunken City',
      //   'Cosmic Ocean',
      // ],
      labels: {
        formatter: function() {
          const levelDefinition = getLevelDefinition(this.value);
          if (this.value === 23) {
            return "ocean";
          }
          return `${levelDefinition.world}-${levelDefinition.sublevel}`
        }
      },

      crosshair: true
    },
    series: [{
      name: 'WorldEntered',
      data: data,
    }]
  }

  const Chart = () => <div>
    <HighchartsReact
        highcharts={Highcharts}
        options={options}
    />
  </div>
  return <Chart />;
}
