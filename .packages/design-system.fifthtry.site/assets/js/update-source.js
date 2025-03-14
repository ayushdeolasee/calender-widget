async function update_source_code(file, source) {
    const static_value = fastn_utils.getStaticValue(file);
    const source_value = fastn_utils.getStaticValue(source);

    if(!static_value) {
        return;
    }

    const file_name = static_value !== '/' ? remove_trailing_slash(static_value) : 'index';

    const file_source = await new Promise((resolve, reject) => {
        fetch_ftd_source(`${file_name}.ftd`)
        .then(s => resolve(s))
        .catch(_ => {
            fetch_ftd_source(`${file_name}/index.ftd`)
                .then(resolve)
                .catch(reject)
        });
    });

    ftd.set_value(source_value + "#active-file-content", file_source);
}

async function fetch_ftd_source(file_path) {
    const res = await fetch(file_path);

    if(!res.ok) {
        throw Error(`Failed to fetch the file: ${file_path}`);
    }

    const text = await res.text();

    return text;
}

function remove_trailing_slash(s) {
    if(s.at(-1) === '/') {
        return s.slice(0, s.length - 1);
    }

    return s;
}

if(!customElements.get('source-updater')) {
    customElements.define('source-updater', class extends HTMLElement {
        connectedCallback() {
            ftd.on_load(async () => await update_source_code('/'));
        }
    });    
}
