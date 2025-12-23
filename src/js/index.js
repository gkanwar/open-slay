import init, {make_test_game, TileKind, PlayerKind} from 'rust-wasm-slay';
import {div, span} from './util';

function buildTile(tileClass, tileContent) {
    let tileDiv = div('board-tile', tileClass);
    let tileUpper = div('upper');
    let tileLower = div('lower');
    let tileDivInner = div('board-tile-inner', tileClass);
    let tileInnerUpper = div('upper');
    let tileInnerLower = div('lower');
    tileContent.classList.add('content');
    tileDivInner.appendChild(tileInnerUpper);
    tileDivInner.appendChild(tileContent);
    tileDivInner.appendChild(tileInnerLower);
    tileDiv.appendChild(tileUpper);
    tileDiv.appendChild(tileDivInner);
    tileDiv.appendChild(tileLower);
    return tileDiv;
}

function makeTilePlayerColorObserver(playerColors) {
    return (mutations) => {
        console.log('mutations', mutations);
        mutations.filter((mutation) => (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'player'
        )).forEach((mutation) => {
            const elt = mutation.target;
            const oldPlayer = mutation.oldValue;
            const newPlayer = elt.getAttribute('player');
            console.log('tile player mutation', oldPlayer, newPlayer);
            if (newPlayer !== oldPlayer) {
                const [newColorInner, newColorOuter] = playerColors[newPlayer];
                // elt.style.setProperty('--outer-color', newColorOuter);
                elt.style.setProperty('--inner-color', newColorInner);
            }
        });
    };
}

function darkenColor(color) {
    const DARKEN_FRACTION = 0.5;
    const [r, g, b] = [color[0], color[1], color[2]];
    return [r,g,b].map((x) =>
        Math.round(DARKEN_FRACTION * x)
    );
}

function rgbToHex(color) {
    return '#' + [color[0], color[1], color[2]].map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex
    }).join('');
}

function drawPlayerSummary(game) {
    const playerBadges = game.get_players().map((player) => {
        const playerBadge = div('player-badge');
        const colorSwatch = div('color-swatch');
        colorSwatch.style.setProperty('--color', rgbToHex(player.color));
        const playerName = span('player-name');
        playerName.innerText = (
            player.kind == PlayerKind.Human ? 'Human' : 'Computer'
        );
        playerBadge.appendChild(colorSwatch);
        playerBadge.appendChild(playerName);
        return playerBadge;
    });
    const playerSummaryDiv = div('player-summary');
    playerBadges.forEach(
        (badgeDiv) => playerSummaryDiv.appendChild(badgeDiv));
    return playerSummaryDiv;
}

function drawPanel(game) {
    const panelDiv = div('panel');
    const playerSummaryDiv = drawPlayerSummary(game);
    panelDiv.appendChild(playerSummaryDiv);
    return panelDiv;
}

function drawBoard(game, hoverTileCallback, clickTileCallback) {
    const boardDiv = div('board');
    const board = game.get_board();
    const [width, height] = [board.width, board.height];
    const tiles = board.get_tiles();
    const territories = board.get_territories();
    const players = game.get_players();
    const playerColors = players.map((player) =>
        [ rgbToHex(player.color), rgbToHex(darkenColor(player.color)) ]
    );
    const colorObserver = new MutationObserver(
        makeTilePlayerColorObserver(playerColors));
    const addColorObserverTile = (tile) => {
        colorObserver.observe(tile, {
            attributeFilter: ['player'],
            attributeOldValue: true
        })
    };
    let tileIndex = 0;
    for (let row = 0; row < height; ++row) {
        const rowDiv = div('board-row');
        for (let col = 0; col < width; ++col) {
            const tile = tiles[tileIndex++];
            const tileClass = (tile.kind == TileKind.Sea) ? 'sea' : 'land';
            const tileContent = div(tileClass);
            const tileDiv = buildTile(tileClass, tileContent);
            if (tileClass == 'land') {
                addColorObserverTile(tileDiv);
                const owner = territories[tile.territory].player;
                tileDiv.setAttribute('player', owner);
                tileDiv.addEventListener(
                    'mouseover', () => hoverTileCallback([row, col])
                );
                tileDiv.addEventListener(
                    'mousedown', () => clickTileCallback([row, col])
                );
            }
            rowDiv.appendChild(tileDiv);
        }
        boardDiv.appendChild(rowDiv);
    }
    return boardDiv;
}

function drawGame(game, targetDiv, uiState) {
    const hoverTileCallback = (coord) => {
        uiState.hoveredTile = coord;
    };
    const clickTileCallback = (coord) => {
        const [row, col] = coord;
        const board = game.get_board();
        const [width, height] = [board.width, board.height];
        const tile = board.get_tiles()[row*weight + col];
        uiState.selectedTerritory = tile.territory;
    };
    const boardDiv = drawBoard(
        game, hoverTileCallback, clickTileCallback);
    const gameDiv = div('game-portal');
    gameDiv.appendChild(boardDiv);
    gameDiv.addEventListener('mousedown', makeGameDragHandler());

    const panelDiv = drawPanel(game);

    targetDiv.innerHTML = '';
    targetDiv.appendChild(gameDiv);
    targetDiv.appendChild(panelDiv);
}

function makeGameDragHandler() {
    let elt = null;
    let mouseStartPos = null;
    let scrollStartPos = null;
    const mouseDownHandler = (event) => {
        elt = event.currentTarget;
        event.currentTarget.style.cursor = 'grabbing';
        elt.addEventListener('mouseup', mouseUpHandler);
        elt.addEventListener('mousemove', mouseMoveHandler);
        mouseStartPos = { x: event.clientX, y: event.clientY };
        scrollStartPos = { left: elt.scrollLeft, top: elt.scrollTop };
    };
    const mouseUpHandler = (event) => {
        if (elt == null) return;
        elt.style.cursor = 'grab';
        elt.removeEventListener('mouseup', mouseUpHandler);
        elt.removeEventListener('mousemove', mouseMoveHandler);
    };
    const mouseMoveHandler = (event) => {
        if (elt == null || mouseStartPos == null || scrollStartPos == null) return;
        const dx = event.clientX - mouseStartPos.x;
        const dy = event.clientY - mouseStartPos.y;
        elt.scrollLeft = scrollStartPos.left - dx;
        elt.scrollTop = scrollStartPos.top - dy;
    };
    return mouseDownHandler;
}

(async () => {
    await init();

    let mainDiv = document.getElementById('content');
    if (mainDiv == null) {
        console.error('Main content div missing');
        return;
    }

    let game = make_test_game();
    const uiState = {
        'hoveredTile': null,
        'selectedTerritory': null,
    };
    drawGame(game, mainDiv, uiState);
})();