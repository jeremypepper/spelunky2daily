const {fetchAllDaysData} = require("./s3-utils");
const { DateTime } = require("luxon");


async function run() {
  let refetchFromDate = DateTime.local().toUTC().startOf('day').plus({ days: -1 })
  const datesData = await fetchAllDaysData(refetchFromDate)
  console.log(JSON.stringify(datesData, null, 2))
}

run();
