import "./Player.css";
import React, { useEffect, useState } from "react";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import {TableBody} from "@material-ui/core";
import _ from 'lodash';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official'
import {parseDate, getPlayerName, getLevelDefinition} from "./utils";
import {fetchPath, fetchPlayer} from "./api";
const {DateTime} = require("luxon");

function Player(props) {
  const [playerData, setPlayerData] = useState(null);
  const [percentilesByDate, setPercentilesByDate] = useState(null);
  const player = props.player;

  useEffect(() => {
    fetchPlayer(player)
      .then((data) => {
        setPlayerData(data);
      });
  }, [player]);
  useEffect(()=> {
    fetchPath("/percentilesByDate.json")
        .then(d=>d.json())
        .then(newPercentilesByDate=> setPercentilesByDate(newPercentilesByDate))
  },[])

  if (!playerData) {
    return null;
  }

  function createRow(label, value) {
    return <TableRow>
      <TableCell>{label}</TableCell>
      <TableCell>{value}</TableCell>
    </TableRow>;
  }

  function createDayRow(date, dayData) {
    return <TableRow>
      <TableCell>{date}</TableCell>
      <TableCell>{dayData.level}</TableCell>
      <TableCell>{dayData.score}</TableCell>
      <TableCell>{(dayData.runframes / 60).toFixed(3)}</TableCell>
      <TableCell>{dayData.rank}</TableCell>
      <TableCell>{dayData.percentile.toFixed(2)}</TableCell>
    </TableRow>;
  }

  const summaryRows = [
    createRow("Best Rank", `${playerData.rankSummary.min} (${playerData.percentileSummary.max.toFixed(2)})%`),
    createRow("Median Rank", `${playerData.rankSummary.median} (${playerData.percentileSummary.median.toFixed(2)})%`),
  ];
  const dayRows = _.map(playerData.scoreData, (dataDay, date) => {
    return createDayRow(date, dataDay);
  })

  function getChartData(dataByDay, percentilesByDate) {
    return _.map(dataByDay, (dayData, day) => {
      return [parseDate(day), dayData.level];
    }).reverse();
  }

  const chartData = getChartData(playerData.scoreData, percentilesByDate);
  const p25Series = [];
  const p50Series = [];
  const p75Series = [];
  const p80Series = [];
  const p90Series = [];
  const p95Series = [];
  const p99Series = [];
  _.forEach(chartData, (data) => {
    const date = DateTime.fromMillis(data[0], {zone: 'UTC'})
    // const date = new Date(key)
    const dataForDate = percentilesByDate[date.toString()];
    if (dataForDate) {
      p25Series.push([data[0], dataForDate["p25"]]);
      p50Series.push([data[0], dataForDate["p50"]]);
      p75Series.push([data[0], dataForDate["p75"]]);
      p80Series.push([data[0], dataForDate["p80"]]);
      p90Series.push([data[0], dataForDate["p90"]]);
      p95Series.push([data[0], dataForDate["p95"]]);
      p99Series.push([data[0], dataForDate["p99"]]);
    }
  })
  const options = {
    credits: {
      enabled: false
    },
    chart: {
      type: 'spline'
    },
    title: {
      text: 'Depth Over Time'
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br>',
      pointFormat: '{point.x:%m-%d}: {point.y}',
      formatter: function() {
        const levelDefinition = getLevelDefinition(this.y);
        const date = Highcharts.dateFormat('%m-%d-%Y', new Date(this.x))
        return `${date} <br/>${levelDefinition.worldName} ${levelDefinition.toString()}<br/>`
      }
    },
    xAxis: {
      type: 'datetime',
      title: {
        text: 'Daily'
      }
    },
    yAxis: {
      title: {
        text: 'Depth (floors reached)'
      },
      min: 1,
      labels: {
        formatter: function() {
          const levelDefinition = getLevelDefinition(this.value);
          if (levelDefinition.value === 23) {
            return "ocean";
          }
          return `${levelDefinition.toString()}`
        }
      },

    },
    legend:{
      enabled:true,
    },
    series: [{
      name: player,
      data: chartData
    },
    //   {
    //   name: "25th percentile",
    //   data: p25Series,
    //   dashStyle: 'ShortDash',
    // },
      {
      name: "50th percentile",
      color: "#DDDDDD",
      dashStyle: 'ShortDash',
      data: p50Series,
    },
      // {
    //   name: "75th percentile",
    //     selected: false,
    //     color: "#CCFFFF",
    //     dashStyle: 'ShortDash',
    //   data: p75Series,
    // }, {
    //   name: "90th percentile",
    //     selected: false,
    //     color: "#CCFFCC",
    //   data: p90Series,
    // }
    // , {
    //   name: "95th percentile",
    //   data: p95Series,
    // }, {
    //   name: "99th percentile",
    //   data: p99Series,
    // }
    ]
  }
  const Chart = () => <div>
    <HighchartsReact
        highcharts={Highcharts}
        options={options}
    />
  </div>

  return (
    <div>
      <div className="title">{playerData.name}</div>
      <Table>
        <TableBody>
          {summaryRows}
        </TableBody>
      </Table>
      <Chart />
      <Table>
        <TableHead>
          <TableCell>date</TableCell>
          <TableCell>level</TableCell>
          <TableCell>score</TableCell>
          <TableCell>time</TableCell>
          <TableCell>rank</TableCell>
          <TableCell>percentile</TableCell>
        </TableHead>
        <TableBody>
          {dayRows}
        </TableBody>
      </Table>
    </div>
  );
}

export default Player;
