use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn dummy() -> JsValue {
    JsValue::from_str("Hello, from Rust!")
}