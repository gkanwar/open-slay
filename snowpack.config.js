module.exports = {
    mount: {
        "src/js": "/js",
        "static": "/",
    },
    devOptions: {
        open: "none"
    },
    plugins: [
        ['@emily-curry/snowpack-plugin-wasm-pack', {
            projectPath: './src/rust',
            logLevel: 'info'
        }]
    ]
}