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
  const options = {
    chart: {
      type: 'column'
    },
    plotOptions: {
      column: {
        colorByPoint: true
      },
      series: {
        minPointLength: 3
      }
    },
    colors: [
      '#8B786D',
      '#8B786D',
      '#8B786D',
      '#8B786D',
      '#8B786D',
      '#590925',
      '#590925',
      '#590925',
      '#590925',
      '#F6AA1C',
      '#16425B',
      '#16425B',
      '#16425B',
      '#16425B',
      '#78A1BB',
      '#DAD4EF',
      '#DAD4EF',
      '#DAD4EF',
      '#DAD4EF',
      '#9CDE9F',
      '#9CDE9F',
      '#9CDE9F',
      '#9CDE9F',
      '#002626',
    ],
    title: {text:"Maximum World Reached"},
    credits: {
      enabled: false
    },
    legend:{
      enabled:false,
    },
    yAxis: {
      title: { text: "Number of Players" }
    },
    xAxis: {
      min: 1,
      max: 23,
      tickPositions: [1, 5, 9, 10, 14, 15, 19, 23],
      labels: {
        formatter: function() {
          const levelDefinition = getLevelDefinition(this.value);
          if (levelDefinition.value === 23) {
            return "ocean";
          }
          return `${levelDefinition.toString()}`
        }
      },
      crosshair: true
    },
    series: [{
      name: 'WorldEntered',
      data: data,
    }],
    tooltip: {
      formatter: function() {
        const levelDefinition = getLevelDefinition(this.x);
        return `${levelDefinition.worldName} ${levelDefinition.toString()}<br/>${this.y} players`
      }
    }
  }

  const Chart = () => <div>
    <HighchartsReact
        highcharts={Highcharts}
        options={options}
    />
  </div>
  return <Chart />;
}
