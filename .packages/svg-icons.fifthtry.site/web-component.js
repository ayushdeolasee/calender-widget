// file-upload.js
class Icon extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // Create input element for file selection
        let data = window.ftd.component_data(this);
        let url = fastn_utils.getFlattenStaticValue(data.url.get());
        let size = fastn_utils.getFlattenStaticValue(data.size.get());
        let color = fastn_utils.getFlattenStaticValue(data.color.get());
        window.phosphor_svg_cache = window.phosphor_svg_cache || {};
        window.phosphor_svg_waiting = window.phosphor_svg_waiting || {};

        let element = this.createComponent(url, size);
        if (url in window.phosphor_svg_cache) {
            console.log("svg_cache hit for " + url);
            let wrapper = this.createWrapper(size, color, element);
            element.outerHTML = window.phosphor_svg_cache[url];
            this.shadowRoot.appendChild(wrapper);
            return;
        }

        console.log("svg_cache miss for " + url);
        if (url in window.phosphor_svg_waiting) {
            console.log("svg_waiting hit for " + url);
            window.phosphor_svg_waiting[url].push(element);
            let wrapper = this.createWrapper(size, color, element);
            this.shadowRoot.appendChild(wrapper);
            return;
        }


        window.phosphor_svg_waiting[url] = [element];

        fetch("https://" + url).then(function (response) {
            console.log("response", response);
            if (response.status !== 200) {
                console.log("response.status", response.status);
                return;
            }
            return response.text();
        }).then(function (text) {
            if (!text) {
                // this happens when we get 404
                return;
            }
            if (text.indexOf("currentColor") === -1) {
                text = text.replace(/<svg /g, '<svg fill="currentColor" ');
            }
            window.phosphor_svg_cache[url] = text;
            for (let el of window.phosphor_svg_waiting[url]) {
                el.outerHTML = text;
            }
            delete window.phosphor_svg_waiting[url];
        });


        let wrapper = this.createWrapper(size, color, element);
        this.shadowRoot.appendChild(wrapper);
    }

    createWrapper(size, color, child) {
        const outerDiv = document.createElement('div');
        outerDiv.style.width = `${size}px`;
        outerDiv.style.height = `${size}px`;
        if (!!color && !!color.get("light")) {
            let lightColor = fastn_utils.getFlattenStaticValue(color.get("light"));
            outerDiv.style.color = lightColor;
        }
        outerDiv.appendChild(child);

        return outerDiv;
    }

    createComponent(url, size) {
        // Create the div element
        const divElement = document.createElement('div');

        // Set the class attribute
        divElement.setAttribute('class', 'fastn-community-svg-icon-helper');

        // Set the style attribute
        divElement.style.width = `${size}px`;
        divElement.style.height = `${size}px`;
        divElement.style.opacity = "0";

        // Set the inner text
        divElement.innerText = url;

        return divElement;
    }
}

// Define the custom element
customElements.define('phosphor-icon', Icon);
