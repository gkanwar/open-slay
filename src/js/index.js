import init, {dummy} from 'rust-wasm-slay';

(async () => {
    await init();

    let mainDiv = document.getElementById("content");
    if (mainDiv == null) {
        console.error("Main content div missing");
        return;
    }
    let p = document.createElement("p");
    p.innerText = dummy();
    mainDiv.appendChild(p);
})();