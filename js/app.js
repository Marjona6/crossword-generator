/**
 * Main application entry point
 */

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the UI controller
  const uiController = new UIController();

  // Add some sample words to help users get started
  const sampleWords = ["javascript", "html", "css", "programming", "computer", "algorithm", "function", "variable", "database", "network"];

  // Set sample words in the textarea
  const wordInput = document.getElementById("wordInput");
  wordInput.value = sampleWords.join("\n");

  // Add a helpful message
  console.log("Crossword Puzzle Generator loaded successfully!");
  console.log('Enter your words and click "Generate Crossword" to create a puzzle.');
  console.log("You can also press Ctrl+Enter to generate the puzzle.");

  // Focus on the input field
  wordInput.focus();
});
