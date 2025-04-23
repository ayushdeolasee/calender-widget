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

        // Time part: HHMMSSmmmnnnnnnnnn (always 17 digits, zero-padded)
        const hours = date.getUTCHours().toString().padStart(2, "0");
        const minutes = date.getUTCMinutes().toString().padStart(2, "0");
        const seconds = date.getUTCSeconds().toString().padStart(2, "0");
        const milliseconds = date
            .getUTCMilliseconds()
            .toString()
            .padStart(3, "0");
        // JS Date does not provide nanosecond precision, so pad with zeros
        const nanoseconds = "000000000";
        const timeStr = `${hours}${minutes}${seconds}${milliseconds}${nanoseconds}`;
        // Store as string to preserve leading zeros

        return new fastn.recordInstanceClass({
            date: datePart,
            time: timeStr,
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

        // Parse time: HHMMSSmmmnnnnnnnnn (always 17 digits)
        const timeStr = time.toString().padStart(17, "0");
        const hour = parseInt(timeStr.slice(0, 2));
        const minute = parseInt(timeStr.slice(2, 4));
        const second = parseInt(timeStr.slice(4, 6));
        const millisecond = parseInt(timeStr.slice(6, 9));
        const nanosecond = parseInt(timeStr.slice(9, 18));

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
        // Convert to ns
        const epochNs = BigInt(dateObj) * 1_000_000n + BigInt(nanosecond);
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
        // const { date, time } = dt.get().toObject();
        const dateStr = date.toString();
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1; // JS months are 0-based
        const day = parseInt(dateStr.slice(6, 8));

        // Parse time: HHMMSSmmmnnnnnnnnn (always 17 digits)
        const timeStr = time.toString().padStart(17, "0");
        const hour = parseInt(timeStr.slice(0, 2));
        const minute = parseInt(timeStr.slice(2, 4));
        const second = parseInt(timeStr.slice(4, 6));
        const millisecond = parseInt(timeStr.slice(6, 9));

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
        const i64 = Number(to_timestamp_nanos(dt));
        const milliseconds = Math.floor(i64 / 1000000);
        // Use JS Date's local time handling
        const local_date = new Date(milliseconds);
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

    // Expose all functions under window.fastn_datetime
    window.fastn_datetime = {
        now,
        to_timestamp_nanos,
        to_timestamp_millis,
        fmt,
    };
})();
