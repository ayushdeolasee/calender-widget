// Wrap all functions in an IIFE and expose as window.fastn_datetime
(function () {
    function now(diff) {
        const currentDate = new Date();
        const date = new Date(currentDate.getTime() + diff * 60000);

        // Date part: YYYYMMDD (always 8 digits)
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = date.getUTCDate().toString().padStart(2, "0");
        const datePart = parseInt(`${year}${month}${day}`);

        // Time part: nanoseconds since midnight (like Rust's chrono NaiveTime)
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        const milliseconds = date.getUTCMilliseconds();

        // Calculate total nanoseconds since midnight
        const nanosSinceMidnight =
            (hours * 3600 + minutes * 60 + seconds) * 1_000_000_000 +
            milliseconds * 1_000_000;

        return new fastn.recordInstanceClass({
            date: datePart,
            time: nanosSinceMidnight,
        });
    }

    function to_timestamp_nanos(dt) {
        let date, time;
        if (dt instanceof fastn.recordInstanceClass) {
            date = dt.toObject().date;
            time = dt.toObject().time;
        } else {
            date = dt.get().toObject().date;
            time = dt.get().toObject().time;
        }

        // Parse date: YYYYMMDD
        const dateStr = date.toString();
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1; // JS months are 0-based
        const day = parseInt(dateStr.slice(6, 8));

        // Parse time: nanoseconds since midnight
        const nanosSinceMidnight = BigInt(time);

        // Calculate hours, minutes, seconds and nanoseconds
        const nanosPerSecond = 1_000_000_000n;

        const totalSeconds = Number(nanosSinceMidnight / nanosPerSecond);
        const hour = Math.floor(totalSeconds / 3600);
        const minute = Math.floor((totalSeconds % 3600) / 60);
        const second = totalSeconds % 60;
        const nanosecond = Number(nanosSinceMidnight % nanosPerSecond);

        // Construct JS Date (ms precision)
        const dateObj = Date.UTC(
            year,
            month,
            day,
            hour,
            minute,
            second,
            Math.floor(nanosecond / 1_000_000)
        );

        // Convert to ns
        const epochNs =
            BigInt(dateObj) * 1_000_000n + BigInt(nanosecond % 1_000_000n);
        return epochNs;
    }

    function to_timestamp_millis(dt) {
        let date, time;
        if (dt instanceof fastn.recordInstanceClass) {
            date = dt.toObject().date;
            time = dt.toObject().time;
        } else {
            date = dt.get().toObject().date;
            time = dt.get().toObject().time;
        }

        // Parse date: YYYYMMDD
        const dateStr = date.toString();
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1; // JS months are 0-based
        const day = parseInt(dateStr.slice(6, 8));

        // Parse time: nanoseconds since midnight
        const nanosSinceMidnight = BigInt(time);

        // Calculate hours, minutes, seconds and milliseconds
        const nanosPerSecond = 1_000_000_000n;

        const totalSeconds = Number(nanosSinceMidnight / nanosPerSecond);
        const hour = Math.floor(totalSeconds / 3600);
        const minute = Math.floor((totalSeconds % 3600) / 60);
        const second = totalSeconds % 60;
        const millisecond = Math.floor(
            Number(nanosSinceMidnight % nanosPerSecond) / 1_000_000
        );

        // Construct JS Date (ms precision)
        const dateObj = Date.UTC(
            year,
            month,
            day,
            hour,
            minute,
            second,
            millisecond
        );

        return dateObj; // Number, ms since epoch
    }

    function fmt(dt, ft) {
        let date, time;
        if (dt instanceof fastn.recordInstanceClass) {
            date = dt.toObject().date;
            time = dt.toObject().time;
        } else {
            date = dt.get().toObject().date;
            time = dt.get().toObject().time;
        }

        const format = ft.replaceAll(`"`, "");

        // Parse date: YYYYMMDD
        const dateStr = date.toString();
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1; // JS months are 0-based
        const day = parseInt(dateStr.slice(6, 8));

        // Parse time: nanoseconds since midnight
        const nanosSinceMidnight = BigInt(time);

        // Calculate hours, minutes, seconds and nanoseconds
        const nanosPerSecond = 1_000_000_000n;
        const nanosPerMinute = nanosPerSecond * 60n;
        const nanosPerHour = nanosPerMinute * 60n;

        const totalSeconds = Number(nanosSinceMidnight / nanosPerSecond);
        const hour = Math.floor(totalSeconds / 3600);
        const minute = Math.floor((totalSeconds % 3600) / 60);
        const second = totalSeconds % 60;
        const millisecond = Math.floor(
            Number(nanosSinceMidnight % nanosPerSecond) / 1_000_000
        );
        const nanosecond = Number(nanosSinceMidnight % 1_000_000_000n);

        // Construct a JS Date for locale handling (ms precision)
        const local_date = new Date(
            Date.UTC(year, month, day, hour, minute, second, millisecond)
        );

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

            const formattedTime = `${hours}:${minutes}:${seconds}:${ms} ${ampm}`;
            return formattedTime;
        } else {
            return "ft parameter not recognized, please select either: datetime, date or time";
        }
    }

    // Expose all functions under window.fastn_datetime
    window.fastn_datetime = {
        now,
        to_timestamp_nanos,
        to_timestamp_millis,
        fmt,
    };
})();
