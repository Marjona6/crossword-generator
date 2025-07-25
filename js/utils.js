/**
 * Utility functions for the crossword puzzle generator
 */

class Utils {
  /**
   * Parse and clean words from input text
   * @param {string} input - Raw input text
   * @returns {string[]} Array of cleaned words
   */
  static parseWords(input) {
    if (!input || typeof input !== "string") {
      return [];
    }

    // Split by newlines and commas, then clean each word
    const words = input
      .split(/[\n,]+/)
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0)
      .filter((word) => /^[a-z]+$/.test(word)); // Only letters

    // Remove duplicates while preserving order
    return [...new Set(words)];
  }

  /**
   * Validate if a word can be placed on the grid
   * @param {string} word - Word to validate
   * @param {number} row - Starting row position
   * @param {number} col - Starting column position
   * @param {boolean} isHorizontal - Whether the word is horizontal
   * @param {Array} grid - Current grid state
   * @returns {boolean} True if word can be placed
   */
  static canPlaceWord(word, row, col, isHorizontal, grid) {
    const wordLength = word.length;
    const gridRows = grid.length;
    const gridCols = grid[0].length;

    // Check if word fits within grid bounds
    if (isHorizontal) {
      if (col + wordLength > gridCols) return false;
    } else {
      if (row + wordLength > gridRows) return false;
    }

    // Check each position where the word would be placed
    for (let i = 0; i < wordLength; i++) {
      const currentRow = isHorizontal ? row : row + i;
      const currentCol = isHorizontal ? col + i : col;
      const currentCell = grid[currentRow][currentCol];
      const currentChar = word[i];

      // If cell is empty, we can place the word
      if (currentCell === null) continue;

      // If cell already has the same character, it's a valid intersection
      if (currentCell === currentChar) continue;

      // If cell has a different character, we can't place the word
      return false;
    }

    return true;
  }

  /**
   * Check if placing a word creates valid intersections and follows crossword rules
   * @param {string} word - Word to check
   * @param {number} row - Starting row position
   * @param {number} col - Starting column position
   * @param {boolean} isHorizontal - Whether the word is horizontal
   * @param {Array} grid - Current grid state
   * @returns {boolean} True if placement is valid
   */
  static hasValidWordBoundaries(word, row, col, isHorizontal, grid) {
    const wordLength = word.length;
    let hasIntersection = false;

    for (let i = 0; i < wordLength; i++) {
      const currentRow = isHorizontal ? row : row + i;
      const currentCol = isHorizontal ? col + i : col;
      const currentChar = word[i];

      // Check if this position already has a letter (intersection)
      if (grid[currentRow][currentCol] !== null) {
        // Must match the existing letter
        if (grid[currentRow][currentCol] !== currentChar) {
          return false;
        }
        hasIntersection = true;
        continue;
      }

      // Check for adjacent letters that would create invalid adjacency
      if (isHorizontal) {
        // For horizontal words, check above and below for adjacent letters
        const aboveRow = currentRow - 1;
        const belowRow = currentRow + 1;

        if (this.isValidPosition(aboveRow, currentCol, grid) && grid[aboveRow][currentCol] !== null) {
          // Check if there's a word above that would be adjacent
          if (!this.hasWordEndingAt(aboveRow, currentCol, grid, false)) {
            return false;
          }
        }

        if (this.isValidPosition(belowRow, currentCol, grid) && grid[belowRow][currentCol] !== null) {
          // Check if there's a word below that would be adjacent
          if (!this.hasWordEndingAt(belowRow, currentCol, grid, false)) {
            return false;
          }
        }
      } else {
        // For vertical words, check left and right for adjacent letters
        const leftCol = currentCol - 1;
        const rightCol = currentCol + 1;

        if (this.isValidPosition(currentRow, leftCol, grid) && grid[currentRow][leftCol] !== null) {
          // Check if there's a word to the left that would be adjacent
          if (!this.hasWordEndingAt(currentRow, leftCol, grid, true)) {
            return false;
          }
        }

        if (this.isValidPosition(currentRow, rightCol, grid) && grid[currentRow][rightCol] !== null) {
          // Check if there's a word to the right that would be adjacent
          if (!this.hasWordEndingAt(currentRow, rightCol, grid, true)) {
            return false;
          }
        }
      }

      // Check for valid intersections (letters that connect to existing words)
      const adjacentPositions = this.getAdjacentPositions(currentRow, currentCol, isHorizontal);
      for (const [adjRow, adjCol] of adjacentPositions) {
        if (this.isValidPosition(adjRow, adjCol, grid) && grid[adjRow][adjCol] !== null) {
          hasIntersection = true;
        }
      }
    }

    return hasIntersection;
  }

  /**
   * Get adjacent positions to a cell (excluding the word direction)
   * @param {number} row - Row position
   * @param {number} col - Column position
   * @param {boolean} isHorizontal - Whether the word is horizontal
   * @returns {Array} Array of [row, col] positions
   */
  static getAdjacentPositions(row, col, isHorizontal) {
    const positions = [];

    if (isHorizontal) {
      // For horizontal words, check above and below
      positions.push([row - 1, col], [row + 1, col]);
    } else {
      // For vertical words, check left and right
      positions.push([row, col - 1], [row, col + 1]);
    }

    return positions;
  }

  /**
   * Check if a position is within grid bounds
   * @param {number} row - Row position
   * @param {number} col - Column position
   * @param {Array} grid - Grid to check against
   * @returns {boolean} True if position is valid
   */
  static isValidPosition(row, col, grid) {
    return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
  }

  /**
   * Check if there's a word ending at a specific position
   * @param {number} row - Row position
   * @param {number} col - Column position
   * @param {Array} grid - Grid to check
   * @param {boolean} isHorizontal - Whether to check for horizontal words
   * @returns {boolean} True if there's a word ending at this position
   */
  static hasWordEndingAt(row, col, grid, isHorizontal) {
    if (isHorizontal) {
      // Check for horizontal word ending at this position
      let wordLength = 0;
      let currentCol = col;

      // Count backwards to find word start
      while (currentCol >= 0 && grid[row][currentCol] !== null) {
        wordLength++;
        currentCol--;
      }

      // Check if this forms a complete word (at least 2 letters)
      return wordLength >= 2;
    } else {
      // Check for vertical word ending at this position
      let wordLength = 0;
      let currentRow = row;

      // Count backwards to find word start
      while (currentRow >= 0 && grid[currentRow][col] !== null) {
        wordLength++;
        currentRow--;
      }

      // Check if this forms a complete word (at least 2 letters)
      return wordLength >= 2;
    }
  }

  /**
   * Calculate grid dimensions based on words
   * @param {string[]} words - Array of words
   * @returns {Object} Object with rows and cols properties
   */
  static calculateGridSize(words) {
    if (!words || words.length === 0) {
      return { rows: 20, cols: 20 }; // Larger default size
    }

    const maxWordLength = Math.max(...words.map((word) => word.length));
    const totalWords = words.length;

    // Estimate grid size based on word count and length with more generous spacing
    const baseSize = Math.max(maxWordLength + 4, Math.ceil(Math.sqrt(totalWords * maxWordLength * 3)));
    const estimatedSize = Math.floor(baseSize * 1.5); // Add 50% more space

    return {
      rows: Math.min(estimatedSize, 50), // Increased cap for larger puzzles
      cols: Math.min(estimatedSize, 50),
    };
  }

  /**
   * Generate a simple clue for a word
   * @param {string} word - Word to generate clue for
   * @returns {string} Generated clue
   */
  static generateClue(word) {
    // Simple clue generation - can be enhanced later
    return `A ${word.length}-letter word`;
  }

  /**
   * Deep clone an object or array
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }
}
