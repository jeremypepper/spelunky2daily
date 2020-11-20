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
function Histogram(props) {
  if (!props.dayData) {
    return null;
  }
  const data = _.map(getBins(props.dayData), count => count);
  const options = {
    chart: {
      type: 'column'
    },
    title: {text:"Maximum World Reached"},
    credits: {
      enabled: false
    },
    xAxis: {
      categories: [
        'Dwelling',
        'Volcana/Jungle',
        'Olmec',
        'Tide Pool/Temple',
        'Ice Caves',
        'Neo Babylon',
        'Sunken City',
        'Cosmic Ocean',
      ],
      crosshair: true
    },
    series: [{
      name: 'WorldEntered',
      data: data,
    }]
  }
  // const options = {
  //   chart: {
  //     type: 'column'
  //   },
  //   title: {
  //     text: 'Monthly Average Rainfall'
  //   },
  //   subtitle: {
  //     text: 'Source: WorldClimate.com'
  //   },
  //   xAxis: {
  //     categories: [
  //       'Jan',
  //       'Feb',
  //       'Mar',
  //       'Apr',
  //       'May',
  //       'Jun',
  //       'Jul',
  //       'Aug',
  //       'Sep',
  //       'Oct',
  //       'Nov',
  //       'Dec'
  //     ],
  //         crosshair: true
  //   },
  //   yAxis: {
  //     min: 0,
  //         title: {
  //       text: 'Rainfall (mm)'
  //     }
  //   },
  //   tooltip: {
  //     headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
  //         pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
  //     '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
  //         footerFormat: '</table>',
  //         shared: true,
  //         useHTML: true
  //   },
  //   plotOptions: {
  //     column: {
  //       pointPadding: 0.2,
  //           borderWidth: 0
  //     }
  //   },
  //   series: [{
  //     name: 'Tokyo',
  //     data: [49.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
  //
  //   }, {
  //     name: 'New York',
  //     data: [83.6, 78.8, 98.5, 93.4, 106.0, 84.5, 105.0, 104.3, 91.2, 83.5, 106.6, 92.3]
  //
  //   }, {
  //     name: 'London',
  //     data: [48.9, 38.8, 39.3, 41.4, 47.0, 48.3, 59.0, 59.6, 52.4, 65.2, 59.3, 51.2]
  //
  //   }, {
  //     name: 'Berlin',
  //     data: [42.4, 33.2, 34.5, 39.7, 52.6, 75.5, 57.4, 60.4, 47.6, 39.1, 46.8, 51.1]
  //
  //   }]
  // }

  const Chart = () => <div>
    <HighchartsReact
        highcharts={Highcharts}
        options={options}
    />
  </div>
  return <Chart />;
}
function getBins(dayData) {
  return _.countBy(dayData, function getWorld(player) {
    if (player.level <= 4) {
      // dwelling
      return 1;
    } else if (player.level <= 8) {
      // volcana/jungle
      return 2;
    } else if (player.level === 9) {
      // olmec
      return 3;
    } else if (player.level <= 13) {
      // tide pool / temple
      return 4;
    } else if (player.level <= 14) {
      // ice caves
      return 5;
    } else if (player.level <= 18) {
      // disco babylon
      return 6;
    } else if (player.level <= 22) {
      // sunken city
      return 7;
    } else {
      // cosmic ocean
      return 8;
    }
  });
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
