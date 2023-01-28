use crate::wasm;

pub fn get_player_color(i: usize) -> wasm::RGBColor {
    // TODO
    if i == 0 {
        wasm::RGBColor(0x15, 0xb0, 0x1a)
    }
    else if i == 1 {
        wasm::RGBColor(0x05, 0x60, 0x10)
    }
    else {
        wasm::RGBColor(0x0, 0x0, 0x0)
    }
}