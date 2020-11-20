import {DateTime} from "luxon";


export function parseDate(dateText) {
  const date = DateTime.fromFormat(dateText, "yyyy-MM-dd").valueOf()
  return date;
}
