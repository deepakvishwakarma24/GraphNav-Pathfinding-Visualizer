/*==========================================================================
 * Author: Deepak Vishwakarma
 * Project: GraphNav – Pathfinding Visualizer
 *
 * Description:
 * GraphNav is an interactive visualization tool designed to help
 * understand and compare classical pathfinding algorithms on a 2D grid.
 * The project focuses on algorithm behavior, animation, and user control.
 *
 * Algorithms Implemented:
 * - BFS, DFS
 * - Dijkstra’s Algorithm
 * - A* Search (Manhattan Heuristic)
 * - Greedy Best-First Search
 * - Bi-Directional BFS
 *
 * Built using: HTML, CSS, Vanilla JavaScript, Data Structures & Algorithms
 ===========================================================================*/

const board = document.getElementById("board");
var cells;
let row;
let col;
var matrix;
let width = 22;

let source_Cordinate;
let target_Cordinate;

// Speed control
const fast_AnimateDelay = 7;
const normal_AnimateDelay = 10;
const slow_AnimateDelay = 50;
let delay = normal_AnimateDelay;

// Animation timeout management
let timeoutIds = [];
function clearPreviousTimeouts() {
  for (let id of timeoutIds) {
    clearTimeout(id);
  }
  timeoutIds = [];
}

// =====================================================
// ===================== TUTORIAL =====================
// =====================================================
let count = 0;
const slides = document.querySelectorAll(".tutorial .slide");
const prevBtn = document.querySelector("#prev");
const nextBtn = document.querySelector("#next");
const skipBtn = document.querySelector("#skip");
const tutorial = document.querySelector("#tutorial");
const tutorialToggle = document.querySelector(".tutorial-toggle");

const siteVisited = localStorage.getItem("visited");
if (!siteVisited) {
  tutorial.classList.add("active");
  localStorage.setItem("visited", "true");
}

tutorial.addEventListener("click", (e) => {
  if (e.target.classList.contains("tutorial")) {
    skipBtn.style.animation = ".2s shake 2 ease-in-out";
    setTimeout(() => {
      skipBtn.style.animation = "none";
    }, 1000);
  }
});
tutorialToggle.addEventListener("click", () => {
  tutorial.classList.add("active");
  count = 0;
  nextBtn.innerText = "next";
  prevBtn.classList.add("unactive");
  moveSlides(count);
});
skipBtn.addEventListener("click", () => {
  tutorial.classList.remove("active");
});

// Arranging one after one
slides.forEach((slide, index) => {
  slide.style.left = `${100 * index}%`;
});

const dot = document.querySelector(".dots");
for (let i = 0; i < slides.length; i++) {
  dot.innerHTML += `<div class="dot ${i === 0 ? "active" : ""}"></div>`;
}
const dots = document.querySelectorAll(".dot");

dots.forEach((dot, i) => {
  dot.addEventListener("click", () => {
    count = i;
    if (count == 0) {
      prevBtn.classList.add("unactive");
    } else if (count == slides.length - 1) {
      nextBtn.innerText = "finish";
    } else {
      prevBtn.classList.remove("unactive");
      nextBtn.innerText = "next";
    }
    moveSlides(count);
  });
});

function moveSlides(count) {
  dots.forEach((dot) => {
    dot.classList.remove("active");
  });

  dots[count].classList.add("active");

  slides.forEach((slide) => {
    slide.style.transform = `translateX(${-count * 100}%)`;
  });
}

nextBtn.addEventListener("click", () => {
  if (count == slides.length - 1) {
    tutorial.classList.remove("active");
    return;
  }
  count++;
  if (count == slides.length - 1) {
    nextBtn.innerText = "finish";
  }
  moveSlides(count);
  prevBtn.classList.remove("unactive");
});

prevBtn.addEventListener("click", () => {
  if (count == 0) {
    return;
  }
  nextBtn.innerText = "next";
  count--;
  if (count == 0) {
    prevBtn.classList.add("unactive");
  }
  moveSlides(count);
});

window.addEventListener("keydown", (e) => {
  if (e.keyCode == 37 || e.keyCode == 74) {
    prevBtn.click();
  } else if (e.keyCode == 39 || e.keyCode == 76) {
    nextBtn.click();
  }
});

