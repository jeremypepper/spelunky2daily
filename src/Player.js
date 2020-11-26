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
import {parseDate, getPlayerName} from "./utils";
import {fetchPath, fetchPlayer} from "./api";

function Player(props) {
  const [playerData, setPlayerData] = useState(null);
  const player = props.player;

  useEffect(() => {
    // const playerSlug = getPlayerName(player);
    // const playerFolder = playerSlug.charAt(0).toLowerCase();
    fetchPlayer(player)
    // fetchPath( `/players/${playerFolder}/${playerSlug}.json`)
      .then((data) => {
        setPlayerData(data);
      });
  }, [player]);

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

  function getChartData(dataByDay) {
    return _.map(dataByDay, (dayData, day) => {
      return [parseDate(day), dayData.level];
    }).reverse();
  }

  const chartData = getChartData(playerData.scoreData)
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
      pointFormat: '{point.x:%m-%d}: {point.y}'
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
      min: 0
    },
    series: [{
      data: chartData
    }]
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
