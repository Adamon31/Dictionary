let dictionary;
let activePopup = null;
let highlightingEnabled;

chrome.storage.sync.get(['highlightingEnabled'], function (result) {
  highlightingEnabled = result.highlightingEnabled ?? true;
  initializeHighlighting();
});
fetch(chrome.runtime.getURL('dictionary.json'))
  .then(response => response.json())
  .then(data => {
    dictionary = data;
    initializeHighlighting();
  })
  .catch(error => {
    console.error('Error loading dictionary.json:', error);
  });

 function initializeHighlighting() {
    if (highlightingEnabled) {
      document.addEventListener('mouseup', handleHighlight);
    } else {
      document.removeEventListener('mouseup', handleHighlight);
    }
  }

  function handleHighlight(event) {
    const selection = window.getSelection().toString().trim();
    const words = selection.split(/\s+/);
  
    if (words.length > 4) {
      return; // Do nothing if more than 4 words are highlighted
    }
  
    if (selection && highlightingEnabled) {
      showDefinitionPopup(selection);
    } else {
      hidePopup();
    }
  }
  

function showDefinitionPopup(word) {
  const definition = dictionary[word];
  if (definition) {
    hidePopup(); // Hide any existing popup

    const popup = document.createElement('div');
    popup.className = 'definition-popup';

    const title = document.createElement('div');
    title.className = 'word';
    title.textContent = word;
    popup.appendChild(title);

    // Check if the definition contains a URL pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hasUrl = urlRegex.test(definition);

    if (hasUrl) {
      const definitionText = document.createElement('div');
      definitionText.className = 'definition-text';

      // Split the definition by URL patterns
      const parts = definition.split(urlRegex);

      parts.forEach((part, index) => {
        if (urlRegex.test(part)) {
          // Create an anchor tag for the URL
          const link = document.createElement('a');
          link.href = part;
          link.textContent = part;
          link.target = '_blank';
          definitionText.appendChild(link);
        } else {
          // Create a regular text node for other parts of the definition
          const textNode = document.createTextNode(part);
          definitionText.appendChild(textNode);
        }
      });

      popup.appendChild(definitionText);
    } else {
      const definitionText = document.createElement('div');
      definitionText.className = 'definition-text';
      definitionText.textContent = definition;
      popup.appendChild(definitionText);
    }

    const sourceLabel = document.createElement('div');
    sourceLabel.className = 'source-label';
    sourceLabel.textContent = 'Local Dictionary';

    popup.appendChild(sourceLabel);
    document.body.appendChild(popup);
    positionPopup(popup);

    activePopup = popup;
  } else {
    fetchDefinitionFromAPI(word);
  }
}


function fetchDefinitionFromAPI(word) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  fetch(apiUrl)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      const definition = data[0]?.meanings[0]?.definitions[0]?.definition;
      if (definition) {
        showApiDefinitionPopup(word, definition);
      } else {
        showNoDefinitionPopup(word);
      }
    })
    .catch(function(error) {
      console.error('An error occurred while fetching the definition:', error);
      showNoDefinitionPopup(word);
    });
}

function showApiDefinitionPopup(word, definition) {
  hidePopup(); // Hide any existing popup

  const popup = document.createElement('div');
  popup.className = 'definition-popup';

  const wordElement = document.createElement('div');
  wordElement.className = 'word';
  wordElement.textContent = word;

  const definitionElement = document.createElement('div');
  definitionElement.className = 'definition';
  definitionElement.textContent = definition;

  popup.appendChild(wordElement);
  popup.appendChild(definitionElement);

  const sourceLabel = document.createElement('div');
  sourceLabel.className = 'source-label';
  sourceLabel.textContent = 'From the web';

  popup.appendChild(sourceLabel);
  document.body.appendChild(popup);
  positionPopup(popup);

  activePopup = popup;
}


function showNoDefinitionPopup(word) {
  hidePopup(); // Hide any existing popup

  const popup = document.createElement('div');
  popup.className = 'definition-popup';

  const noDefinitionMessage = document.createElement('div');
  noDefinitionMessage.className = 'no-definition-message';
  noDefinitionMessage.textContent = `No definition found for '${word}'`;

  const reportLink = document.createElement('a');
  reportLink.className = 'report-link';
  reportLink.href = `https://example.com/report?word=${word}`;
  reportLink.target = '_blank';
  reportLink.textContent = 'Report';

  popup.appendChild(noDefinitionMessage);
  popup.appendChild(reportLink);

  document.body.appendChild(popup);
  positionPopup(popup);

  activePopup = popup;
}



function searchAPI(word) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  fetch(apiUrl)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      const definitions = data[0]?.meanings[0]?.definitions;
      if (definitions && definitions.length > 0) {
        const definition = definitions[0].definition;
        displayAPIPopup(word, definition);
      } else {
        hidePopup();
      }
    })
    .catch(function(error) {
      console.error('An error occurred while fetching the definition:', error);
      hidePopup();
    });
}

function displayAPIPopup(word, definition) {
  hidePopup(); // Hide any existing popup

  const popup = document.createElement('div');
  popup.className = 'definition-popup';
  popup.textContent = `${word}: ${definition}`;
  document.body.appendChild(popup);
  positionPopup(popup);

  activePopup = popup;
}

function hidePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
}

function positionPopup(popup) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;

  const topOffset = rect.top + scrollTop - popup.offsetHeight - 10;
  const leftOffset = rect.left + scrollLeft;

  popup.style.top = `${topOffset}px`;
  popup.style.left = `${leftOffset}px`;
}


chrome.storage.sync.get(['highlightingEnabled'], function (result) {
  highlightingEnabled = result.highlightingEnabled ?? true;
});

chrome.storage.onChanged.addListener(function (changes) {
  if (changes.highlightingEnabled) {
    highlightingEnabled = changes.highlightingEnabled.newValue;
    if (!highlightingEnabled) {
      hidePopup(); // Hide the popup when highlighting is disabled
    }
    initializeHighlighting();
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'searchDefinition') {
    const word = request.word;
    const definition = dictionary[word] || null;
    sendResponse({ definition: definition });
  }
});
