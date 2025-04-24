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
        date: date,
        time: time,
    });
    // return new fastn.recordInstanceClass({
    //     dt: Number(BigInt(utcTime) * BigInt(1000000)),
    // });
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
        console.log("Calender web-componenet called");
        const data = window.ftd.component_data(this);
        const dt = to_timestamp_millis(data.dt);
        console.log(dt);
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
        console.log("setDateTime called");
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, keeping previous value");
            return;
        }
        this.local_date = date;
        this.updateInputs();
        const formattedDate = formatDateToString(this.local_date);
        console.log("formatted date:", formattedDate);
        
        const recordInstance = this.data.dt.get();

        console.log("record instance:", recordInstance);
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
