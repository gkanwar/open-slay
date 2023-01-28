use serde::{de, Serialize, Deserialize};
use wasm_bindgen::prelude::*;

use crate::color;
use crate::config;

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
#[serde(remote = "Self")]
pub struct Game {
    #[wasm_bindgen(skip)]
    pub board: Board,
    #[wasm_bindgen(skip)]
    pub players: Vec<Player>,
    #[serde(skip)]
    pub cur_turn: usize,
}
#[wasm_bindgen]
impl Game {
    pub fn from_json(json: String) -> Result<Game, JsError> {
        match serde_json::from_str(&json) {
            Ok(x) => Ok(x),
            Err(err) => Err(JsError::new(&err.to_string()))
        }
    }
    pub fn get_board(&self) -> JsValue {
        self.board.clone().into()
    }
    pub fn get_players(&self) -> js_sys::Array {
        self.players.clone().into_iter().map(JsValue::from).collect()
    }
}
impl<'de> Deserialize<'de> for Game {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
            D: serde::Deserializer<'de>
    {
        let mut game = Game::deserialize(deserializer)?;
        let board = &game.board;
        if game.players.len() < 2 {
            return Err(de::Error::custom("game must have at least two players"))
        }
        if board.tiles.len() != board.width * board.height {
            return Err(de::Error::custom("board must have exactly `width` * `height` tiles"));
        }
        // TODO: ideally we just use enum variants to handle many of these
        // checks, but wasm_bindgen does not yet support these!
        if !(&board.tiles).into_iter().all(|tile: &Tile| {
            match tile.kind {
                TileKind::Sea => { Option::is_none(&tile.territory) }
                TileKind::Land => { Option::is_some(&tile.territory) }
            }
        }) {
            return Err(de::Error::custom("all land tiles must have a territory and sea tiles must not"));
        }
        if !(&board.tiles).into_iter().all(|tile: &Tile| {
            match tile.territory {
                Some(t) => t < board.territories.len(),
                _ => true
            }
        }) {
           return Err(de::Error::custom("invalid territory"));
        }
        // TODO: probably some more checks required

        // set automatic values
        game.cur_turn = 0;
        for (i, player) in game.players.iter_mut().enumerate() {
            player.color = color::get_player_color(i);
        }

        Ok(game)
    }
}

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct Board {
    pub width: usize,
    pub height: usize,
    #[wasm_bindgen(skip)]
    pub tiles: Vec<Tile>,
    #[wasm_bindgen(skip)]
    pub units: Vec<Unit>,
    #[wasm_bindgen(skip)]
    pub houses: Vec<House>,
    #[wasm_bindgen(skip)]
    pub territories: Vec<Territory>
}
#[wasm_bindgen]
impl Board {
    pub fn get_tiles(&self) -> js_sys::Array {
        self.tiles.clone().into_iter().map(JsValue::from).collect()
    }
    pub fn get_territories(&self) -> js_sys::Array {
        self.territories.clone().into_iter().map(JsValue::from).collect()
    }
}

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum TileKind { Sea, Land }

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct Tile {
    pub kind: TileKind,
    #[serde(default)]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub territory: Option<usize>
}

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum UnitKind {
    Peasant,
    Spearman,
    Squire,
    Knight
}

#[wasm_bindgen]
pub fn get_unit_upkeep(kind: UnitKind) -> u64 {
    config::get_unit_upkeep(kind)
}

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub struct Unit {
    pub kind: UnitKind,
    #[wasm_bindgen(skip)]
    pub position: (usize, usize),
    #[wasm_bindgen(skip)]
    pub last_move_turn: usize
}
impl Unit {
    pub fn get_x(&self) -> usize {
        self.position.0
    }
    pub fn get_y(&self) -> usize {
        self.position.1
    }
}

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct House {
}

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct Territory {
    pub player: usize,
    pub money: usize
}

#[wasm_bindgen]
#[derive(Clone, Copy, Serialize, Deserialize)]
pub enum PlayerKind { Human, Computer }

#[wasm_bindgen]
#[derive(Clone, Serialize, Deserialize)]
pub struct Player {
    pub kind: PlayerKind,
    #[serde(skip)]
    pub color: RGBColor,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Default)]
pub struct RGBColor(pub usize, pub usize, pub usize);


// FORNOW: Just make a random game config to test JS/HTML display.
#[wasm_bindgen]
pub fn make_test_game() -> Game {
    set_panic_hook();
    let game: Game = serde_json::from_str(&r#"
        {
            "board": {
                "width": 4,
                "height": 4,
                "tiles": [
                    {"kind": "Sea"}, {"kind": "Sea"}, {"kind": "Sea"}, {"kind": "Sea"},
                    {"kind": "Sea"}, {"kind": "Land", "territory": 0}, {"kind": "Sea"}, {"kind": "Sea"},
                    {"kind": "Sea"}, {"kind": "Land", "territory": 0}, {"kind": "Land", "territory": 1}, {"kind": "Sea"},
                    {"kind": "Sea"}, {"kind": "Sea"}, {"kind": "Sea"}, {"kind": "Sea"}
                ],
                "units": [],
                "houses": [],
                "territories": [
                    {"player": 0, "money": 10},
                    {"player": 1, "money": 10}
                ]
            },
            "players": [
                {"kind": "Human"},
                {"kind": "Computer"}
            ]
        }
    "#.to_string()).expect("error creating test game");
    game
}

fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}