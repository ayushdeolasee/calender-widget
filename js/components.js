class Calender extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.local_date = null;
        this._onChangeCallback = null;
    }

    connectedCallback() {
        let data = window.ftd.component_data(this);
        let date_recrod = data.dt.get();
        let date = Number(date_recrod.toObject().dt);
        let milliseconds = Math.floor(date / 1000000);
        const timezone_offset = new Date().getTimezoneOffset();
        const local_time = milliseconds - timezone_offset * 60000;

        this.data = data;
        this.local_date = new Date(local_time);

        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Date input
        this.shadowRoot
            .querySelector(".date-input")
            .addEventListener("change", (e) => {
                const dateParts = e.target.value.split("-");
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]) - 1;
                const day = parseInt(dateParts[2]);

                const timeParts = this.getTimeString().split(":");
                const hour = parseInt(timeParts[0]);
                const minute = parseInt(timeParts[1]);

                const newDate = new Date();
                newDate.setFullYear(year, month, day);
                newDate.setHours(hour, minute, 0, 0);
                const return_date = newDate;
                this.setDateTime(return_date);
            });

        // Time input
        this.shadowRoot
            .querySelector(".time-input")
            .addEventListener("change", (e) => {
                const current = this.local_date;
                const year = current.getFullYear();
                const month = current.getMonth();
                const day = current.getDate();

                const timeParts = e.target.value.split(":");
                const hour = parseInt(timeParts[0]);
                const minute = parseInt(timeParts[1]);

                const newDate = new Date();
                newDate.setFullYear(year, month, day);
                newDate.setHours(hour, minute, 0, 0);

                this.setDateTime(newDate);
            });
    }

    getDateString() {
        const year = this.local_date.getFullYear();
        const month = String(this.local_date.getMonth() + 1).padStart(2, "0");
        const day = String(this.local_date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    getTimeString() {
        const hours = String(this.local_date.getHours()).padStart(2, "0");
        const minutes = String(this.local_date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    convert_to_return_format(dt) {
        const date = new Date(dt);
        const utcTime = new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
            date.getUTCMilliseconds()
        );
        const formattedDate = Number(BigInt(utcTime) * BigInt(1000000));
        console.log(formattedDate);
        return formattedDate;
        // return new fastn.recordInstanceClass({
        //     dt: formattedDate,
        // });
    }

    getUTCISOString(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        const hours = String(date.getUTCHours()).padStart(2, "0");
        const minutes = String(date.getUTCMinutes()).padStart(2, "0");
        const seconds = String(date.getUTCSeconds()).padStart(2, "0");
        const ms = String(date.getUTCMilliseconds()).padStart(3, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
    }

    formatDateToString(date) {
        const utcIso = this.getUTCISOString(date);
        return utcIso
            .replaceAll(".", "")
            .replaceAll(":", "")
            .replaceAll("-", "");
    }

    setDateTime(date) {
        this.local_date = date;
        this.updateInputs();
        let formattedDate = this.formatDateToString(this.local_date);
        let returnDate = this.convert_to_return_format(this.local_date);
        const convert = new fastn.recordInstanceClass({
            // dt: Number(returnDate),
            dt: 12,
        });

        this.data.dt.set(convert);

        // const convert = new fastn.recordInstanceClass({
        //     dt: 1,
        // });
        // this.data.number.set(convert);

        if (this._onChangeCallback) {
            this._onChangeCallback(formattedDate);
        }

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: {
                    value: formattedDate,
                    rawDate: this.local_date,
                },
                bubbles: true,
            })
        );
    }

    updateInputs() {
        const dateInput = this.shadowRoot.querySelector(".date-input");
        const timeInput = this.shadowRoot.querySelector(".time-input");

        if (dateInput) {
            dateInput.value = this.getDateString();
        }
        if (timeInput) {
            timeInput.value = this.getTimeString();
        }
    }

    render() {
        const shadow = this.shadowRoot;
        shadow.innerHTML = `
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

function numberToWords(num) {
    return num.toString();
}

customElements.define("calender-widget", Calender);
