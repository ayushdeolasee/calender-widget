// --- Utility Functions ---
function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

// Unified DateTimeModel for handling date/time conversions
class DateTimeModel {
    constructor(fastnRecord = null) {
        this._date = new Date();
        if (fastnRecord) {
            this.importFromFastn(fastnRecord);
        }
    }

    importFromFastn(record) {
        const obj =
            record instanceof fastn.recordInstanceClass
                ? record.toObject()
                : record.get().toObject();
        const dateStr = obj.date.toString();
        const year = parseInt(dateStr.slice(0, 4));
        const month = parseInt(dateStr.slice(4, 6)) - 1;
        const day = parseInt(dateStr.slice(6, 8));
        const nanos = BigInt(obj.time);
        const secs = Number(nanos / 1000000000n);
        const hours = Math.floor(secs / 3600);
        let minutes = Math.floor((secs % 3600) / 60);
        const seconds = secs % 60;
        const millis = Math.floor(Number(nanos % 1000000000n) / 1000000);
        this._date = new Date(
            Date.UTC(year, month, day, hours, minutes, seconds, millis)
        );

        return this;
    }

    exportToFastn(withTime = true) {
        const date = this._date; // Represents a UTC moment
        const yearUTC = date.getUTCFullYear();
        const monthUTC = date.getUTCMonth(); // 0-based
        const dayUTC = date.getUTCDate();

        const datePart = parseInt(
            `${yearUTC}${(monthUTC + 1).toString().padStart(2, "0")}${dayUTC
                .toString()
                .padStart(2, "0")}`
        );

        let timePart = 0n;
        if (withTime) {
            const hours = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            const seconds = date.getUTCSeconds();
            const millis = date.getUTCMilliseconds();
            timePart =
                BigInt(hours) * 3600n * 1000000000n +
                BigInt(minutes) * 60n * 1000000000n +
                BigInt(seconds) * 1000000000n +
                BigInt(millis) * 1000000n;
        } else {
            const localMidnight = new Date(
                yearUTC,
                monthUTC,
                dayUTC,
                0,
                0,
                0,
                0
            );

            const hoursUTC_forLocalMidnight = localMidnight.getUTCHours();
            const minutesUTC_forLocalMidnight = localMidnight.getUTCMinutes();
            const secondsUTC_forLocalMidnight = localMidnight.getUTCSeconds();
            const millisUTC_forLocalMidnight =
                localMidnight.getUTCMilliseconds();

            timePart =
                BigInt(hoursUTC_forLocalMidnight) * 3600n * 1000000000n +
                BigInt(minutesUTC_forLocalMidnight) * 60n * 1000000000n +
                BigInt(secondsUTC_forLocalMidnight) * 1000000000n +
                BigInt(millisUTC_forLocalMidnight) * 1000000n;
        }
        return new fastn.recordInstanceClass({
            date: datePart,
            time: timePart,
        });
    }

