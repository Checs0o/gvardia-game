const board = document.getElementById("board");
const rows = 7;
const cols = 9;

let currentPlayer = "A"; // A или B
let gameHistory = [];
let moveLog = [];

const pieceNotation = {
  Ba: "B",  // Башня
  Rz: "R",  // Разведчик
  Gv: "G",  // Гвардеец
  Of: "O",  // Офицер
  Gn: "K",  // Генерал (King)
  Me: "M"   // Механик
};

// SVG-иконки для фигур
const svgIcons = {
  Ba: `<svg viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="10" width="24" height="44" stroke="currentColor" stroke-width="3" fill="none"/>
    <line x1="20" y1="30" x2="44" y2="30" stroke="currentColor" stroke-width="3"/>
    <line x1="32" y1="10" x2="32" y2="54" stroke="currentColor" stroke-width="3"/>
  </svg>`,
  Rz: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="14"/>
    <path d="M32 18 L32 46"/>
    <path d="M18 32 L46 32"/>
  </svg>`,
  Gv: `<svg viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="10" />
    <rect x="22" y="30" width="20" height="24" />
  </svg>`,
  Of: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,54 32,10 44,54"/>
    <line x1="32" y1="10" x2="32" y2="54"/>
  </svg>`,
  Gn: `<svg viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="20" r="12" />
    <rect x="20" y="30" width="24" height="24" rx="6" ry="6" />
  </svg>`,
  Me: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="20" width="24" height="24" rx="4" ry="4"/>
    <line x1="20" y1="32" x2="44" y2="32"/>
    <line x1="32" y1="20" x2="32" y2="44"/>
  </svg>`
};

let gameState = {};
let selectedCell = null;
let validMoves = [];

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function startNewGame() {
  currentPlayer = "A";
  gameHistory = [];
  moveLog = [];
  updateMoveLog();

  gameState = {};

  // Статичная расстановка фигур игрока А
  const playerA = {
    "0,0": "Ba", "1,0": "Rz", "2,0": "Gv", "3,0": "Of", "4,0": "Gn",
    "5,0": "Of", "6,0": "Gv", "7,0": "Rz", "8,0": "Ba",
    "2,1": "Gv", "4,1": "Me", "6,1": "Gv",
    "1,2": "Gv", "3,2": "Gv", "5,2": "Gv", "7,2": "Gv"
  };

  // Зеркальная расстановка игрока B
  const playerB = {};
  for (let key in playerA) {
    let [x, y] = key.split(",").map(Number);
    let mirroredY = rows - 1 - y;
    playerB[`${x},${mirroredY}`] = playerA[key];
  }

  // Заполняем состояние игры
  for (let key in playerA) {
    gameState[key] = { type: playerA[key], owner: "A" };
  }
  for (let key in playerB) {
    gameState[key] = { type: playerB[key], owner: "B" };
  }

  renderBoard();
}

function renderBoard() {
  // Удаляем предыдущий ряд с буквами, если он есть
  const prevLettersRow = document.getElementById("lettersRow");
  if (prevLettersRow) {
    prevLettersRow.remove();
  }

  board.innerHTML = "";

  // Добавим первую строку с буквами (A-I)
  const lettersRow = document.createElement("div");
  lettersRow.id = "lettersRow";
  lettersRow.style.display = "grid";
  lettersRow.style.gridTemplateColumns = `30px repeat(${cols}, 60px)`;
  lettersRow.style.marginBottom = "4px";

  const emptyCorner = document.createElement("div");
  emptyCorner.style.width = "30px";
  lettersRow.appendChild(emptyCorner);

  for(let i=0; i<cols; i++) {
    const letterCell = document.createElement("div");
    letterCell.textContent = String.fromCharCode(65 + i);
    letterCell.style.textAlign = "center";
    letterCell.style.fontWeight = "bold";
    letterCell.style.height = "20px";
    lettersRow.appendChild(letterCell);
  }
  board.parentNode.insertBefore(lettersRow, board);

  board.style.position = "relative";

  // Добавим цифры слева
  for (let y = 0; y < rows; y++) {
    const rowNumber = document.createElement("div");
    rowNumber.textContent = rows - y;
    rowNumber.classList.add("rowNumber");
    rowNumber.style.top = `${y * 62}px`;
    board.appendChild(rowNumber);
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      const key = `${x},${y}`;
      const piece = gameState[key];
      if (piece) {
        cell.innerHTML = svgIcons[piece.type] || "";
        cell.style.color = piece.owner === currentPlayer ? "#fff" : "#888";
        cell.style.textShadow = piece.owner === currentPlayer ? "0 0 3px #000" : "none";
      } else {
        cell.innerHTML = "";
      }
      if (selectedCell && selectedCell.x === x && selectedCell.y === y) {
        cell.classList.add("selected");
      }
      if (validMoves.some(m => m.x === x && m.y === y)) {
        cell.classList.add("highlight");
      }
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener("click", onCellClick);
      board.appendChild(cell);
    }
  }
}

function onCellClick(e) {
  const x = parseInt(e.currentTarget.dataset.x);
  const y = parseInt(e.currentTarget.dataset.y);
  const key = `${x},${y}`;
  const piece = gameState[key];

  if (selectedCell) {
    if (validMoves.some(m => m.x === x && m.y === y)) {
      const fromKey = `${selectedCell.x},${selectedCell.y}`;
      gameHistory.push(cloneState(gameState));

      recordMove(selectedCell.x, selectedCell.y, x, y, gameState[fromKey]);

      gameState[key] = gameState[fromKey];
      delete gameState[fromKey];
      selectedCell = null;
      validMoves = [];
      currentPlayer = currentPlayer === "A" ? "B" : "A";
      renderBoard();
      updateMoveLog();
      checkForCheckmate();
      return;
    }
    selectedCell = null;
    validMoves = [];
    renderBoard();
  } else if (piece && piece.owner === currentPlayer) {
    selectedCell = { x, y };
    validMoves = getValidMoves(piece, x, y);
    renderBoard();
  }
}

function getValidMoves(piece, x1, y1) {
  const moves = [];
  for (let y2 = 0; y2 < rows; y2++) {
    for (let x2 = 0; x2 < cols; x2++) {
      if (isValidMove(piece, x1, y1, x2, y2)) {
        moves.push({ x: x2, y: y2 });
      }
    }
  }
  return moves;
}

function isValidMove(piece, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const destKey = `${x2},${y2}`;
  const destPiece = gameState[destKey];
  if (destPiece && destPiece.owner === piece.owner) return false;

  switch (piece.type) {
    case "Gn":
      if (absDx <= 1 && absDy <= 1 && x2 >= 3 && x2 <= 5) return true;
      break;
    case "Gv":
      if (dx === 0 && absDy === 1 && !destPiece) return true;
      if (absDx === 1 && dy === 0 && destPiece) return true;
      break;
    case "Of":
      if ((absDx === absDy || (dy === 0 && absDx <= 2)) && absDx <= 2 && absDy <= 2) return true;
      break;
    case "Ba":
      if (dx === 0 || dy === 0) {
        const steps = Math.max(absDx, absDy);
        for (let i = 1; i < steps; i++) {
          const ix = x1 + (dx === 0 ? 0 : dx / absDx * i);
          const iy = y1 + (dy === 0 ? 0 : dy / absDy * i);
          if (gameState[`${ix},${iy}`]) return false;
        }
        return true;
      }
      break;
    case "Rz":
      if ((absDx <= 1 && absDy <= 1 && !destPiece) ||
          (absDx === 2 && dy === 0) ||
          (absDy === 2 && dx === 0) ||
          (absDx === 2 && absDy === 2)) return true;
      break;
    case "Me":
      if (absDx <= 1 && absDy <= 1 && !destPiece) return true;
      break;
  }
  return false;
}

function checkForCheckmate() {
  const generals = Object.entries(gameState).filter(([k, v]) => v.type === "Gn");
  if (generals.length < 2) {
    alert(`Игрок ${currentPlayer === "A" ? "B" : "A"} победил!`);
  }
}

function undoMove() {
  if (gameHistory.length > 0) {
    gameState = gameHistory.pop();
    currentPlayer = currentPlayer === "A" ? "B" : "A";
    selectedCell = null;
    validMoves = [];
    updateMoveLog();
    renderBoard();
  }
}

function recordMove(x1, y1, x2, y2, piece) {
  const from = String.fromCharCode(65 + x1) + (rows - y1);
  const to = String.fromCharCode(65 + x2) + (rows - y2);
  moveLog.push(`${pieceNotation[piece.type]}${from}-${to}`);
}

function updateMoveLog() {
  const logDiv = document.getElementById("moveLog");
  if (!logDiv) return;
  logDiv.innerHTML = "";
  moveLog.forEach((move, i) => {
    const p = document.createElement("p");
    p.textContent = `${i + 1}. ${move}`;
    logDiv.appendChild(p);
  });
}

// Кнопки и журнал ходов добавляем программно
document.body.insertAdjacentHTML("beforeend", `
  <div style="margin: 10px; text-align: center;">
    <button onclick="startNewGame()">Новая партия</button>
    <button onclick="undoMove()">Отменить ход</button>
  </div>
  <div id="moveLog"></div>
`);

startNewGame();