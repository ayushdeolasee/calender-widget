function datetime(diff) {
    const currentDate = new Date();
    const date = new Date(currentDate.getTime() + diff * 60000);

    const utcTime = new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
    );

    const now = BigInt(utcTime) * BigInt(1000000);
    return new fastn.recordInstanceClass({
        dt: now,
    });
}

function fmt(dt, ft) {
    const i64 = Number(dt.get().toObject().dt);
    const milliseconds = Math.floor(i64 / 1000000);
    const date = new Date();
    const timezone_offset = date.getTimezoneOffset();
    const local_time = milliseconds - timezone_offset * 60000;
    const local_date = new Date(local_time);
    const format = ft.replaceAll(`"`, "");

    if (format == "datetime") {
        const weekdays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const weekday = weekdays[local_date.getDay()];

        const day = local_date.getDate();
        let dayWithSuffix = day;
        if (day > 0) {
            const suffixes = ["th", "st", "nd", "rd"];
            const relevantDigits =
                day % 100 > 10 && day % 100 < 14 ? 0 : day % 10;
            dayWithSuffix = day + (suffixes[relevantDigits] || suffixes[0]);
        }

        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        const month = months[local_date.getMonth()];

        // Get year
        const year = local_date.getFullYear();

        // Get hours in 12-hour format
        let hours = local_date.getHours();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12

        const minutes = local_date.getMinutes().toString().padStart(2, "0");

        const seconds = local_date.getSeconds().toString().padStart(2, "0");

        const ms = local_date.getMilliseconds().toString().padStart(3, "0");

        const formattedDate = `${weekday} ${dayWithSuffix} ${month} ${year} ${hours}:${minutes}:${seconds}:${ms} ${ampm}`;

        return formattedDate;
    } else if (format == "date") {
        const weekdays = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        const weekday = weekdays[local_date.getDay()];

        const day = local_date.getDate();
        let dayWithSuffix = day;
        if (day > 0) {
            const suffixes = ["th", "st", "nd", "rd"];
            const relevantDigits =
                day % 100 > 10 && day % 100 < 14 ? 0 : day % 10;
            dayWithSuffix = day + (suffixes[relevantDigits] || suffixes[0]);
        }

        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        const month = months[local_date.getMonth()];

        // Get year
        const year = local_date.getFullYear();

        const formattedDate = `${weekday} ${dayWithSuffix} ${month} ${year}`;

        return formattedDate;
    } else if (format == "time") {
        let hours = local_date.getHours();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12

        const minutes = local_date.getMinutes().toString().padStart(2, "0");

        const seconds = local_date.getSeconds().toString().padStart(2, "0");

        const ms = local_date.getMilliseconds().toString().padStart(3, "0");

        const formatedTime = `${hours}:${minutes}:${seconds}:${ms} ${ampm}`;
        return formatedTime;
    } else {
        return "ft parameter not recognized, please select either: datetime, date or time";
    }
}