    formatForDateInput() {
        const date = this._date;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    formatForTimeInput() {
        const date = this._date;
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    formatToString() {
        if (!isValidDate(this._date)) {
            console.warn("Invalid date detected, using current date instead");
            return new Date().toISOString().replace(/[-:.]/g, "");
        }
        return this._date.toISOString().replace(/[-:.]/g, "");
    }

    setFromDateInput(dateString) {
        const [year, month, day] = dateString.split("-").map(Number);
        const d = new Date(this._date);
        d.setFullYear(year);
        d.setMonth(month - 1);
        d.setDate(day);
        this._date = d;
        return this;
    }

    setFromTimeInput(timeString) {
        const [hours, minutes] = timeString.split(":").map(Number);
        const d = new Date(this._date);
        d.setHours(hours);
        d.setMinutes(minutes);
        d.setSeconds(0);
        d.setMilliseconds(0);
        this._date = d;
        return this;
    }

    getDate() {
        return new Date(this._date);
    }

    setDate(date) {
        this._date = new Date(date);
        return this;
    }
}

class BaseTimeComponent extends HTMLElement {
    constructor(updateOnInit = false) {
        super();
        this.updateOnInit = updateOnInit;
        this.attachShadow({ mode: "open" });
        this.model = new DateTimeModel();
        this._onChangeCallback = null;
    }

    connectedCallback() {
        const data = window.ftd.component_data(this);
        this.data = data;
        if (data.dt) {
            this.model.importFromFastn(data.dt);
            if (this.updateOnInit) {
                this.updateFastnAndNotify(false);
            }
        }
        this.render();

        if (this.setupSpecificEventListeners) {
            this.setupSpecificEventListeners();
        }
    }

    render() {
        this.shadowRoot.innerHTML = this.renderTemplate();
    }

    updateFastnAndNotify(withTime = true) {
        if (this.data.dt) {
            const record = this.data.dt.get();
            record.set(this.model.exportToFastn(withTime));
            this.dispatchEvent(
                new CustomEvent("change", {
                    detail: {
                        value: this.model.formatForDateInput(),
                        rawDate: this.model.getDate(),
                    },
                    bubbles: true,
                })
            );
            if (this._onChangeCallback) {
                this._onChangeCallback(this.model.formatForDateInput());
            }
        }
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

class Calender extends BaseTimeComponent {
    renderTemplate() {
        return `
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
                    <input type="date" class="date-input" value="${this.model.formatForDateInput()}">
                </div>
                <div class="input-group">
                    <label>Time</label>
                    <input type="time" class="time-input" value="${this.model.formatForTimeInput()}">
                </div>
            </div>
        `;
    }

    setupSpecificEventListeners() {
        this.shadowRoot
            .querySelector(".date-input")
            .addEventListener("change", (e) => {
                try {
                    this.model.setFromDateInput(e.target.value);
                    this.updateFastnAndNotify(true); // true = include time
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.render(); // Reset to valid state
                }
            });

        this.shadowRoot
            .querySelector(".time-input")
            .addEventListener("change", (e) => {
                try {
                    this.model.setFromTimeInput(e.target.value);
                    this.updateFastnAndNotify(true); // true = include time
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.render(); // Reset to valid state
                }
            });
    }

    get value() {
        return this.model.formatToString();
    }

    set value(newValue) {
        this.model.setDate(new Date(newValue));
        this.render();
    }
}

class DateInput extends BaseTimeComponent {
    constructor() {
        super(true);
    }

    renderTemplate() {
        return `
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
                    <input type="date" class="date-input" value="${this.model.formatForDateInput()}">
                </div>
            </div>
        `;
    }

    setupSpecificEventListeners() {
        this.shadowRoot
            .querySelector(".date-input")
            .addEventListener("change", (e) => {
                try {
                    this.model.setFromDateInput(e.target.value);
                    this.updateFastnAndNotify(false); // false = date only (no time)
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.render(); // Reset to valid state
                }
            });
    }

    get value() {
        return this.model.formatToString();
    }

    set value(newValue) {
        this.model.setDate(new Date(newValue));
        this.render();
    }
}

class TimeInput extends BaseTimeComponent {
    renderTemplate() {
        return `
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
                    <input type="time" class="time-input" value="${this.model.formatForTimeInput()}">
                </div>
            </div>
        `;
    }

    setupSpecificEventListeners() {
        this.shadowRoot
            .querySelector(".time-input")
            .addEventListener("change", (e) => {
                try {
                    this.model.setFromTimeInput(e.target.value);
                    this.updateFastnAndNotify(true); // true = include time
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.render(); // Reset to valid state
                }
            });
    }

    get value() {
        return this.model.formatToString();
    }

    set value(newValue) {
        this.model.setDate(new Date(newValue));
        this.render();
    }
}

class RangeBaseComponent extends HTMLElement {
    constructor(updateOnInit = false) {
        super();
        this.updateOnInit = updateOnInit;
        this.attachShadow({ mode: "open" });
        this.startModel = new DateTimeModel();
        this.endModel = new DateTimeModel();
        this._onChangeCallback = null;
    }

    connectedCallback() {
        const data = window.ftd.component_data(this);
        this.data = data;

        if (data.start_dt && data.end_dt) {
            this.startModel.importFromFastn(data.start_dt);
            this.endModel.importFromFastn(data.end_dt);
            if (this.updateOnInit) {
                this.updateStartFastnAndNotify(false);
                this.updateEndFastnAndNotify(false);
            } 
        }

        this.render();
        if (this.setupSpecificEventListeners) {
            this.setupSpecificEventListeners();
        }
    }

    render() {
        this.shadowRoot.innerHTML = this.renderTemplate();
    }

    updateStartFastnAndNotify(withTime = true) {
        if (this.data.start_dt) {
            const record = this.data.start_dt.get();
            record.set(this.startModel.exportToFastn(withTime));
            this.dispatchRangeChangeEvent();
        }
    }

    updateEndFastnAndNotify(withTime = true) {
        if (this.data.end_dt) {
            const record = this.data.end_dt.get();
            record.set(this.endModel.exportToFastn(withTime));
            this.dispatchRangeChangeEvent();
        }
    }

    dispatchRangeChangeEvent() {
        const detail = {
            start: {
                value: this.startModel.formatToString(),
                rawDate: this.startModel.getDate(),
            },
            end: {
                value: this.endModel.formatToString(),
                rawDate: this.endModel.getDate(),
            },
        };

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: detail,
                bubbles: true,
            })
        );

        if (this._onChangeCallback) {
            this._onChangeCallback(detail);
        }
    }

    onChange(callback) {
        this._onChangeCallback = callback;
    }
}

class DateRange extends RangeBaseComponent {
    constructor() {
        super(true);
    }

    renderTemplate() {
        return `
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
                        <input type="date" class="start-date-input" value="${this.startModel.formatForDateInput()}">
                    </div>
                    <div class="date-group">
                        <label>End Date</label>
                        <input type="date" class="end-date-input" value="${this.endModel.formatForDateInput()}">
                    </div>
                </div>
            </div>
        `;
    }