// Guide toggle
const guide = document.querySelector(".guide");
const guideToggle = document.querySelector(".guide-toggle");
if (guideToggle) {
  guideToggle.addEventListener("click", () => {
    guide.classList.toggle("active");
  });
}

document.addEventListener("click", (e) => {
  if (guideToggle && !guideToggle.contains(e.target))
    guide.classList.remove("active");
});

renderBoard();
function renderBoard(cellWidth = 22) {
  width = cellWidth;
  const root = document.documentElement;
  root.style.setProperty("--cell-width", `${cellWidth}px`);
  row = Math.floor(board.clientHeight / cellWidth);
  col = Math.floor(board.clientWidth / cellWidth);
  if (window.innerWidth <= 662) {
    row -= 1;
  }
  board.innerHTML = "";

  cells = [];
  matrix = [];

  for (let i = 0; i < row; i++) {
    const rowArr = [];
    const rowElement = document.createElement("div");
    rowElement.classList.add("row");
    rowElement.setAttribute("id", `row-${i}`);

    for (let j = 0; j < col; j++) {
      const colElement = document.createElement("div");
      colElement.classList.add("col", "unvisited");
      colElement.setAttribute("id", `${i}-${j}`);
      cells.push(colElement);
      rowArr.push(colElement);
      rowElement.appendChild(colElement);
    }

    matrix.push(rowArr);
    board.appendChild(rowElement);
  }
  source_Cordinate = set("source");
  target_Cordinate = set("target");
  boardInteraction(cells);
}

// ==========================================================
// ====================== CLICK EVENTS ======================
// ==========================================================

const navItems = document.querySelectorAll(".nav-menu > li.drop-box");
const allDropMenus = document.querySelectorAll(".drop-menu");
const visualizeBtn = document.getElementById("visualize");

let algorithm = "";

// Utility functions
const clearActiveNav = () => {
  navItems.forEach((li) => li.classList.remove("active"));
};
const closeAllMenus = () => {
  allDropMenus.forEach((menu) => menu.classList.remove("active"));
};

// NAVIGATION click
navItems.forEach((item) => {
  const trigger = item.querySelector(".dropdown-trigger");
  const dropMenu = item.querySelector(".drop-menu");

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();

    const isActive = dropMenu.classList.contains("active");
    closeAllMenus();
    clearActiveNav();

    if (!isActive) {
      item.classList.add("active");
      dropMenu.classList.add("active");
    }
  });
});

// OUTSIDE CLICK
document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-menu")) {
    clearActiveNav();
    closeAllMenus();
  }
});

// DROP MENU OPTION CLICK
document.querySelectorAll(".drop-menu li").forEach((option) => {
  option.addEventListener("click", (e) => {
    e.stopPropagation();

    const currentMenu = option.closest(".drop-menu");

    // clear only inside that dropdown
    currentMenu
      .querySelectorAll("li")
      .forEach((li) => li.classList.remove("active"));

    // set active only for selected one
    option.classList.add("active");

    // close menus after selection
    closeAllMenus();
    clearActiveNav();

    // Handle pixel size
    const parentBox = option.closest("li.drop-box");
    if (parentBox?.id === "pixel") {
      const pixelText = option.innerText.trim();
      const pixelSize = parseInt(pixelText);
      width = pixelSize;
      document.documentElement.style.setProperty(
        "--cell-width",
        `${pixelSize}px`
      );
      renderBoard(pixelSize);
    }
    // Handle speed
    else if (parentBox?.id === "speed") {
      const speedText = option.innerText.trim();
      if (speedText === "Fast") delay = fast_AnimateDelay;
      else if (speedText === "Normal") delay = normal_AnimateDelay;
      else delay = slow_AnimateDelay;
    }
    // algorithm logic
    else if (parentBox?.id === "algo") {
      const text = option.innerText.trim();
      algorithm = text.split(" ")[0];
      if (text.includes("Bi-Directional")) algorithm = "Bi-Directional";
      else if (text.includes("Dijkstra")) algorithm = "Dijkstra's";
      else if (text.includes("Greedy")) algorithm = "Greedy";
      else if (text.includes("A*")) algorithm = "A*";
      else if (text.includes("BFS")) algorithm = "BFS";
      else if (text.includes("DFS")) algorithm = "DFS";
      visualizeBtn.innerText = `Visualize ${algorithm}`;
    }
  });
});

// ============================================================
// ============== Board Interaction ===========================
// ==============================================================

