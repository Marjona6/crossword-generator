/**
 * UI Controller for the crossword puzzle generator
 */

class UIController {
  constructor() {
    this.currentPuzzle = null;
    this.selectedWord = null;
    this.initializeElements();
    this.bindEvents();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.wordInput = document.getElementById("wordInput");
    this.generateBtn = document.getElementById("generateBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.puzzleSection = document.getElementById("puzzleSection");
    this.crosswordGrid = document.getElementById("crosswordGrid");
    this.acrossClues = document.getElementById("acrossClues");
    this.downClues = document.getElementById("downClues");
    this.puzzleStats = document.getElementById("puzzleStats");
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.generateBtn.addEventListener("click", () => this.handleGenerate());
    this.clearBtn.addEventListener("click", () => this.handleClear());
    this.wordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) {
        this.handleGenerate();
      }
    });
  }

  /**
   * Handle generate button click
   */
  handleGenerate() {
    const input = this.wordInput.value.trim();
    if (!input) {
      this.showError("Please enter some words to generate a crossword puzzle.");
      return;
    }

    const words = Utils.parseWords(input);
    if (words.length === 0) {
      this.showError("No valid words found. Please enter words containing only letters.");
      return;
    }

    if (words.length < 2) {
      this.showError("Please enter at least 2 words to generate a crossword puzzle.");
      return;
    }

    try {
      this.generatePuzzle(words);
    } catch (error) {
      this.showError("Error generating puzzle: " + error.message);
    }
  }

  /**
   * Handle clear button click
   */
  handleClear() {
    this.wordInput.value = "";
    this.hidePuzzle();
    this.wordInput.focus();
  }

  /**
   * Generate and display the puzzle
   * @param {string[]} words - Words to use for the puzzle
   */
  generatePuzzle(words) {
    const generator = new CrosswordGenerator();
    this.currentPuzzle = generator.generate(words);

    this.displayPuzzle();
    this.showSuccess(`Successfully generated puzzle with ${this.currentPuzzle.statistics.totalWords} words!`);
  }

  /**
   * Display the generated puzzle
   */
  displayPuzzle() {
    this.renderGrid();
    this.renderClues();
    this.renderStatistics();
    this.showPuzzle();
  }

  /**
   * Render the crossword grid
   */
  renderGrid() {
    this.crosswordGrid.innerHTML = "";

    if (!this.currentPuzzle || !this.currentPuzzle.grid) {
      return;
    }

    const grid = this.currentPuzzle.grid;
    const clueNumbers = this.getClueNumbers();

    for (let row = 0; row < grid.length; row++) {
      const gridRow = document.createElement("div");
      gridRow.className = "grid-row";

      for (let col = 0; col < grid[row].length; col++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";

        const cellValue = grid[row][col];

        if (cellValue === null) {
          cell.classList.add("black");
        } else {
          cell.textContent = cellValue.toUpperCase();

          // Add clue number if this cell starts a word
          const cellKey = `${row}-${col}`;
          if (clueNumbers[cellKey]) {
            const numberSpan = document.createElement("span");
            numberSpan.className = "cell-number";
            numberSpan.textContent = clueNumbers[cellKey];
            cell.appendChild(numberSpan);
          }
        }

        // Add click handler for word highlighting
        cell.addEventListener("click", () => this.handleCellClick(row, col));

        gridRow.appendChild(cell);
      }

      this.crosswordGrid.appendChild(gridRow);
    }
  }

  /**
   * Get clue numbers for cells that start words
   * @returns {Object} Map of cell positions to clue numbers
   */
  getClueNumbers() {
    const clueNumbers = {};

    if (!this.currentPuzzle) return clueNumbers;

    // Add across word numbers
    this.currentPuzzle.across.forEach((word) => {
      const key = `${word.row}-${word.col}`;
      clueNumbers[key] = word.number;
    });

    // Add down word numbers
    this.currentPuzzle.down.forEach((word) => {
      const key = `${word.row}-${word.col}`;
      if (!clueNumbers[key]) {
        clueNumbers[key] = word.number;
      }
    });

    return clueNumbers;
  }

  /**
   * Handle cell click for word highlighting
   * @param {number} row - Row of clicked cell
   * @param {number} col - Column of clicked cell
   */
  handleCellClick(row, col) {
    this.clearHighlights();

    // Find words that contain this cell
    const words = this.findWordsAtPosition(row, col);

    if (words.length > 0) {
      this.selectedWord = words[0];
      this.highlightWord(this.selectedWord);
      this.highlightClue(this.selectedWord);
    }
  }

  /**
   * Find words that contain a specific position
   * @param {number} row - Row position
   * @param {number} col - Column position
   * @returns {Array} Array of words at this position
   */
  findWordsAtPosition(row, col) {
    const words = [];

    if (!this.currentPuzzle) return words;

    // Check across words
    this.currentPuzzle.across.forEach((word) => {
      if (word.row === row && col >= word.col && col < word.col + word.word.length) {
        words.push({ ...word, direction: "across" });
      }
    });

    // Check down words
    this.currentPuzzle.down.forEach((word) => {
      if (word.col === col && row >= word.row && row < word.row + word.word.length) {
        words.push({ ...word, direction: "down" });
      }
    });

    return words;
  }

  /**
   * Highlight a word on the grid
   * @param {Object} word - Word to highlight
   */
  highlightWord(word) {
    const cells = this.crosswordGrid.querySelectorAll(".grid-cell");
    const gridCols = this.currentPuzzle.grid[0].length;

    for (let i = 0; i < word.word.length; i++) {
      const row = word.isHorizontal ? word.row : word.row + i;
      const col = word.isHorizontal ? word.col + i : word.col;
      const cellIndex = row * gridCols + col;

      if (cells[cellIndex]) {
        cells[cellIndex].classList.add("highlight");
      }
    }
  }

  /**
   * Highlight a clue in the clue list
   * @param {Object} word - Word whose clue to highlight
   */
  highlightClue(word) {
    const clueElements = document.querySelectorAll(".clue-item");
    clueElements.forEach((element) => {
      element.classList.remove("highlight");
      const number = element.querySelector(".clue-number").textContent;
      if (parseInt(number) === word.number) {
        element.classList.add("highlight");
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  /**
   * Clear all highlights
   */
  clearHighlights() {
    const cells = this.crosswordGrid.querySelectorAll(".grid-cell");
    cells.forEach((cell) => cell.classList.remove("highlight"));

    const clueElements = document.querySelectorAll(".clue-item");
    clueElements.forEach((element) => element.classList.remove("highlight"));

    this.selectedWord = null;
  }

  /**
   * Render the clues
   */
  renderClues() {
    this.renderClueList(this.acrossClues, this.currentPuzzle.across);
    this.renderClueList(this.downClues, this.currentPuzzle.down);
  }

  /**
   * Render a list of clues
   * @param {HTMLElement} container - Container element
   * @param {Array} clues - Array of clue objects
   */
  renderClueList(container, clues) {
    container.innerHTML = "";

    if (!clues || clues.length === 0) {
      container.innerHTML = "<p>No clues available</p>";
      return;
    }

    clues.forEach((clue) => {
      const clueElement = document.createElement("div");
      clueElement.className = "clue-item";
      clueElement.innerHTML = `
                <span class="clue-number">${clue.number}.</span>
                <span class="clue-text">${clue.clue}</span>
            `;

      // Add click handler to highlight word
      clueElement.addEventListener("click", () => {
        this.clearHighlights();
        this.selectedWord = { ...clue, isHorizontal: container === this.acrossClues };
        this.highlightWord(this.selectedWord);
        this.highlightClue(this.selectedWord);
      });

      container.appendChild(clueElement);
    });
  }

  /**
   * Render puzzle statistics
   */
  renderStatistics() {
    if (!this.currentPuzzle) return;

    const stats = this.currentPuzzle.statistics;
    const statsHtml = `
            <div class="stat-item">
                <span class="stat-label">Total Words:</span>
                <span class="stat-value">${stats.totalWords}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Across:</span>
                <span class="stat-value">${stats.acrossWords}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Down:</span>
                <span class="stat-value">${stats.downWords}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Grid Size:</span>
                <span class="stat-value">${stats.gridRows} × ${stats.gridCols}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Filled Cells:</span>
                <span class="stat-value">${stats.filledCells} / ${stats.totalCells}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Fill Percentage:</span>
                <span class="stat-value">${Math.round((stats.filledCells / stats.totalCells) * 100)}%</span>
            </div>
        `;

    this.puzzleStats.innerHTML = statsHtml;
  }

  /**
   * Show the puzzle section
   */
  showPuzzle() {
    this.puzzleSection.style.display = "block";
    this.puzzleSection.scrollIntoView({ behavior: "smooth" });
  }

  /**
   * Hide the puzzle section
   */
  hidePuzzle() {
    this.puzzleSection.style.display = "none";
    this.currentPuzzle = null;
    this.selectedWord = null;
  }

  /**
   * Show an error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    alert(message); // Simple alert for now, can be enhanced with a proper notification system
  }

  /**
   * Show a success message
   * @param {string} message - Success message to display
   */
  showSuccess(message) {
    console.log(message); // Simple console log for now, can be enhanced with a proper notification system
  }
}