    setupSpecificEventListeners() {
        this.shadowRoot
            .querySelector(".start-date-input")
            .addEventListener("change", (e) => {
                try {
                    this.startModel.setFromDateInput(e.target.value);
                    this.updateStartFastnAndNotify(false); // false = date only (no time)
                } catch (error) {
                    console.error("Error handling start date input:", error);
                    this.render(); // Reset to valid state
                }
            });

        this.shadowRoot
            .querySelector(".end-date-input")
            .addEventListener("change", (e) => {
                try {
                    this.endModel.setFromDateInput(e.target.value);
                    this.updateEndFastnAndNotify(false); // false = date only (no time)
                } catch (error) {
                    console.error("Error handling end date input:", error);
                    this.render(); // Reset to valid state
                }
            });
    }

    get value() {
        return {
            start: this.startModel.formatToString(),
            end: this.endModel.formatToString(),
        };
    }

    set value(newValue) {
        if (newValue.start) this.startModel.setDate(new Date(newValue.start));
        if (newValue.end) this.endModel.setDate(new Date(newValue.end));
        this.render();
    }
}

class TimeRange extends RangeBaseComponent {
    renderTemplate() {
        return `
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
                        <input type="time" class="start-time-input" value="${this.startModel.formatForTimeInput()}">
                    </div>
                    <div class="time-group">
                        <label>End Time</label>
                        <input type="time" class="end-time-input" value="${this.endModel.formatForTimeInput()}">
                    </div>
                </div>
            </div>
        `;
    }

    setupSpecificEventListeners() {
        this.shadowRoot
            .querySelector(".start-time-input")
            .addEventListener("change", (e) => {
                try {
                    this.startModel.setFromTimeInput(e.target.value);
                    this.updateStartFastnAndNotify(true); // true = include time
                } catch (error) {
                    console.error("Error handling start time input:", error);
                    this.render(); // Reset to valid state
                }
            });

        this.shadowRoot
            .querySelector(".end-time-input")
            .addEventListener("change", (e) => {
                try {
                    this.endModel.setFromTimeInput(e.target.value);
                    this.updateEndFastnAndNotify(true); // true = include time
                } catch (error) {
                    console.error("Error handling end time input:", error);
                    this.render(); // Reset to valid state
                }
            });
    }

    get value() {
        return {
            start: this.startModel.formatToString(),
            end: this.endModel.formatToString(),
        };
    }

    set value(newValue) {
        if (newValue.start) this.startModel.setDate(new Date(newValue.start));
        if (newValue.end) this.endModel.setDate(new Date(newValue.end));
        this.render();
    }
}

class CalenderRange extends RangeBaseComponent {
    renderTemplate() {
        return `
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
                .datetime-group {
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
                    <div class="datetime-group">
                        <div class="input-group">
                            <label>Start Date</label>
                            <input type="date" class="start-date-input" value="${this.startModel.formatForDateInput()}">
                        </div>
                        <div class="input-group">
                            <label>Start Time</label>
                            <input type="time" class="start-time-input" value="${this.startModel.formatForTimeInput()}">
                        </div>
                    </div>
                    <div class="datetime-group">
                        <div class="input-group">
                            <label>End Date</label>
                            <input type="date" class="end-date-input" value="${this.endModel.formatForDateInput()}">
                        </div>
                        <div class="input-group">
                            <label>End Time</label>
                            <input type="time" class="end-time-input" value="${this.endModel.formatForTimeInput()}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupSpecificEventListeners() {
        this.shadowRoot
            .querySelector(".start-date-input")
            .addEventListener("change", (e) => {
                try {
                    this.startModel.setFromDateInput(e.target.value);
                    this.updateStartFastnAndNotify(true);
                } catch (error) {
                    console.error("Error handling start date input:", error);
                    this.render();
                }
            });

        this.shadowRoot
            .querySelector(".start-time-input")
            .addEventListener("change", (e) => {
                try {
                    this.startModel.setFromTimeInput(e.target.value);
                    this.updateStartFastnAndNotify(true);
                } catch (error) {
                    console.error("Error handling start time input:", error);
                    this.render();
                }
            });

        this.shadowRoot
            .querySelector(".end-date-input")
            .addEventListener("change", (e) => {
                try {
                    this.endModel.setFromDateInput(e.target.value);
                    this.updateEndFastnAndNotify(true);
                } catch (error) {
                    console.error("Error handling end date input:", error);
                    this.render();
                }
            });

        this.shadowRoot
            .querySelector(".end-time-input")
            .addEventListener("change", (e) => {
                try {
                    this.endModel.setFromTimeInput(e.target.value);
                    this.updateEndFastnAndNotify(true);
                } catch (error) {
                    console.error("Error handling end time input:", error);
                    this.render();
                }
            });
    }

    get value() {
        return {
            start: this.startModel.formatToString(),
            end: this.endModel.formatToString(),
        };
    }

    set value(newValue) {
        if (newValue.start) this.startModel.setDate(new Date(newValue.start));
        if (newValue.end) this.endModel.setDate(new Date(newValue.end));
        this.render();
    }
}

// Define custom elements
customElements.define("calender-widget", Calender);
customElements.define("date-widget", DateInput);
customElements.define("time-widget", TimeInput);
customElements.define("date-range", DateRange);
customElements.define("time-range", TimeRange);
customElements.define("calender-range", CalenderRange);