function isValid(x, y) {
  return x >= 0 && y >= 0 && x < row && y < col;
}

function set(className, x = -1, y = -1) {
  // Remove existing source/target classes from all cells first
  const allCells = document.querySelectorAll('.col');
  allCells.forEach((cell) => {
    cell.classList.remove(className);
  });
  
  if (isValid(x, y)) {
    matrix[x][y].classList.add(className);
  } else {
    x = Math.floor(Math.random() * row);
    y = Math.floor(Math.random() * col);
    matrix[x][y].classList.add(className);
  }
  return { x, y };
}

let isDrawing = false;
let isDragging = false;
let Dragpoint = null;

function boardInteraction(cells) {
  let draging = false;
  let drawing = false;
  let dragStart = null;

  cells.forEach((cell) => {
    const pointDown = (e) => {
      if (e.target.classList.contains("source")) {
        dragStart = "source";
        draging = true;
      } else if (e.target.classList.contains("target")) {
        dragStart = "target";
        draging = true;
      } else {
        drawing = true;
      }
    };

    const pointUp = () => {
      drawing = false;
      draging = false;
      dragStart = null;
      if (
        matrix[source_Cordinate.x] &&
        matrix[source_Cordinate.x][source_Cordinate.y]
      ) {
        matrix[source_Cordinate.x][source_Cordinate.y].classList.remove("wall");
      }
      if (
        matrix[target_Cordinate.x] &&
        matrix[target_Cordinate.x][target_Cordinate.y]
      ) {
        matrix[target_Cordinate.x][target_Cordinate.y].classList.remove("wall");
      }
    };

    const pointMove = (e) => {
      const triggerElement = document.elementFromPoint(e.clientX, e.clientY);
      if (triggerElement == null || !triggerElement.classList.contains("col"))
        return;
      const cordinate = { ...triggerElement.id.split("-") };

      if (draging && dragStart) {
        cells.forEach((cell) => {
          cell.classList.remove(dragStart);
        });
        triggerElement.classList.add(dragStart);

        if (dragStart === "source") {
          source_Cordinate.x = Number(cordinate[0]);
          source_Cordinate.y = Number(cordinate[1]);
        } else {
          target_Cordinate.x = Number(cordinate[0]);
          target_Cordinate.y = Number(cordinate[1]);
        }
      } else if (drawing) {
        if (
          triggerElement.classList.contains("source") ||
          triggerElement.classList.contains("target")
        )
          return;

        const x = Number(cordinate[0]);
        const y = Number(cordinate[1]);

        if (matrix[x] && matrix[x][y]) {
          matrix[x][y].setAttribute("class", "col wall");
        }
      }
    };

    cell.addEventListener("pointerdown", pointDown);
    cell.addEventListener("pointermove", pointMove);
    cell.addEventListener("pointerup", pointUp);

    cell.addEventListener("click", () => {
      if (
        cell.classList.contains("source") ||
        cell.classList.contains("target")
      )
        return;

      cell.classList.remove("visited", "path");
      cell.classList.toggle("wall");
    });
  });
}
const clearPathBtn = document.getElementById("clear-path");
const clearBoardBtn = document.getElementById("clear-board");
const generateMazeBtn = document.getElementById("generate-maze");

clearPathBtn.addEventListener("click", clearPath);
clearBoardBtn.addEventListener("click", clearBoard);

function clearPath() {
  cells.forEach((cell) => {
    cell.classList.remove("visited");
    cell.classList.remove("path");
  });
}

function clearBoard() {
  cells.forEach((cell) => {
    cell.classList.remove("visited");
    cell.classList.remove("wall");
    cell.classList.remove("path");
  });
}

var wallToAnimate;
if (generateMazeBtn) {
  generateMazeBtn.addEventListener("click", () => {
    clearBoard();
    wallToAnimate = [];
    recursiveDivisionMaze(0, row - 1, 0, col - 1, "horizontal", false);
    animate(wallToAnimate, "wall", fast_AnimateDelay);
  });
}

// ==============================================================
// ============== Maze Generation Algorithm =====================
// ==============================================================

