/// Overall game configuration constants.

use crate::wasm;

pub fn get_unit_upkeep(kind: wasm::UnitKind) -> u64 {
    match kind {
        wasm::UnitKind::Peasant => 2,
        wasm::UnitKind::Spearman => 6,
        wasm::UnitKind::Squire => 18,
        wasm::UnitKind::Knight => 54
    }
}
pub const UNIT_COST: u64 = 10;
pub const TOWER_COST: u64 = 15;