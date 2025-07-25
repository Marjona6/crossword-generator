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
    this.puzzleNameInput = document.getElementById("puzzleName");
    this.generateBtn = document.getElementById("generateBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.regenerateBtn = document.getElementById("regenerateBtn");
    this.printBtn = document.getElementById("printBtn");
    this.downloadPdfBtn = document.getElementById("downloadPdfBtn");
    this.puzzleSection = document.getElementById("puzzleSection");
    this.crosswordGrid = document.getElementById("crosswordGrid");
    this.acrossClues = document.getElementById("acrossClues");
    this.downClues = document.getElementById("downClues");
    this.puzzleStats = document.getElementById("puzzleStats");
    this.clueInputSection = document.getElementById("clueInputSection");
    this.clueInputs = document.getElementById("clueInputs");
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    this.generateBtn.addEventListener("click", () => this.handleGenerate());
    this.clearBtn.addEventListener("click", () => this.handleClear());
    this.regenerateBtn.addEventListener("click", () => this.handleRegenerate());
    this.printBtn.addEventListener("click", () => this.handlePrint());
    this.downloadPdfBtn.addEventListener("click", () => this.handleDownloadPDF());
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
      // Show clue input section after first generation
      this.showClueInputs(words);
    } catch (error) {
      this.showError("Error generating puzzle: " + error.message);
    }
  }

  /**
   * Handle clear button click
   */
  handleClear() {
    this.wordInput.value = "";
    this.puzzleNameInput.value = "";
    this.hidePuzzle();
    this.hideClueInputs();
    this.wordInput.focus();
  }

  /**
   * Get puzzle name from input
   */
  getPuzzleName() {
    const name = this.puzzleNameInput.value.trim();
    return name || "Crossword Puzzle";
  }

  /**
   * Handle regenerate button click
   */
  handleRegenerate() {
    const words = Utils.parseWords(this.wordInput.value);
    const customClues = this.getCustomClues();
    this.generatePuzzle(words, customClues);
  }

  /**
   * Handle print button click
   */
  handlePrint() {
    window.print();
  }

  /**
   * Handle PDF download button click
   */
  handleDownloadPDF() {
    if (!this.currentPuzzle) {
      this.showError("No puzzle generated yet. Please generate a puzzle first.");
      return;
    }

    try {
      // Check if jsPDF is available
      if (typeof window.jspdf === "undefined") {
        console.error("jsPDF library not found");
        this.showError("PDF library not loaded. Please refresh the page and try again.");
        return;
      }

      this.generatePDF();
    } catch (error) {
      console.error("PDF generation error:", error);
      this.showError("PDF generation failed. Please try printing instead.");
    }
  }

  /**
   * Generate PDF document
   */
  generatePDF() {
    const { jsPDF } = window.jspdf;

    // Create new jsPDF document (8.5x11 inches)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "in",
      format: "letter",
    });

    // Set margins
    const margin = 0.75;
    const pageWidth = 8.5;
    const pageHeight = 11;
    const contentWidth = pageWidth - 2 * margin;

    // Calculate grid size and cell size
    const grid = this.currentPuzzle.grid;
    const gridRows = grid.length;
    const gridCols = grid[0].length;
    const maxCellSize = 0.3;
    const cellSize = Math.min(contentWidth / gridCols, maxCellSize);
    const gridWidth = gridCols * cellSize;
    const gridHeight = gridRows * cellSize;
    const gridX = margin + (contentWidth - gridWidth) / 2;

    // Calculate content heights
    const titleHeight = 0.4;
    const clueHeight = this.calculateClueHeight(contentWidth);
    const minSpacing = 0.2;

    // Calculate total height needed
    const totalHeight = titleHeight + gridHeight + minSpacing + clueHeight;

    // Check if we need multiple pages
    if (totalHeight > pageHeight - 2 * margin) {
      // First page: Title and puzzle
      let y = margin + 0.3;

      // Add title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const title = this.getPuzzleName();
      const titleWidth = doc.getTextWidth(title);
      const titleX = margin + (contentWidth - titleWidth) / 2;
      doc.text(title, titleX, y);
      y += titleHeight;

      // Draw puzzle grid
      this.drawGridOnPDF(doc, grid, gridX, y, cellSize);
      y += gridHeight + minSpacing;

      // Add new page for clues
      doc.addPage();

      // Second page: Clues
      y = margin + 0.3;

      // Add clues title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const cluesTitle = "Crossword Clues";
      const cluesTitleWidth = doc.getTextWidth(cluesTitle);
      const cluesTitleX = margin + (contentWidth - cluesTitleWidth) / 2;
      doc.text(cluesTitle, cluesTitleX, y);
      y += titleHeight;

      // Add clues
      this.addCluesToPDF(doc, margin, y, contentWidth);
    } else {
      // Single page: Everything fits
      let y = margin + 0.3;

      // Add title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const title = this.getPuzzleName();
      const titleWidth = doc.getTextWidth(title);
      const titleX = margin + (contentWidth - titleWidth) / 2;
      doc.text(title, titleX, y);
      y += titleHeight;

      // Draw puzzle grid
      this.drawGridOnPDF(doc, grid, gridX, y, cellSize);
      y += gridHeight + minSpacing;

      // Add clues
      this.addCluesToPDF(doc, margin, y, contentWidth);
    }

    // Save the PDF
    doc.save("crossword-puzzle.pdf");
  }

  /**
   * Draw grid on PDF
   */
  drawGridOnPDF(doc, grid, startX, startY, cellSize) {
    const clueNumbers = this.getClueNumbers();

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;
        const cellValue = grid[row][col];

        if (cellValue !== null) {
          // Only draw boxes for letter cells (not black cells)
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.01);
          doc.rect(x, y, cellSize, cellSize);

          // Check if this cell starts a word
          const cellKey = `${row}-${col}`;
          if (clueNumbers[cellKey]) {
            // Add clue number
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(clueNumbers[cellKey].toString(), x + 0.05, y + 0.15);
          }
        }
      }
    }
  }

  /**
   * Add clues to PDF
   */
  addCluesToPDF(doc, margin, startY, contentWidth) {
    let y = startY;
    const lineHeight = 0.25;
    const columnWidth = contentWidth / 2 - 0.2;

    // Across clues
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ACROSS", margin, y);
    y += lineHeight;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    this.currentPuzzle.across.forEach((clue) => {
      const text = `${clue.number}. ${clue.clue}`;
      const lines = this.wrapText(text, columnWidth, doc);

      lines.forEach((line) => {
        if (y > 10) {
          // Add new page if needed
          doc.addPage();
          y = margin + 0.3;
        }
        doc.text(line, margin, y);
        y += lineHeight * 0.8;
      });
    });

    // Down clues
    y += lineHeight;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DOWN", margin + contentWidth / 2, y);
    y += lineHeight;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    this.currentPuzzle.down.forEach((clue) => {
      const text = `${clue.number}. ${clue.clue}`;
      const lines = this.wrapText(text, columnWidth, doc);

      lines.forEach((line) => {
        if (y > 10) {
          // Add new page if needed
          doc.addPage();
          y = margin + 0.3;
        }
        doc.text(line, margin + contentWidth / 2, y);
        y += lineHeight * 0.8;
      });
    });
  }

  /**
   * Calculate height needed for clues
   */
  calculateClueHeight(contentWidth) {
    const lineHeight = 0.25;
    const columnWidth = contentWidth / 2 - 0.2;
    let totalLines = 2; // For "ACROSS" and "DOWN" headers

    // Count lines for across clues
    this.currentPuzzle.across.forEach((clue) => {
      const text = `${clue.number}. ${clue.clue}`;
      const lines = this.wrapText(text, columnWidth, null);
      totalLines += lines.length;
    });

    // Count lines for down clues
    this.currentPuzzle.down.forEach((clue) => {
      const text = `${clue.number}. ${clue.clue}`;
      const lines = this.wrapText(text, columnWidth, null);
      totalLines += lines.length;
    });

    return totalLines * lineHeight;
  }

  /**
   * Wrap text to fit within width
   */
  wrapText(text, maxWidth, doc) {
    if (!doc) {
      // Estimate line count for height calculation
      const avgCharWidth = 0.06; // Approximate character width
      const charsPerLine = Math.floor(maxWidth / avgCharWidth);
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        if ((currentLine + word).length <= charsPerLine) {
          currentLine += (currentLine ? " " : "") + word;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines;
    }

    // Actual text wrapping for PDF
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const testWidth = doc.getTextWidth(testLine);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Show clue input section
   * @param {string[]} words - Words to create clue inputs for
   */
  showClueInputs(words) {
    this.clueInputs.innerHTML = "";

    words.forEach((word) => {
      const clueItem = document.createElement("div");
      clueItem.className = "clue-input-item";
      clueItem.innerHTML = `
        <div class="clue-word">${word}</div>
        <input type="text" class="clue-input-field" 
               placeholder="Enter clue for '${word}'" 
               data-word="${word}">
      `;
      this.clueInputs.appendChild(clueItem);
    });

    this.clueInputSection.style.display = "block";
  }

  /**
   * Hide clue input section
   */
  hideClueInputs() {
    this.clueInputSection.style.display = "none";
    this.clueInputs.innerHTML = "";
  }

  /**
   * Get custom clues from input fields
   * @returns {Object} Object mapping words to their custom clues
   */
  getCustomClues() {
    const clues = {};
    const clueInputs = this.clueInputs.querySelectorAll(".clue-input-field");

    clueInputs.forEach((input) => {
      const word = input.dataset.word;
      const clue = input.value.trim();
      if (clue) {
        clues[word] = clue;
      }
    });

    return clues;
  }

  /**
   * Apply custom clues to the puzzle
   * @param {Object} customClues - Object mapping words to their custom clues
   */
  applyCustomClues(customClues) {
    // Update across clues
    this.currentPuzzle.across.forEach((word) => {
      if (customClues[word.word]) {
        word.clue = customClues[word.word];
      }
    });

    // Update down clues
    this.currentPuzzle.down.forEach((word) => {
      if (customClues[word.word]) {
        word.clue = customClues[word.word];
      }
    });
  }

  /**
   * Generate and display the puzzle
   * @param {string[]} words - Words to use for the puzzle
   * @param {Object} customClues - Optional custom clues for words
   */
  generatePuzzle(words, customClues = {}) {
    const generator = new CrosswordGenerator();
    this.currentPuzzle = generator.generate(words);

    // Apply custom clues if provided
    if (Object.keys(customClues).length > 0) {
      this.applyCustomClues(customClues);
    }

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
          // Don't show the letters - leave cell blank for puzzle solving
          // cell.textContent = cellValue.toUpperCase();

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
        words.push({ ...word, isHorizontal: true });
      }
    });

    // Check down words
    this.currentPuzzle.down.forEach((word) => {
      if (word.col === col && row >= word.row && row < word.row + word.word.length) {
        words.push({ ...word, isHorizontal: false });
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
    this.hideClueInputs();
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
