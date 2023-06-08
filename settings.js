document.addEventListener('DOMContentLoaded', function() {
  // Get the checkbox element
  const highlightingCheckbox = document.getElementById('highlightingCheckbox');

  // Load the stored value and set the checkbox state accordingly
  chrome.storage.sync.get(['highlightingEnabled'], function (result) {
    highlightingCheckbox.checked = result.highlightingEnabled ?? true;
  });

  // Add an event listener to listen for checkbox changes
  highlightingCheckbox.addEventListener('change', function () {
    // Update the storage value
    chrome.storage.sync.set({ highlightingEnabled: highlightingCheckbox.checked });
  });
});
