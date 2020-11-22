import "./App.css";
import _ from 'lodash';
import React, { useEffect, useState } from "react";
import { DateTime } from "luxon";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {TableBody} from "@material-ui/core";
import latestDate from './latest-date'
import {parseDate} from "./utils";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import Histogram from "./DayHistogram";
const PUBLIC_URL = process.env.PUBLIC_URL;

function formatDay(date) {
  return date.toUTC().toFormat("yyyy-MM-dd");
}

function doesDayHaveData(formattedDay) {
  return _.includes(latestDate.dates, formattedDay);
}

function getFormattedDayDelta(formattedDay, delta) {
  const nextDate = DateTime.fromMillis(parseDate(formattedDay)).plus({days: delta});
  const nextDay = formatDay(nextDate)
  return doesDayHaveData(nextDay) ? nextDay : null;
}

function getFormattedPreviousDay(formattedDay) {
  return getFormattedDayDelta(formattedDay, -1);
}

function getFormattedNextDay(formattedDay) {
  return getFormattedDayDelta(formattedDay, 1);
}



function DayTable(props) {
  const useStyles = makeStyles({
    table: {
      minWidth: 650,
    },
  });
  const classes = useStyles();
  if (!props.dayData) {
    return null;
  }

  const tableRows = _.map(props.dayData, player => {
    return <TableRow key={player.id}>
        <TableCell><a href={`?player=${player.name}`}>{player.name}</a></TableCell>
      <TableCell>{player.platform === 18 ? "Steam" : "Playstation"}</TableCell>
      <TableCell>{player.level}</TableCell>
      <TableCell>{player.percentile.toFixed(2)}</TableCell>
    </TableRow>;
  })

  return (
    <div>
      <TableContainer component={Paper}>
        <Table className={classes.table} size={"small"}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Percentile</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

function Day(props) {
  const [dayData, setDayData] = useState(null);
  const formattedDay = props.day;

  useEffect(() => {
    fetch(PUBLIC_URL + "/processeddates/" + formattedDay + ".json")
      .then((response) => response.json())
      .then((data) => {
        setDayData(data);
      });
  }, [formattedDay]);
  const previousDay = getFormattedPreviousDay(formattedDay);
  const nextDay = getFormattedNextDay(formattedDay);
  const previousDayElement = previousDay
      ? <a href={"?day=" + previousDay}>Previous Day</a>
      : null;
  const nextDayElement = nextDay
      ? <a href={"?day=" + nextDay}>Next Day</a>
      : null;
  return (
    <div className="App">
      <header>
        <div className="main">Daily Challenge for {formattedDay}</div>
        <div className="subtitle">Data Provided by {" "}
          <a href="http://vdzserver.org/spelunky2">http://vdzserver.org/spelunky2</a>
        </div>
        <nav className="day-nav">
          {previousDayElement}
          {nextDayElement}
        </nav>
      </header>
      <div className="histogram-wrapper">
        <Histogram dayData={dayData} />
      </div>
      <DayTable dayData={dayData} />
    </div>
  );
}

export default Day;
