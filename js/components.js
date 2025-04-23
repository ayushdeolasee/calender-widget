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

function convertToReturnFormat(dt, withTime = true) {
    let utcTime;
    if (withTime) {
        utcTime = new Date(
            Date.UTC(
                dt.getFullYear(),
                dt.getMonth(),
                dt.getDate(),
                dt.getHours(),
                dt.getMinutes(),
                dt.getSeconds(),
                dt.getMilliseconds()
            )
        );
    } else {
        utcTime = new Date(
            Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0)
        );
    }
    return new fastn.recordInstanceClass({
        dt: Number(BigInt(utcTime) * BigInt(1000000)),
    });
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

function toTimestampNanos(dateInt, timeInt) {
    // dateInt: YYYYMMDD, timeInt: HHMMSSmmmnnnnnnnnn
    const dateStr = dateInt.toString();
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const timeStr = timeInt.toString().padStart(17, "0");
    const hour = parseInt(timeStr.slice(0, 2));
    const minute = parseInt(timeStr.slice(2, 4));
    const second = parseInt(timeStr.slice(4, 6));
    const millisecond = parseInt(timeStr.slice(6, 9));
    const nanosecond = parseInt(timeStr.slice(9, 18));
    const dateObj = Date.UTC(
        year,
        month,
        day,
        hour,
        minute,
        second,
        millisecond
    );
    const epochNs = BigInt(dateObj) * 1000000n + BigInt(nanosecond);
    return epochNs;
}

