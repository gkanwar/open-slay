use crate::wasm::{Board, Game, Territory, Unit};
use crate::config::{UNIT_COST, TOWER_COST};

// Note: Linear indexing using "matrix" convention of column running fastest,
// row running slowest and tuple indices are (row, col).
fn get_ind_from_coord(coord: (usize, usize), board: &Board) -> usize {
    assert!(coord.0 < board.height && coord.1 < board.width);
    coord.0 * board.width + coord.1
}

enum Action {
    MoveAction { unit: usize, tile: usize },
    BuyAction { tile: usize },
    UpgradeAction { unit: usize }
}

fn get_moveable_units(game: &Game) -> Vec<usize> {
    let cur_turn: usize = game.cur_turn;
    let cur_player: usize = cur_turn % game.players.len();
    game.board.units.iter()
        .enumerate()
        .filter(|i_unit: &(usize, &Unit)| {
            let unit = i_unit.1;
            let pos = unit.position;
            let i = get_ind_from_coord(pos, &game.board);
            let terr = &game.board.territories[i];
            terr.player == cur_player && unit.last_move_turn < cur_turn
        })
        .map(|i_unit: (usize, &Unit)| i_unit.0)
        .collect()
}

fn get_territories_with_buys(game: &Game) -> Vec<usize> {
    let cur_player: usize = game.cur_turn % game.players.len();
    game.board.territories.iter()
        .enumerate()
        .filter(
        |i_terr: &(usize, &Territory)| {
            let terr = i_terr.1;
            terr.player == cur_player &&
            (terr.money >= UNIT_COST as usize ||
             terr.money >= TOWER_COST as usize)
        })
        .map(|i_terr: (usize, &Territory)| i_terr.0)
        .collect()
}