function recursiveDivisionMaze(
  rowStart,
  rowEnd,
  colStart,
  colEnd,
  orientation,
  surroundingWalls
) {
  if (rowEnd < rowStart || colEnd < colStart) {
    return;
  }

  if (!surroundingWalls) {
    //Drawing top & bottom Boundary Wall
    for (let i = 0; i < col; i++) {
      if (
        matrix[0][i].classList.contains("source") ||
        matrix[0][i].classList.contains("target")
      )
        continue;

      wallToAnimate.push(matrix[0][i]);

      if (
        matrix[row - 1][i].classList.contains("source") ||
        matrix[row - 1][i].classList.contains("target")
      )
        continue;
      wallToAnimate.push(matrix[row - 1][i]);
    }

    //Drawing left & right Boundar wall
    for (let i = 0; i < row; i++) {
      if (
        matrix[i][0].classList.contains("source") ||
        matrix[i][0].classList.contains("target")
      )
        continue;
      wallToAnimate.push(matrix[i][0]);

      if (
        matrix[i][col - 1].classList.contains("source") ||
        matrix[i][col - 1].classList.contains("target")
      )
        continue;
      wallToAnimate.push(matrix[i][col - 1]);
    }
    surroundingWalls = true;
  }

  //=========== horizontal ======
  if (orientation === "horizontal") {
    let possibleRows = [];
    for (let i = rowStart; i <= rowEnd; i += 2) {
      if (i == 0 || i == row - 1) continue;
      possibleRows.push(i);
    }
    let possibleCols = [];
    for (let i = colStart - 1; i <= colEnd + 1; i += 2) {
      if (i <= 0 || i >= col - 1) continue;
      possibleCols.push(i);
    }

    let currentRow =
      possibleRows[Math.floor(Math.random() * possibleRows.length)];
    let colRandom =
      possibleCols[Math.floor(Math.random() * possibleCols.length)];

    //drawing horizontal wall
    for (i = colStart - 1; i <= colEnd + 1; i++) {
      const cell = matrix[currentRow][i];
      if (
        !cell ||
        i === colRandom ||
        cell.classList.contains("source") ||
        cell.classList.contains("target")
      )
        continue;

      wallToAnimate.push(cell);
    }

    if (currentRow - 2 - rowStart > colEnd - colStart) {
      recursiveDivisionMaze(
        rowStart,
        currentRow - 2,
        colStart,
        colEnd,
        orientation,
        surroundingWalls
      );
    } else {
      recursiveDivisionMaze(
        rowStart,
        currentRow - 2,
        colStart,
        colEnd,
        "vertical",
        surroundingWalls
      );
    }
    if (rowEnd - (currentRow + 2) > colEnd - colStart) {
      recursiveDivisionMaze(
        currentRow + 2,
        rowEnd,
        colStart,
        colEnd,
        orientation,
        surroundingWalls
      );
    } else {
      recursiveDivisionMaze(
        currentRow + 2,
        rowEnd,
        colStart,
        colEnd,
        "vertical",
        surroundingWalls
      );
    }
  }

  //=========== vertical ======
  else if (orientation === "vertical") {
    let possibleCols = [];
    for (let i = colStart; i <= colEnd; i += 2) {
      possibleCols.push(i);
    }
    let possibleRows = [];
    for (let i = rowStart - 1; i <= rowEnd + 1; i += 2) {
      if (i <= 0 || i >= row - 1) continue;
      possibleRows.push(i);
    }

    let currentCol =
      possibleCols[Math.floor(Math.random() * possibleCols.length)];
    let rowRandom =
      possibleRows[Math.floor(Math.random() * possibleRows.length)];

    //drawing vertical wall
    for (i = rowStart - 1; i <= rowEnd + 1; i++) {
      if (!matrix[i]) continue;

      const cell = matrix[i][currentCol];
      if (
        i === rowRandom ||
        cell.classList.contains("source") ||
        cell.classList.contains("target")
      )
        continue;
      wallToAnimate.push(cell);
    }

    if (rowEnd - rowStart > currentCol - 2 - colStart) {
      recursiveDivisionMaze(
        rowStart,
        rowEnd,
        colStart,
        currentCol - 2,
        "horizontal",
        surroundingWalls
      );
    } else {
      recursiveDivisionMaze(
        rowStart,
        rowEnd,
        colStart,
        currentCol - 2,
        orientation,
        surroundingWalls
      );
    }
    if (rowEnd - rowStart > colEnd - (currentCol + 2)) {
      recursiveDivisionMaze(
        rowStart,
        rowEnd,
        currentCol + 2,
        colEnd,
        "horizontal",
        surroundingWalls
      );
    } else {
      recursiveDivisionMaze(
        rowStart,
        rowEnd,
        currentCol + 2,
        colEnd,
        orientation,
        surroundingWalls
      );
    }
  }
}

