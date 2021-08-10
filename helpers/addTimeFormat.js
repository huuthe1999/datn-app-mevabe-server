const moment = require("moment");

exports.addTimeFormat = (time, timeFormat) => {
    let formatter = "MM/DD/YYYY HH:mm";

    let convertedTime = moment(time).format(formatter);

    let hours = 0, days = 0, months = 0, years = 0;

    let splitTime = timeFormat.split("\\");

    years = Number(splitTime[0]);
    months = Number(splitTime[1]);
    days = Number(splitTime[2]);
    hours = Number(splitTime[3]);

    let resultTime = moment(convertedTime, formatter).add(hours, "hours").add(days, "days").add(months, "months").add(years, "years");

    let convertToMS = moment(resultTime, formatter).valueOf();

    return convertToMS;
}