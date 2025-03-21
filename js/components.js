class Calender extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        const shadow = this.shadowRoot;
        const div = document.createElement("div");
        div.classList.add("hello-world");
        div.textContent = "Hello World!";
        div.style.color = "orange";
        div.style.borderWidth = "1px";
        div.style.borderColor = "yellow";
        div.style.borderStyle = "dashed";
        div.style.padding = "10px";
        shadow.appendChild(div);
    }
}

customElements.define("calender-widget", Calender);
