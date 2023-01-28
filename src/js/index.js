import init, {make_test_game, TileKind} from 'rust-wasm-slay';

function buildTile(tileClass, tileContent) {
    let tileDiv = document.createElement('div');
    tileDiv.classList.add('board-tile', tileClass);
    let tileUpper = document.createElement('div');
    let tileLower = document.createElement('div');
    tileUpper.classList.add('upper');
    tileLower.classList.add('lower');
    let tileDivInner = document.createElement('div');
    tileDivInner.classList.add('board-tile-inner', tileClass);
    let tileInnerUpper = document.createElement('div');
    let tileInnerLower = document.createElement('div');
    tileInnerUpper.classList.add('upper');
    tileInnerLower.classList.add('lower');
    tileContent.classList.add('content');
    tileDivInner.appendChild(tileInnerUpper);
    tileDivInner.appendChild(tileContent);
    tileDivInner.appendChild(tileInnerLower);
    tileDiv.appendChild(tileUpper);
    tileDiv.appendChild(tileDivInner);
    tileDiv.appendChild(tileLower);
    return tileDiv;
}

function makeColorCallback(playerColors) {
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

function drawGame(game, div) {
    const board = game.get_board();
    const [width, height] = [board.width, board.height];
    const boardDiv = document.createElement('div');
    boardDiv.classList.add('board');
    const tiles = board.get_tiles();
    const territories = board.get_territories();
    let tileIndex = 0;
    const players = game.get_players();
    const playerColors = players.map((player) =>
        [ rgbToHex(player.color), rgbToHex(darkenColor(player.color)) ]
    );
    const colorObserver = new MutationObserver(makeColorCallback(playerColors));
    const addColorObserverTile = (tile) => {
        colorObserver.observe(tile, {
            attributeFilter: ['player'],
            attributeOldValue: true
        })
    };
    for (let row = 0; row < height; ++row) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('board-row');
        for (let col = 0; col < width; ++col) {
            const tile = tiles[tileIndex++];
            const tileContent = document.createElement('div');
            const tileClass = (tile.kind == TileKind.Sea) ? 'sea' : 'land';
            const tileDiv = buildTile(tileClass, tileContent);
            if (tileClass == 'land') {
                addColorObserverTile(tileDiv);
                const owner = territories[tile.territory].player;
                tileDiv.setAttribute('player', owner);
            }
            rowDiv.appendChild(tileDiv);
        }
        boardDiv.appendChild(rowDiv);
    }
    const gameDiv = document.createElement('div');
    gameDiv.classList.add('game-portal');
    gameDiv.appendChild(boardDiv);
    gameDiv.addEventListener('mousedown', makeGameDragHandler());

    div.innerHTML = '';
    div.appendChild(gameDiv);
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
    drawGame(game, mainDiv);
})();