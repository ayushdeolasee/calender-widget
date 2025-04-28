// --- Utility Functions ---
function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

function formatDateForInput(date) {
    // Format date as YYYY-MM-DD for input value
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatTimeForInput(date) {
    // Format time as HH:MM for input value
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function formatDateToString(date) {
    if (!isValidDate(date)) {
        console.warn("Invalid date detected, using current date instead");
        return new Date().toISOString().replace(/[-:.]/g, "");
    }
    return date.toISOString().replace(/[-:.]/g, "");
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
    const nanosPerMinute = nanosPerSecond * 60n;
    const nanosPerHour = nanosPerMinute * 60n;

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

function debug_to_timestamp_millis(date, time) {
    // Parse date: YYYYMMDD
    const dateStr = date.toString();
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1; // JS months are 0-based
    const day = parseInt(dateStr.slice(6, 8));

    // Parse time: nanoseconds since midnight
    const nanosSinceMidnight = BigInt(time);

    // Calculate hours, minutes, seconds and milliseconds
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

function convertToReturnFormat(dt, withTime = true) {
    console.log(dt);
    let date = new Date(dt);
    // let date;
    // if (withTime) {
    //     date = new Date(
    //         Date.UTC(
    //             dt.getFullYear(),
    //             dt.getMonth(),
    //             dt.getDate(),
    //             dt.getHours(),
    //             dt.getMinutes(),
    //             dt.getSeconds(),
    //             dt.getMilliseconds()
    //         )
    //     );
    // } else {
    //     date = new Date(
    //         Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0)
    //     );
    // }

    // console.log("UTC Time:", utcTime);
    if (withTime == true) {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = date.getUTCDate().toString().padStart(2, "0");
        const datePart = parseInt(`${year}${month}${day}`);

        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        const milliseconds = date.getUTCMilliseconds();

        // calculate nanoseconds since midnight
        const nanosSinceMidnight =
            BigInt(hours) * 3600n * 1000000000n +
            BigInt(minutes) * 60n * 1000000000n +
            BigInt(seconds) * 1000000000n +
            BigInt(milliseconds) * 1000000n;

        return new fastn.recordInstanceClass({
            date: datePart,
            time: nanosSinceMidnight,
        });
    } else {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = date.getUTCDate().toString().padStart(2, "0");
        const datePart = parseInt(`${year}${month}${day}`);
        // no time for date-only: nanoseconds since midnight is zero
        const timePart = 0n;
        return new fastn.recordInstanceClass({
            date: datePart,
            time: timePart,
        });
    }
}

function parseDateInput(input, baseDate = null) {
    // input: 'YYYY-MM-DD', baseDate: Date or null
    const [year, month, day] = input.split("-").map(Number);
    let date = baseDate ? new Date(baseDate) : new Date();
    date.setFullYear(year);
    date.setMonth(month - 1);
    date.setDate(day);
    return date;
}

function parseTimeInput(input, baseDate = null) {
    // input: 'HH:MM', baseDate: Date or null
    const [hours, minutes] = input.split(":").map(Number);
    let date = baseDate ? new Date(baseDate) : new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

// --- Classes ---
class Calender extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.local_date = null;
        this._onChangeCallback = null;
    }

    connectedCallback() {
        const data = window.ftd.component_data(this);
        this.data = data;
        const dt = to_timestamp_millis(data.dt);
        this.local_date = new Date(dt - new Date().getTimezoneOffset());
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot
            .querySelector(".date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    const newDate = parseDateInput(
                        selectedDate,
                        this.local_date
                    );
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setDateTime(newDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs();
                }
            });

        this.shadowRoot
            .querySelector(".time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const newDate = parseTimeInput(timeValue, this.local_date);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid time input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs();
                }
            });
    }

    getDateString() {
        return formatDateForInput(this.local_date);
    }

    getTimeString() {
        return formatTimeForInput(this.local_date);
    }

    setDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, keeping previous value");
            return;
        }
        this.local_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.local_date);
        this.data.dt.get().set(convertToReturnFormat(this.local_date, true));
        if (this._onChangeCallback) this._onChangeCallback(formattedDate);
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: formattedDate, rawDate: this.local_date },
                bubbles: true,
            })
        );
    }

    updateInputs() {
        const dateInput = this.shadowRoot.querySelector(".date-input");
        const timeInput = this.shadowRoot.querySelector(".time-input");
        if (dateInput) dateInput.value = this.getDateString();
        if (timeInput) timeInput.value = this.getTimeString();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    border-radius: 8px;
                    background-color: #f5f5f5;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                input {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 16px;
                }
                label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }
                .input-group {
                    margin-bottom: 8px;
                }
            </style>
            <div class="container">
                <div class="input-group">
                    <label>Date</label>
                    <input type="date" class="date-input" value="${this.getDateString()}">
                </div>
                <div class="input-group">
                    <label>Time</label>
                    <input type="time" class="time-input" value="${this.getTimeString()}">
                </div>
            </div>
        `;
    }

    get value() {
        return formatDateToString(this.local_date);
    }

    set value(newValue) {
        this.local_date = new Date(newValue);
        this.updateInputs();
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

class DateInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.local_date = null;
        this._onChangeCallback = null;
    }

    connectedCallback() {
        const data = window.ftd.component_data(this);
        this.data = data;
        const dt = to_timestamp_millis(data.dt);
        // const date = Number(data.dt.get().toObject().dt);
        // const milliseconds = Math.floor(date / 1000000);
        this.local_date = new Date(dt - new Date().getTimezoneOffset() * 60000);
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot
            .querySelector(".date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    const newDate = parseDateInput(selectedDate);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setDateTime(newDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs();
                }
            });
    }

    getDateString() {
        return formatDateForInput(this.local_date);
    }

    setDateTime(date) {
        this.local_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.local_date);
        const recordInstance = this.data.dt.get();
        const return_value = convertToReturnFormat(this.local_date, false);
        recordInstance.set(return_value);
        if (this._onChangeCallback) this._onChangeCallback(formattedDate);
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: formattedDate, rawDate: this.local_date },
                bubbles: true,
            })
        );
    }

    updateInputs() {
        const dateInput = this.shadowRoot.querySelector(".date-input");
        if (dateInput) dateInput.value = this.getDateString();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    border-radius: 8px;
                    background-color: #f5f5f5;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                input {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 16px;
                }
                label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }
                .input-group {
                    margin-bottom: 8px;
                }
            </style>
            <div class="container">
                <div class="input-group">
                    <label>Date</label>
                    <input type="date" class="date-input" value="${this.getDateString()}">
                </div>
            </div>
        `;
    }

    get value() {
        return formatDateToString(this.local_date);
    }

    set value(newValue) {
        this.local_date = new Date(newValue);
        this.updateInputs();
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

class TimeInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.local_date = null;
        this._onChangeCallback = null;
    }

    connectedCallback() {
        const data = window.ftd.component_data(this);
        const date = Number(data.dt.get().toObject().dt);
        const milliseconds = Math.floor(date / 1000000);
        this.data = data;
        this.local_date = new Date(
            milliseconds - new Date().getTimezoneOffset() * 60000
        );
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot
            .querySelector(".time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const newDate = parseTimeInput(timeValue, this.local_date);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid time input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs();
                }
            });
    }

    getTimeString() {
        return formatTimeForInput(this.local_date);
    }

    setDateTime(date) {
        this.local_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.local_date);
        const recordInstance = this.data.dt.get();
        recordInstance.set(convertToReturnFormat(this.local_date, true));
        if (this._onChangeCallback) this._onChangeCallback(formattedDate);
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: formattedDate, rawDate: this.local_date },
                bubbles: true,
            })
        );
    }

    updateInputs() {
        const timeInput = this.shadowRoot.querySelector(".time-input");
        if (timeInput) timeInput.value = this.getTimeString();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    border-radius: 8px;
                    background-color: #f5f5f5;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                input {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 16px;
                }
                label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }
                .input-group {
                    margin-bottom: 8px;
                }
            </style>
            <div class="container">
                <div class="input-group">
                    <label>Time</label>
                    <input type="time" class="time-input" value="${this.getTimeString()}">
                </div>
            </div>
        `;
    }

    get value() {
        return formatDateToString(this.local_date);
    }

    set value(newValue) {
        this.local_date = new Date(newValue);
        this.updateInputs();
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

class CalenderRange extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.start_date = null;
        this.end_date = null;
        this._onChangeCallback = null;
    }

    connectedCallback() {
        const data = window.ftd.component_data(this);
        const startDate = Number(data.start_dt.get().toObject().dt);
        const endDate = Number(data.end_dt.get().toObject().dt);
        const startMilliseconds = Math.floor(startDate / 1000000);
        const endMilliseconds = Math.floor(endDate / 1000000);

        this.data = data;
        this.start_date = new Date(
            startMilliseconds - new Date().getTimezoneOffset() * 60000
        );
        this.end_date = new Date(
            endMilliseconds - new Date().getTimezoneOffset() * 60000
        );
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot
            .querySelector(".start-date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    const newDate = parseDateInput(
                        selectedDate,
                        this.start_date
                    );
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setStartDateTime(newDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs();
                }
            });

        this.shadowRoot
            .querySelector(".end-date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    const newDate = parseDateInput(selectedDate, this.end_date);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setEndDateTime(newDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs();
                }
            });

        this.shadowRoot
            .querySelector(".start-time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const newDate = parseTimeInput(timeValue, this.start_date);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid time input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setStartDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs();
                }
            });

        this.shadowRoot
            .querySelector(".end-time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const newDate = parseTimeInput(timeValue, this.end_date);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid time input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setEndDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs();
                }
            });
    }

    getDateString(date) {
        return formatDateForInput(date);
    }

    getTimeString(date) {
        return formatTimeForInput(date);
    }

    setStartDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid start date detected, keeping previous value");
            return;
        }

        this.start_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.start_date);
        const recordInstance = this.data.start_dt.get();
        recordInstance.set(convertToReturnFormat(this.start_date, true));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formattedDate,
                end: formatDateToString(this.end_date),
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: { value: formattedDate, rawDate: this.start_date },
                    end: {
                        value: formatDateToString(this.end_date),
                        rawDate: this.end_date,
                    },
                },
                bubbles: true,
            })
        );
    }

    setEndDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid end date detected, keeping previous value");
            return;
        }

        this.end_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.end_date);
        const recordInstance = this.data.end_dt.get();
        recordInstance.set(convertToReturnFormat(this.end_date, true));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formatDateToString(this.start_date),
                end: formattedDate,
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: {
                        value: formatDateToString(this.start_date),
                        rawDate: this.start_date,
                    },
                    end: { value: formattedDate, rawDate: this.end_date },
                },
                bubbles: true,
            })
        );
    }

    updateInputs() {
        const startDateInput =
            this.shadowRoot.querySelector(".start-date-input");
        const endDateInput = this.shadowRoot.querySelector(".end-date-input");
        const startTimeInput =
            this.shadowRoot.querySelector(".start-time-input");
        const endTimeInput = this.shadowRoot.querySelector(".end-time-input");

        if (startDateInput)
            startDateInput.value = this.getDateString(this.start_date);
        if (endDateInput)
            endDateInput.value = this.getDateString(this.end_date);
        if (startTimeInput)
            startTimeInput.value = this.getTimeString(this.start_date);
        if (endTimeInput)
            endTimeInput.value = this.getTimeString(this.end_date);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    border-radius: 8px;
                    background-color: #f5f5f5;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .range-group {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 10px;
                }
                .date-time-group {
                    flex: 1;
                }
                input {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 16px;
                }
                label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }
                .input-group {
                    margin-bottom: 8px;
                }
            </style>
            <div class="container">
                <div class="range-group">
                    <div class="date-time-group">
                        <label>Start Date</label>
                        <input type="date" class="start-date-input" value="${this.getDateString(
                            this.start_date
                        )}">
                        <label>Start Time</label>
                        <input type="time" class="start-time-input" value="${this.getTimeString(
                            this.start_date
                        )}">
                    </div>
                    <div class="date-time-group">
                        <label>End Date</label>
                        <input type="date" class="end-date-input" value="${this.getDateString(
                            this.end_date
                        )}">
                        <label>End Time</label>
                        <input type="time" class="end-time-input" value="${this.getTimeString(
                            this.end_date
                        )}">
                    </div>
                </div>
            </div>
        `;
    }

    get value() {
        return {
            start: formatDateToString(this.start_date),
            end: formatDateToString(this.end_date),
        };
    }

    set value(newValue) {
        this.start_date = new Date(newValue.start);
        this.end_date = new Date(newValue.end);
        this.updateInputs();
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

class DateRange extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.start_date = null;
        this.end_date = null;
        this._onChangeCallback = null;
    }

    connectedCallback() {
        const data = window.ftd.component_data(this);
        const startDate = Number(data.start_dt.get().toObject().dt);
        const endDate = Number(data.end_dt.get().toObject().dt);
        const startMilliseconds = Math.floor(startDate / 1000000);
        const endMilliseconds = Math.floor(endDate / 1000000);

        this.data = data;
        this.start_date = new Date(
            startMilliseconds - new Date().getTimezoneOffset() * 60000
        );
        this.end_date = new Date(
            endMilliseconds - new Date().getTimezoneOffset() * 60000
        );
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot
            .querySelector(".start-date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    const newDate = parseDateInput(selectedDate);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setStartDateTime(newDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs();
                }
            });

        this.shadowRoot
            .querySelector(".end-date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    const newDate = parseDateInput(selectedDate);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setEndDateTime(newDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs();
                }
            });
    }

    getDateString(date) {
        return formatDateForInput(date);
    }

    setStartDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid start date detected, keeping previous value");
            return;
        }

        this.start_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.start_date);
        const recordInstance = this.data.start_dt.get();
        recordInstance.set(convertToReturnFormat(this.start_date, false));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formattedDate,
                end: formatDateToString(this.end_date),
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: { value: formattedDate, rawDate: this.start_date },
                    end: {
                        value: formatDateToString(this.end_date),
                        rawDate: this.end_date,
                    },
                },
                bubbles: true,
            })
        );
    }

    setEndDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid end date detected, keeping previous value");
            return;
        }

        this.end_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.end_date);
        const recordInstance = this.data.end_dt.get();
        recordInstance.set(convertToReturnFormat(this.end_date, false));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formatDateToString(this.start_date),
                end: formattedDate,
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: {
                        value: formatDateToString(this.start_date),
                        rawDate: this.start_date,
                    },
                    end: { value: formattedDate, rawDate: this.end_date },
                },
                bubbles: true,
            })
        );
    }

    updateInputs() {
        const startDateInput =
            this.shadowRoot.querySelector(".start-date-input");
        const endDateInput = this.shadowRoot.querySelector(".end-date-input");

        if (startDateInput)
            startDateInput.value = this.getDateString(this.start_date);
        if (endDateInput)
            endDateInput.value = this.getDateString(this.end_date);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    border-radius: 8px;
                    background-color: #f5f5f5;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .range-group {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 10px;
                }
                .date-group {
                    flex: 1;
                }
                input {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 16px;
                }
                label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }
                .input-group {
                    margin-bottom: 8px;
                }
            </style>
            <div class="container">
                <div class="range-group">
                    <div class="date-group">
                        <label>Start Date</label>
                        <input type="date" class="start-date-input" value="${this.getDateString(
                            this.start_date
                        )}">
                    </div>
                    <div class="date-group">
                        <label>End Date</label>
                        <input type="date" class="end-date-input" value="${this.getDateString(
                            this.end_date
                        )}">
                    </div>
                </div>
            </div>
        `;
    }

    get value() {
        return {
            start: formatDateToString(this.start_date),
            end: formatDateToString(this.end_date),
        };
    }

    set value(newValue) {
        this.start_date = new Date(newValue.start);
        this.end_date = new Date(newValue.end);
        this.updateInputs();
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

class TimeRange extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.start_date = null;
        this.end_date = null;
        this._onChangeCallback = null;
    }

    connectedCallback() {
        const data = window.ftd.component_data(this);
        const startDate = Number(data.start_dt.get().toObject().dt);
        const endDate = Number(data.end_dt.get().toObject().dt);
        const startMilliseconds = Math.floor(startDate / 1000000);
        const endMilliseconds = Math.floor(endDate / 1000000);

        this.data = data;
        this.start_date = new Date(
            startMilliseconds - new Date().getTimezoneOffset() * 60000
        );
        this.end_date = new Date(
            endMilliseconds - new Date().getTimezoneOffset() * 60000
        );
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot
            .querySelector(".start-time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const newDate = parseTimeInput(timeValue, this.start_date);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid time input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setStartDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs();
                }
            });

        this.shadowRoot
            .querySelector(".end-time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const newDate = parseTimeInput(timeValue, this.end_date);
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid time input detected");
                        this.updateInputs();
                        return;
                    }
                    this.setEndDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs();
                }
            });
    }

    getTimeString(date) {
        return formatTimeForInput(date);
    }

    setStartDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid start date detected, keeping previous value");
            return;
        }

        this.start_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.start_date);
        const recordInstance = this.data.start_dt.get();
        recordInstance.set(convertToReturnFormat(this.start_date, true));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formattedDate,
                end: formatDateToString(this.end_date),
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: { value: formattedDate, rawDate: this.start_date },
                    end: {
                        value: formatDateToString(this.end_date),
                        rawDate: this.end_date,
                    },
                },
                bubbles: true,
            })
        );
    }

    setEndDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid end date detected, keeping previous value");
            return;
        }

        this.end_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.end_date);
        const recordInstance = this.data.end_dt.get();
        recordInstance.set(convertToReturnFormat(this.end_date, true));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formatDateToString(this.start_date),
                end: formattedDate,
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: {
                        value: formatDateToString(this.start_date),
                        rawDate: this.start_date,
                    },
                    end: { value: formattedDate, rawDate: this.end_date },
                },
                bubbles: true,
            })
        );
    }

    updateInputs() {
        const startTimeInput =
            this.shadowRoot.querySelector(".start-time-input");
        const endTimeInput = this.shadowRoot.querySelector(".end-time-input");

        if (startTimeInput)
            startTimeInput.value = this.getTimeString(this.start_date);
        if (endTimeInput)
            endTimeInput.value = this.getTimeString(this.end_date);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 10px;
                    border-radius: 8px;
                    background-color: #f5f5f5;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .range-group {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 10px;
                }
                .time-group {
                    flex: 1;
                }
                input {
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 16px;
                }
                label {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                }
                .input-group {
                    margin-bottom: 8px;
                }
            </style>
            <div class="container">
                <div class="range-group">
                    <div class="time-group">
                        <label>Start Time</label>
                        <input type="time" class="start-time-input" value="${this.getTimeString(
                            this.start_date
                        )}">
                    </div>
                    <div class="time-group">
                        <label>End Time</label>
                        <input type="time" class="end-time-input" value="${this.getTimeString(
                            this.end_date
                        )}">
                    </div>
                </div>
            </div>
        `;
    }

    get value() {
        return {
            start: formatDateToString(this.start_date),
            end: formatDateToString(this.end_date),
        };
    }

    set value(newValue) {
        this.start_date = new Date(newValue.start);
        this.end_date = new Date(newValue.end);
        this.updateInputs();
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

customElements.define("calender-widget", Calender);
customElements.define("date-widget", DateInput);
customElements.define("time-widget", TimeInput);
customElements.define("calender-range", CalenderRange);
customElements.define("date-range", DateRange);
customElements.define("time-range", TimeRange);
