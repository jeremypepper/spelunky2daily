import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import Day from "./Day";
import Player from "./Player";
import reportWebVitals from "./reportWebVitals";
import {fetchPath} from "./api";


async function getDateAndGo() {
  window.lastDayJSON = await fetchPath("/latest-date.json")
      .then((response) => response.json());

  const urlParams = new URLSearchParams(window.location.search);
  let app;
  const player = urlParams.get("player");
  const day = urlParams.get("day") || window.lastDayJSON.date;
  if (player) {
    app = <Player player={player} />;
  } else {
    app = <Day day={day} />;
  }

  ReactDOM.render(
      <React.StrictMode>{app}</React.StrictMode>,
      document.getElementById("root")
  );
}
getDateAndGo();


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
