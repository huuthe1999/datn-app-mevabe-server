exports.convertToStartTimeOfDay = (time) => {
    let startTime = new Date(parseInt(time));
    startTime.setHours(0, 0, 0, 0);
    return startTime.getTime();
};

exports.convertToEndTimeOfDay = (time) => {
    let endTime = new Date(parseInt(time));
    endTime.setHours(23, 59, 59, 999);
    return endTime.getTime();
};

exports.compareDate = (time1, time2) => {
    return (
        new Date(parseInt(time1)).getTime() ===
        new Date(parseInt(time2)).getTime()
    );
};