let searchToAnimate;
let pathToAnimate;
const DFS_visited = new Set();

if (visualizeBtn) {
  visualizeBtn.addEventListener("click", () => {
    clearPath();
    searchToAnimate = [];
    pathToAnimate = [];
    DFS_visited.clear();

    switch (algorithm) {
      case "":
      case "BFS":
        BFS();
        break;
      case "A*":
        Astar();
        break;
      case "Greedy":
        greedy();
        break;
      case "Bi-Directional":
        biDirectional();
        break;
      case "Dijkstra's":
        Dijkstra();
        break;
      case "DFS":
        if (DFS(source_Cordinate))
          pathToAnimate.push(matrix[source_Cordinate.x][source_Cordinate.y]);
        break;
      default:
        BFS();
        break;
    }
    animate(searchToAnimate, "visited", delay);
  });
}

// =====================================================
// ======================= BFS ========================
// =====================================================

function BFS() {
  const queue = [];
  const visited = new Set();
  const parent = new Map();
  queue.push(source_Cordinate);
  visited.add(`${source_Cordinate.x}-${source_Cordinate.y}`);

  while (queue.length > 0) {
    const current = queue.shift();
    searchToAnimate.push(matrix[current.x][current.y]);

    if (current.x === target_Cordinate.x && current.y === target_Cordinate.y) {
      pathToAnimate = backtrack(parent, target_Cordinate).reverse();
      return;
    }

    const neighbours = getNeighbours(current);

    for (const neighbour of neighbours) {
      //shoulbe be valid
      //shouldn't be wall
      //shouldn't be visited
      const key = `${neighbour.x}-${neighbour.y}`;
      if (
        isValid(neighbour.x, neighbour.y) &&
        !matrix[neighbour.x][neighbour.y].classList.contains("wall") &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push(neighbour);
        parent.set(key, current);
      }
    }
  }
}

// =====================================================
// ===================== Animation =====================
// ====================================================

function animate(list, className, delay) {
  clearPreviousTimeouts();
  if (algorithm == "Bi-Directional" && className == "visited") {
    delay /= 1.5;
  }
  for (let i = 0; i < list.length; i++) {
    let timeoutId = setTimeout(
      () => {
        if (className === "wall") {
          list[i].setAttribute("class", `col ${className}`);
        } else {
          list[i].classList.remove("visited", "unvisited", "path");
          list[i].classList.add(className);
        }

        // After searching is done, animate the path
        if (className === "visited" && i === list.length - 1) {
          animate(pathToAnimate, "path", delay);
        }
      },
      className === "path" ? i * (delay + 20) : i * delay
    );

    timeoutIds.push(timeoutId);
  }
}

function backtrack(parents, target) {
  let arr = [];
  while (target) {
    arr.push(matrix[target.x][target.y]);
    if (target.x == source_Cordinate.x && target.y == source_Cordinate.y)
      return arr;
    target = parents.get(`${target.x}-${target.y}`);
  }
  return arr;
}

function getNeighbours(current) {
  return [
    { x: current.x + 1, y: current.y },
    { x: current.x - 1, y: current.y },
    { x: current.x, y: current.y + 1 },
    { x: current.x, y: current.y - 1 },
  ];
}

// =====================================================
// ================= Priority Queue ====================
// =====================================================

class PriorityQueue {
  constructor() {
    this.elements = [];
    this.length = 0;
  }

  push(data) {
    this.elements.push(data);
    this.length++;
    this.upHeapify(this.length - 1);
  }
  pop() {
    this.swap(0, this.length - 1);
    const popped = this.elements.pop();
    this.length--;
    this.downheapify(0);
    return popped;
  }