function fromTimestampNanos(epochNs) {
    // Returns { date: YYYYMMDD, time: HHMMSSmmmnnnnnnnnn }
    const ms = Number(BigInt(epochNs) / 1000000n);
    const nanosecond = Number(BigInt(epochNs) % 1000000000n);
    const date = new Date(ms);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    const datePart = parseInt(`${year}${month}${day}`);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    const milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");
    const nanoStr = nanosecond.toString().padStart(9, "0");
    const timePart = parseInt(
        `${hours}${minutes}${seconds}${milliseconds}${nanoStr}`
    );
    return { date: datePart, time: timePart };
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
        console.log("Calender web-componenet called");
        const data = window.ftd.component_data(this);
        const date = Number(data.date.get().toObject().date);
        const time = Number(data.time.get().toObject().time);
        const epochNs = toTimestampNanos(date, time);
        const ms = Number(BigInt(epochNs) / 1000000n);
        this.data = data;
        this.local_date = new Date(ms - new Date().getTimezoneOffset() * 60000);
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
        // Convert to UTC and then to timestamp nanos
        const utcDate = new Date(
            Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                date.getHours(),
                date.getMinutes(),
                date.getSeconds(),
                date.getMilliseconds()
            )
        );
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = utcDate.getUTCDate().toString().padStart(2, "0");
        const datePart = parseInt(`${year}${month}${day}`);
        const hours = utcDate.getUTCHours().toString().padStart(2, "0");
        const minutes = utcDate.getUTCMinutes().toString().padStart(2, "0");
        const seconds = utcDate.getUTCSeconds().toString().padStart(2, "0");
        const milliseconds = utcDate
            .getUTCMilliseconds()
            .toString()
            .padStart(3, "0");
        const nanoStr = "000000000"; // JS Date has no ns
        const timePart = parseInt(
            `${hours}${minutes}${seconds}${milliseconds}${nanoStr}`
        );
        // Set back as two variables
        this.data.date.get().set({ date: datePart });
        this.data.time.get().set({ time: timePart });
        if (this._onChangeCallback)
            this._onChangeCallback({ date: datePart, time: timePart });
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    value: { date: datePart, time: timePart },
                    rawDate: this.local_date,
                },
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
        // Return {date, time} split from local_date
        const utcDate = new Date(
            Date.UTC(
                this.local_date.getFullYear(),
                this.local_date.getMonth(),
                this.local_date.getDate(),
                this.local_date.getHours(),
                this.local_date.getMinutes(),
                this.local_date.getSeconds(),
                this.local_date.getMilliseconds()
            )
        );
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = utcDate.getUTCDate().toString().padStart(2, "0");
        const datePart = parseInt(`${year}${month}${day}`);
        const hours = utcDate.getUTCHours().toString().padStart(2, "0");
        const minutes = utcDate.getUTCMinutes().toString().padStart(2, "0");
        const seconds = utcDate.getUTCSeconds().toString().padStart(2, "0");
        const milliseconds = utcDate
            .getUTCMilliseconds()
            .toString()
            .padStart(3, "0");
        const nanoStr = "000000000";
        const timePart = parseInt(
            `${hours}${minutes}${seconds}${milliseconds}${nanoStr}`
        );
        return { date: datePart, time: timePart };
    }

    set value(newValue) {
        // newValue: {date, time}
        const epochNs = toTimestampNanos(newValue.date, newValue.time);
        const ms = Number(BigInt(epochNs) / 1000000n);
        this.local_date = new Date(ms - new Date().getTimezoneOffset() * 60000);
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
        const date = Number(data.date.get().toObject().date);
        const time = 0; // Default time for DateInput
        const epochNs = toTimestampNanos(date, time);
        const ms = Number(BigInt(epochNs) / 1000000n);
        this.data = data;
        this.local_date = new Date(ms - new Date().getTimezoneOffset() * 60000);
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
        const utcDate = new Date(
            Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                0,
                0,
                0,
                0
            )
        );
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = utcDate.getUTCDate().toString().padStart(2, "0");
        const datePart = parseInt(`${year}${month}${day}`);
        this.data.date.get().set({ date: datePart });
        if (this._onChangeCallback) this._onChangeCallback({ date: datePart });
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: { date: datePart }, rawDate: this.local_date },
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
        const utcDate = new Date(
            Date.UTC(
                this.local_date.getFullYear(),
                this.local_date.getMonth(),
                this.local_date.getDate(),
                0,
                0,
                0,
                0
            )
        );
        const year = utcDate.getUTCFullYear();
        const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, "0");
        const day = utcDate.getUTCDate().toString().padStart(2, "0");
        const datePart = parseInt(`${year}${month}${day}`);
        return { date: datePart };
    }

    set value(newValue) {
        const epochNs = toTimestampNanos(newValue.date, 0);
        const ms = Number(BigInt(epochNs) / 1000000n);
        this.local_date = new Date(ms - new Date().getTimezoneOffset() * 60000);
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
        const date = 19700101; // Default date for TimeInput
        const time = Number(data.time.get().toObject().time);
        const epochNs = toTimestampNanos(date, time);
        const ms = Number(BigInt(epochNs) / 1000000n);
        this.data = data;
        this.local_date = new Date(ms - new Date().getTimezoneOffset() * 60000);
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
        const utcDate = new Date(
            Date.UTC(
                1970,
                0,
                1,
                date.getHours(),
                date.getMinutes(),
                date.getSeconds(),
                date.getMilliseconds()
            )
        );
        const hours = utcDate.getUTCHours().toString().padStart(2, "0");
        const minutes = utcDate.getUTCMinutes().toString().padStart(2, "0");
        const seconds = utcDate.getUTCSeconds().toString().padStart(2, "0");
        const milliseconds = utcDate
            .getUTCMilliseconds()
            .toString()
            .padStart(3, "0");
        const nanoStr = "000000000"; // JS Date has no ns
        const timePart = parseInt(
            `${hours}${minutes}${seconds}${milliseconds}${nanoStr}`
        );
        this.data.time.get().set({ time: timePart });
        if (this._onChangeCallback) this._onChangeCallback({ time: timePart });
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: { time: timePart }, rawDate: this.local_date },
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
        const utcDate = new Date(
            Date.UTC(
                1970,
                0,
                1,
                this.local_date.getHours(),
                this.local_date.getMinutes(),
                this.local_date.getSeconds(),
                this.local_date.getMilliseconds()
            )
        );
        const hours = utcDate.getUTCHours().toString().padStart(2, "0");
        const minutes = utcDate.getUTCMinutes().toString().padStart(2, "0");
        const seconds = utcDate.getUTCSeconds().toString().padStart(2, "0");
        const milliseconds = utcDate
            .getUTCMilliseconds()
            .toString()
            .padStart(3, "0");
        const nanoStr = "000000000";
        const timePart = parseInt(
            `${hours}${minutes}${seconds}${milliseconds}${nanoStr}`
        );
        return { time: timePart };
    }

    set value(newValue) {
        const epochNs = toTimestampNanos(19700101, newValue.time);
        const ms = Number(BigInt(epochNs) / 1000000n);
        this.local_date = new Date(ms - new Date().getTimezoneOffset() * 60000);
        this.updateInputs();
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

customElements.define("calender-widget", Calender);
customElements.define("date-widget", DateInput);
customElements.define("time-widget", TimeInput);
