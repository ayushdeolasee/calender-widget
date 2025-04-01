function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

class Calender extends HTMLElement {
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
            .querySelector(".date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    // Get current hours and minutes to preserve
                    const hours = this.local_date.getHours();
                    const minutes = this.local_date.getMinutes();

                    // Parse the date directly from the input
                    const [year, month, day] = selectedDate
                        .split("-")
                        .map(Number);

                    // Create a date using the day directly without timezone adjustments
                    // This ensures we use exactly what the user entered
                    const newDate = new Date(this.local_date);
                    newDate.setFullYear(year);
                    newDate.setMonth(month - 1); // Month is 0-indexed
                    newDate.setDate(day);

                    // Verify it's a valid date
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    this.setDateTime(newDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });

        this.shadowRoot
            .querySelector(".time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const [hours, minutes] = timeValue.split(":").map(Number);

                    // Validate time values
                    if (
                        isNaN(hours) ||
                        isNaN(minutes) ||
                        hours < 0 ||
                        hours > 23 ||
                        minutes < 0 ||
                        minutes > 59
                    ) {
                        console.warn("Invalid time input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Create a new date object with the current date but updated time
                    const newDate = new Date(this.local_date);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);

                    // Final validation check
                    if (!isValidDate(newDate)) {
                        console.warn("Created invalid date from time input");
                        this.updateInputs();
                        return;
                    }

                    this.setDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });
    }

    getDateString() {
        // Format date as YYYY-MM-DD for input value
        const year = this.local_date.getFullYear();
        const month = String(this.local_date.getMonth() + 1).padStart(2, "0");
        const day = String(this.local_date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    getTimeString() {
        // Format time as HH:MM for input value
        const hours = String(this.local_date.getHours()).padStart(2, "0");
        const minutes = String(this.local_date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    setDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, keeping previous value");
            return;
        }

        this.local_date = date;
        this.updateInputs();
        const formattedDate = this.formatDateToString(this.local_date);
        const recordInstance = this.data.dt.get();
        recordInstance.set(this.convert_to_return_format(this.local_date));

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

    convert_to_return_format(dt) {
        const utcTime = new Date(
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
        return new fastn.recordInstanceClass({
            dt: Number(BigInt(utcTime) * BigInt(1000000)),
        });
    }

    formatDateToString(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, using current date instead");
            return new Date().toISOString().replace(/[-:.]/g, "");
        }
        return date.toISOString().replace(/[-:.]/g, "");
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
        return this.formatDateToString(this.local_date);
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
            .querySelector(".date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    // Create a date directly from the ISO string with validation
                    const newDate = new Date(selectedDate + "T00:00:00.000Z");

                    // Verify it's a valid date before continuing
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Adjust for local timezone
                    const timezoneOffset =
                        new Date().getTimezoneOffset() * 60000;
                    const adjustedDate = new Date(
                        newDate.getTime() + timezoneOffset
                    );

                    this.setDateTime(adjustedDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });
    }

    getDateString() {
        // Format date as YYYY-MM-DD for input value
        const year = this.local_date.getFullYear();
        const month = String(this.local_date.getMonth() + 1).padStart(2, "0");
        const day = String(this.local_date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    setDateTime(date) {
        this.local_date = date;
        this.updateInputs();
        const formattedDate = this.formatDateToString(this.local_date);
        const recordInstance = this.data.dt.get();
        recordInstance.set(this.convert_to_return_format(this.local_date));

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

    convert_to_return_format(dt) {
        const utcTime = new Date(
            Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0)
        );
        return new fastn.recordInstanceClass({
            dt: Number(BigInt(utcTime) * BigInt(1000000)),
        });
    }

    formatDateToString(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, using current date instead");
            return new Date().toISOString().replace(/[-:.]/g, "");
        }
        return date.toISOString().replace(/[-:.]/g, "");
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
        return this.formatDateToString(this.local_date);
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
                    const [hours, minutes] = timeValue.split(":").map(Number);

                    // Validate time values
                    if (
                        isNaN(hours) ||
                        isNaN(minutes) ||
                        hours < 0 ||
                        hours > 23 ||
                        minutes < 0 ||
                        minutes > 59
                    ) {
                        console.warn("Invalid time input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Create a new date object with the current date but updated time
                    const newDate = new Date(this.local_date);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);

                    // Final validation check
                    if (!isValidDate(newDate)) {
                        console.warn("Created invalid date from time input");
                        this.updateInputs();
                        return;
                    }

                    this.setDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });
    }

    getTimeString() {
        // Format time as HH:MM for input value
        const hours = String(this.local_date.getHours()).padStart(2, "0");
        const minutes = String(this.local_date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    setDateTime(date) {
        this.local_date = date;
        this.updateInputs();
        const formattedDate = this.formatDateToString(this.local_date);
        const recordInstance = this.data.dt.get();
        recordInstance.set(this.convert_to_return_format(this.local_date));

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

    convert_to_return_format(dt) {
        const utcTime = new Date(
            Date.UTC(
                dt.getFullYear(),
                dt.getMonth(),
                dt.getDate(),
                dt.getHours(),
                dt.getMinutes(),
                0,
                0
            )
        );
        return new fastn.recordInstanceClass({
            dt: Number(BigInt(utcTime) * BigInt(1000000)),
        });
    }

    formatDateToString(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, using current date instead");
            return new Date().toISOString().replace(/[-:.]/g, "");
        }
        return date.toISOString().replace(/[-:.]/g, "");
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
        return this.formatDateToString(this.local_date);
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
                    // Use the current start date's time with the new date
                    const hours = this.start_date.getHours();
                    const minutes = this.start_date.getMinutes();

                    // Create a date from the ISO string with validation
                    const newDate = new Date(selectedDate + "T00:00:00.000Z");

                    // Verify it's a valid date before continuing
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Adjust for local timezone
                    const timezoneOffset =
                        new Date().getTimezoneOffset() * 60000;
                    const adjustedDate = new Date(
                        newDate.getTime() + timezoneOffset
                    );

                    // Apply the original time
                    adjustedDate.setHours(hours);
                    adjustedDate.setMinutes(minutes);

                    this.setStartDateTime(adjustedDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });

        this.shadowRoot
            .querySelector(".end-date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    // Use the current end date's time with the new date
                    const hours = this.end_date.getHours();
                    const minutes = this.end_date.getMinutes();

                    // Create a date from the ISO string with validation
                    const newDate = new Date(selectedDate + "T00:00:00.000Z");

                    // Verify it's a valid date before continuing
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Adjust for local timezone
                    const timezoneOffset =
                        new Date().getTimezoneOffset() * 60000;
                    const adjustedDate = new Date(
                        newDate.getTime() + timezoneOffset
                    );

                    // Apply the original time
                    adjustedDate.setHours(hours);
                    adjustedDate.setMinutes(minutes);

                    this.setEndDateTime(adjustedDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });

        this.shadowRoot
            .querySelector(".start-time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const [hours, minutes] = timeValue.split(":").map(Number);

                    // Validate time values
                    if (
                        isNaN(hours) ||
                        isNaN(minutes) ||
                        hours < 0 ||
                        hours > 23 ||
                        minutes < 0 ||
                        minutes > 59
                    ) {
                        console.warn("Invalid time input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Create a new date object with the current date but updated time
                    const newDate = new Date(this.start_date);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);

                    // Final validation check
                    if (!isValidDate(newDate)) {
                        console.warn("Created invalid date from time input");
                        this.updateInputs();
                        return;
                    }

                    this.setStartDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });

        this.shadowRoot
            .querySelector(".end-time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const [hours, minutes] = timeValue.split(":").map(Number);

                    // Validate time values
                    if (
                        isNaN(hours) ||
                        isNaN(minutes) ||
                        hours < 0 ||
                        hours > 23 ||
                        minutes < 0 ||
                        minutes > 59
                    ) {
                        console.warn("Invalid time input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Create a new date object with the current date but updated time
                    const newDate = new Date(this.end_date);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);

                    // Final validation check
                    if (!isValidDate(newDate)) {
                        console.warn("Created invalid date from time input");
                        this.updateInputs();
                        return;
                    }

                    this.setEndDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });
    }

    getDateString(date) {
        // Format date as YYYY-MM-DD for input value
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    getTimeString(date) {
        // Format time as HH:MM for input value
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    setStartDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid start date detected, keeping previous value");
            return;
        }

        this.start_date = date;
        this.updateInputs();
        const formattedDate = this.formatDateToString(this.start_date);
        const recordInstance = this.data.start_dt.get();
        recordInstance.set(this.convert_to_return_format(this.start_date));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formattedDate,
                end: this.formatDateToString(this.end_date),
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: { value: formattedDate, rawDate: this.start_date },
                    end: {
                        value: this.formatDateToString(this.end_date),
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
        const formattedDate = this.formatDateToString(this.end_date);
        const recordInstance = this.data.end_dt.get();
        recordInstance.set(this.convert_to_return_format(this.end_date));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: this.formatDateToString(this.start_date),
                end: formattedDate,
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: {
                        value: this.formatDateToString(this.start_date),
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

    convert_to_return_format(dt) {
        const utcTime = new Date(
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
        return new fastn.recordInstanceClass({
            dt: Number(BigInt(utcTime) * BigInt(1000000)),
        });
    }

    formatDateToString(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, using current date instead");
            return new Date().toISOString().replace(/[-:.]/g, "");
        }
        return date.toISOString().replace(/[-:.]/g, "");
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
            start: this.formatDateToString(this.start_date),
            end: this.formatDateToString(this.end_date),
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
                    // Create a date from the ISO string with validation
                    const newDate = new Date(selectedDate + "T00:00:00.000Z");

                    // Verify it's a valid date before continuing
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Adjust for local timezone
                    const timezoneOffset =
                        new Date().getTimezoneOffset() * 60000;
                    const adjustedDate = new Date(
                        newDate.getTime() + timezoneOffset
                    );

                    this.setStartDateTime(adjustedDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });

        this.shadowRoot
            .querySelector(".end-date-input")
            .addEventListener("change", (e) => {
                try {
                    const selectedDate = e.target.value;
                    // Create a date from the ISO string with validation
                    const newDate = new Date(selectedDate + "T00:00:00.000Z");

                    // Verify it's a valid date before continuing
                    if (!isValidDate(newDate)) {
                        console.warn("Invalid date input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Adjust for local timezone
                    const timezoneOffset =
                        new Date().getTimezoneOffset() * 60000;
                    const adjustedDate = new Date(
                        newDate.getTime() + timezoneOffset
                    );

                    this.setEndDateTime(adjustedDate);
                } catch (error) {
                    console.error("Error handling date input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });
    }

    getDateString(date) {
        // Format date as YYYY-MM-DD for input value
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    setStartDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid start date detected, keeping previous value");
            return;
        }

        this.start_date = date;
        this.updateInputs();
        const formattedDate = this.formatDateToString(this.start_date);
        this.data.start_dt.set(this.convert_to_return_format(this.start_date));
        const recordInstance = this.data.start_dt.get();
        recordInstance.set(this.convert_to_return_format(this.start_date));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formattedDate,
                end: this.formatDateToString(this.end_date),
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: { value: formattedDate, rawDate: this.start_date },
                    end: {
                        value: this.formatDateToString(this.end_date),
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
        const formattedDate = this.formatDateToString(this.end_date);
        const recordInstance = this.data.end_dt.get();
        recordInstance.set(this.convert_to_return_format(this.end_date));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: this.formatDateToString(this.start_date),
                end: formattedDate,
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: {
                        value: this.formatDateToString(this.start_date),
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

    convert_to_return_format(dt) {
        const utcTime = new Date(
            Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0)
        );
        return new fastn.recordInstanceClass({
            dt: Number(BigInt(utcTime) * BigInt(1000000)),
        });
    }

    formatDateToString(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, using current date instead");
            return new Date().toISOString().replace(/[-:.]/g, "");
        }
        return date.toISOString().replace(/[-:.]/g, "");
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
            start: this.formatDateToString(this.start_date),
            end: this.formatDateToString(this.end_date),
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
                    const [hours, minutes] = timeValue.split(":").map(Number);

                    // Validate time values
                    if (
                        isNaN(hours) ||
                        isNaN(minutes) ||
                        hours < 0 ||
                        hours > 23 ||
                        minutes < 0 ||
                        minutes > 59
                    ) {
                        console.warn("Invalid time input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Create a new date object with the current date but updated time
                    const newDate = new Date(this.start_date);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);

                    // Final validation check
                    if (!isValidDate(newDate)) {
                        console.warn("Created invalid date from time input");
                        this.updateInputs();
                        return;
                    }

                    this.setStartDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });

        this.shadowRoot
            .querySelector(".end-time-input")
            .addEventListener("change", (e) => {
                try {
                    const timeValue = e.target.value;
                    const [hours, minutes] = timeValue.split(":").map(Number);

                    // Validate time values
                    if (
                        isNaN(hours) ||
                        isNaN(minutes) ||
                        hours < 0 ||
                        hours > 23 ||
                        minutes < 0 ||
                        minutes > 59
                    ) {
                        console.warn("Invalid time input detected");
                        this.updateInputs(); // Reset to previous valid value
                        return;
                    }

                    // Create a new date object with the current date but updated time
                    const newDate = new Date(this.end_date);
                    newDate.setHours(hours);
                    newDate.setMinutes(minutes);
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);

                    // Final validation check
                    if (!isValidDate(newDate)) {
                        console.warn("Created invalid date from time input");
                        this.updateInputs();
                        return;
                    }

                    this.setEndDateTime(newDate);
                } catch (error) {
                    console.error("Error handling time input:", error);
                    this.updateInputs(); // Reset to previous valid value
                }
            });
    }

    getTimeString(date) {
        // Format time as HH:MM for input value
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    setStartDateTime(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid start date detected, keeping previous value");
            return;
        }

        this.start_date = date;
        this.updateInputs();
        const formattedDate = this.formatDateToString(this.start_date);
        const recordInstance = this.data.start_dt.get();
        recordInstance.set(this.convert_to_return_format(this.start_date));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: formattedDate,
                end: this.formatDateToString(this.end_date),
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: { value: formattedDate, rawDate: this.start_date },
                    end: {
                        value: this.formatDateToString(this.end_date),
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
        const formattedDate = this.formatDateToString(this.end_date);
        const recordInstance = this.data.end_dt.get();
        recordInstance.set(this.convert_to_return_format(this.end_date));

        if (this._onChangeCallback)
            this._onChangeCallback({
                start: this.formatDateToString(this.start_date),
                end: formattedDate,
            });

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    start: {
                        value: this.formatDateToString(this.start_date),
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

    convert_to_return_format(dt) {
        const utcTime = new Date(
            Date.UTC(
                dt.getFullYear(),
                dt.getMonth(),
                dt.getDate(),
                dt.getHours(),
                dt.getMinutes(),
                0,
                0
            )
        );
        return new fastn.recordInstanceClass({
            dt: Number(BigInt(utcTime) * BigInt(1000000)),
        });
    }

    formatDateToString(date) {
        if (!isValidDate(date)) {
            console.warn("Invalid date detected, using current date instead");
            return new Date().toISOString().replace(/[-:.]/g, "");
        }
        return date.toISOString().replace(/[-:.]/g, "");
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
            start: this.formatDateToString(this.start_date),
            end: this.formatDateToString(this.end_date),
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
customElements.define("date-input", DateInput);
customElements.define("time-input", TimeInput);
customElements.define("calender-range", CalenderRange);
customElements.define("date-range", DateRange);
customElements.define("time-range", TimeRange);