  upHeapify(i) {
    if (i === 0) return;

    const parent = Math.floor((i - 1) / 2);
    if (this.elements[i].cost < this.elements[parent].cost) {
      this.swap(parent, i);
      this.upHeapify(parent);
    }
  }
  downheapify(i) {
    const leftChild = 2 * i + 1;
    const rightChild = 2 * i + 2;
    let minNode = i;
    if (
      leftChild < this.length &&
      this.elements[leftChild].cost < this.elements[minNode].cost
    ) {
      minNode = leftChild;
    }
    if (
      rightChild < this.length &&
      this.elements[rightChild].cost < this.elements[minNode].cost
    ) {
      minNode = rightChild;
    }
    if (minNode !== i) {
      this.swap(minNode, i);
      this.downheapify(minNode);
    }
  }

  isEmpty() {
    return this.elements.length === 0;
  }
  swap(x, y) {
    [this.elements[x], this.elements[y]] = [this.elements[y], this.elements[x]];
  }
}

// =====================================================
// ===================== Dijkstra =====================
// =====================================================

function Dijkstra() {
  const pq = new PriorityQueue();
  const parent = new Map();

  const distance = [];

  for (let i = 0; i < row; i++) {
    const INF = [];

    for (let j = 0; j < col; j++) {
      INF.push(Infinity);
    }
    distance.push(INF);
  }

  distance[source_Cordinate.x][source_Cordinate.y] = 0;

  pq.push({ cordinate: source_Cordinate, cost: 0 });

  while (!pq.isEmpty()) {
    const { cordinate: current, cost: distanceSoFar } = pq.pop();
    searchToAnimate.push(matrix[current.x][current.y]);

    //you find the target
    if (current.x === target_Cordinate.x && current.y === target_Cordinate.y) {
      pathToAnimate = backtrack(parent, target_Cordinate).reverse();
      return;
    }

    const neighbours = getNeighbours(current);

    for (const neighbour of neighbours) {
      const key = `${neighbour.x}-${neighbour.y}`;

      if (
        isValid(neighbour.x, neighbour.y) &&
        !matrix[neighbour.x][neighbour.y].classList.contains("wall")
      ) {
        //Assuming edge weight = 1, between adjacent vertices
        const edgeWeight = 1;
        const distanceToNeighbour = distanceSoFar + edgeWeight;

        if (distanceToNeighbour < distance[neighbour.x][neighbour.y]) {
          distance[neighbour.x][neighbour.y] = distanceToNeighbour;
          pq.push({ cordinate: neighbour, cost: distanceToNeighbour });
          parent.set(key, current);
        }
      }
    }
  }
}

function heuristicValue(node) {
  return (
    Math.abs(node.x - target_Cordinate.x) +
    Math.abs(node.y - target_Cordinate.y)
  );
}

// =====================================================
// ====================== Greedy ====================
// =====================================================

function greedy() {
  const queue = new PriorityQueue();
  const visited = new Set();
  const parent = new Map();

  queue.push({
    cordinate: source_Cordinate,
    cost: heuristicValue(source_Cordinate),
  });
  visited.add(`${source_Cordinate.x}-${source_Cordinate.y}`);

  while (queue.length > 0) {
    const { cordinate: current } = queue.pop();
    searchToAnimate.push(matrix[current.x][current.y]);

    if (current.x === target_Cordinate.x && current.y === target_Cordinate.y) {
      pathToAnimate = backtrack(parent, target_Cordinate).reverse();
      return;
    }

    const neighbours = getNeighbours(current);

    for (const neighbour of neighbours) {
      const key = `${neighbour.x}-${neighbour.y}`;

      if (
        isValid(neighbour.x, neighbour.y) &&
        !visited.has(key) &&
        !matrix[neighbour.x][neighbour.y].classList.contains("wall")
      ) {
        queue.push({ cordinate: neighbour, cost: heuristicValue(neighbour) });
        visited.add(key);
        parent.set(key, current);
      }
    }
  }
}

// =====================================================
// ================= A* Algorithm   ====================
// =====================================================

function Astar() {
  const queue = new PriorityQueue();
  const visited = new Set(); //closedset
  const queued = new Set(); //openset
  const parent = new Map();
  const gScore = [];

  for (let i = 0; i < row; i++) {
    const INF = [];
    for (let j = 0; j < col; j++) {
      INF.push(Infinity);
    }
    gScore.push(INF);
  }

  gScore[source_Cordinate.x][source_Cordinate.y] = 0;
  queue.push({
    cordinate: source_Cordinate,
    cost: heuristicValue(source_Cordinate),
  });
  visited.add(`${source_Cordinate.x}-${source_Cordinate.y}`);

  while (queue.length > 0) {
    const { cordinate: current } = queue.pop();
    searchToAnimate.push(matrix[current.x][current.y]);

    //you find the target
    if (current.x === target_Cordinate.x && current.y === target_Cordinate.y) {
      pathToAnimate = backtrack(parent, target_Cordinate).reverse();
      return;
    }

    visited.add(`${current.x}-${current.y}`);

    const neighbours = getNeighbours(current);

    for (const neighbour of neighbours) {
      const key = `${neighbour.x}-${neighbour.y}`;

      if (
        isValid(neighbour.x, neighbour.y) &&
        !visited.has(key) &&
        !queued.has(key) &&
        !matrix[neighbour.x][neighbour.y].classList.contains("wall")
      ) {
        //Assuming edge weight = 1, between adjacent vertices
        const edgeWeight = 1;
        const gScoreToNeighbour = gScore[current.x][current.y] + edgeWeight;
        const fScore = gScoreToNeighbour + heuristicValue(neighbour);

        if (gScoreToNeighbour < gScore[neighbour.x][neighbour.y]) {
          gScore[neighbour.x][neighbour.y] = gScoreToNeighbour;

          queue.push({ cordinate: neighbour, cost: fScore });
          queued.add(key); //openset

          parent.set(key, current);
        }
      }
    }
  }
}

// =====================================================
// ====================== DFS ==========================
// =====================================================

function DFS(current) {
  //base case
  if (current.x === target_Cordinate.x && current.y === target_Cordinate.y) {
    return true;
  }

  searchToAnimate.push(matrix[current.x][current.y]);
  DFS_visited.add(`${current.x}-${current.y}`);

  const neighbours = getNeighbours(current);

  for (const neighbour of neighbours) {
    if (
      isValid(neighbour.x, neighbour.y) &&
      !DFS_visited.has(`${neighbour.x}-${neighbour.y}`) &&
      !matrix[neighbour.x][neighbour.y].classList.contains("wall")
    ) {
      if (DFS(neighbour)) {
        pathToAnimate.push(matrix[neighbour.x][neighbour.y]);
        return true;
      }
    }
  }

  return false;
}

// =====================================================
// ================== B-iDirectional ==================
// =====================================================

function biDirectional() {
  const queue1 = [];
  const queue2 = [];
  const visited1 = new Set();
  const visited2 = new Set();
  const parent1 = new Map();
  const parent2 = new Map();

  queue1.push(source_Cordinate);
  queue2.push(target_Cordinate);
  visited1.add(`${source_Cordinate.x}-${source_Cordinate.y}`);
  visited2.add(`${target_Cordinate.x}-${target_Cordinate.y}`);

  while (queue1.length > 0 && queue2.length > 0) {
    const current1 = queue1.shift();
    const current2 = queue2.shift();

    searchToAnimate.push(matrix[current1.x][current1.y]);
    searchToAnimate.push(matrix[current2.x][current2.y]);

    // intersection detection
    if (visited1.has(`${current2.x}-${current2.y}`)) {
      pathToAnimate = backtrack(parent1, current2).reverse();
      let arr = backtrack(parent2, current2);
      pathToAnimate = pathToAnimate.concat(arr);
      return;
    }
    if (visited2.has(`${current1.x}-${current1.y}`)) {
      pathToAnimate = backtrack(parent1, current1).reverse();
      let arr = backtrack(parent2, current1);
      pathToAnimate = pathToAnimate.concat(arr);
      return;
    }

    const neighbour1 = getNeighbours(current1);
    const neighbour2 = getNeighbours(current2);

    visiteNeighbours(current1, neighbour1, visited1, parent1, queue1);
    visiteNeighbours(current2, neighbour2, visited2, parent2, queue2);
  }

  function visiteNeighbours(current, neighbours, visited, parent, queue) {
    for (const neighbour of neighbours) {
      const key = `${neighbour.x}-${neighbour.y}`;
      if (
        isValid(neighbour.x, neighbour.y) &&
        !matrix[neighbour.x][neighbour.y].classList.contains("wall") &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push(neighbour);
        parent.set(key, current);
      }
    }
  }
}

// ==============================================================
// ============== Window Resize Handler =========================
// ==============================================================

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const repaint = debounce(() => {
  renderBoard(width);
}, 250);

window.addEventListener("resize", repaint);
