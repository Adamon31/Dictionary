document.addEventListener('DOMContentLoaded', function() {
  var searchBox = document.getElementById('search-box');
  var searchButton = document.getElementById('search-button');
  var searchTabButton = document.getElementById('searchTabButton');
  var settingsTabButton = document.getElementById('settingsTabButton');
  var searchTabContent = document.getElementById('searchTab');
  var settingsTabContent = document.getElementById('settingsTab');

  // Add event listeners for tab buttons
  searchTabButton.addEventListener('click', function() {
    showTab('searchTab');
  });

  settingsTabButton.addEventListener('click', function() {
    showTab('settingsTab');
  });

  // Function to switch between tabs
  function showTab(tabId) {
    // Hide all tab contents
    searchTabContent.classList.remove('active');
    settingsTabContent.classList.remove('active');

    // Show the selected tab content
    if (tabId === 'searchTab') {
      searchTabContent.classList.add('active');
    } else if (tabId === 'settingsTab') {
      settingsTabContent.classList.add('active');
    }
  }

  // Initialize the search tab as active
  showTab('searchTab');
  // Add event listeners
  searchBox.addEventListener('input', handleInput);
  searchButton.addEventListener('click', handleSearch);

  // Enable pressing Enter to search
  searchBox.addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      handleSearch();
    }
  });

  // Fetch dictionary.json and store the words for autofill
  var dictionaryWords = [];
  fetch(chrome.runtime.getURL('dictionary.json'))
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      dictionaryWords = Object.keys(data);
    })
    .catch(function(error) {
      console.error('An error occurred while fetching the local dictionary:', error);
    });

// Handle input in the search box
function handleInput(event) {
  var query = event.target.value.trim().toLowerCase(); // Convert the query to lowercase
  if (query.length > 0) {
    // Autofill if the query matches any word in dictionary.json
    var autoCompleteWords = dictionaryWords.filter(function(word) {
      return word.toLowerCase().startsWith(query); // Convert the word to lowercase
    });
    if (autoCompleteWords.length > 0) {
      displayAutoComplete(autoCompleteWords);
    } else {
      clearAutoComplete();
    }
  } else {
    clearAutoComplete();
  }
}

// Perform the word search
function searchDefinition(query) {
  fetch(chrome.runtime.getURL('dictionary.json'))
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      var lowercaseQuery = query.toLowerCase(); // Convert the query to lowercase
      var matchingWords = Object.keys(data).filter(function(word) {
        return word.toLowerCase() === lowercaseQuery; // Compare lowercase word with lowercase query
      });

      if (matchingWords.length > 0) {
        var results = matchingWords.map(function(word) {
          return { word: word, definition: data[word] };
        });
        displayResults(results);
      } else {
        searchAPI(query);
      }
    })
    .catch(function(error) {
      console.error('An error occurred while fetching the local dictionary:', error);
      searchAPI(query);
    });
}



  // Handle search button click
  function handleSearch() {
    var query = searchBox.value.trim();
    if (query.length > 0) {
      searchDefinition(query);
    } else {
      clearResults();
    }
  }


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
// Search the API for word definition
function searchAPI(query) {
  var apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/' + query;
  fetch(apiUrl)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      var definitions = data[0]?.meanings[0]?.definitions;
      if (definitions && definitions.length > 0) {
        var definition = definitions[0].definition;
        var example = definitions[0].example || null;
        displayResults([{ word: query, definition: definition, example: example }]);
      } else {
        displayNoResults();
      }
    })
    .catch(function(error) {
      console.error('An error occurred while fetching the definition:', error);
      displayNoResults();
    });
}


  // Display autocomplete suggestions
  function displayAutoComplete(words) {
    var autoCompleteContainer = document.getElementById('autocomplete-container');
    autoCompleteContainer.innerHTML = '';

    words.forEach(function(word) {
      var autoCompleteItem = document.createElement('div');
      autoCompleteItem.classList.add('autocomplete-item');
      autoCompleteItem.textContent = word;
      autoCompleteItem.addEventListener('click', function() {
        searchBox.value = word;
        handleSearch();
      });

      autoCompleteContainer.appendChild(autoCompleteItem);
    });
  }

  // Clear autocomplete suggestions
  function clearAutoComplete() {
    var autoCompleteContainer = document.getElementById('autocomplete-container');
    autoCompleteContainer.innerHTML = '';
  }

// Display search results
function displayResults(results) {
  var resultContainer = document.getElementById('results-container');
  resultContainer.innerHTML = '';

  results.forEach(function(result) {
    var resultItem = document.createElement('div');
    resultItem.classList.add('result-item');

    var word = document.createElement('div');
    word.classList.add('word');
    word.textContent = result.word;

    var definitionTitle = document.createElement('div');
    definitionTitle.classList.add('title');
    definitionTitle.textContent = 'Definition:';

    var definition = document.createElement('div');
    definition.classList.add('definition');
    definition.innerHTML = convertURLsToLinks(result.definition);

    var exampleTitle = document.createElement('div');
    exampleTitle.classList.add('title');
    exampleTitle.textContent = 'Usage:';

    var example = document.createElement('div');
    example.classList.add('example');
    example.innerHTML = result.example;

    resultItem.appendChild(word);
    resultItem.appendChild(definitionTitle);
    resultItem.appendChild(definition);
    if (result.example) {
      resultItem.appendChild(exampleTitle);
      resultItem.appendChild(example);
    }
    resultContainer.appendChild(resultItem);
  });
}

// Convert URLs within the definition text to clickable links
function convertURLsToLinks(text) {
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function(url) {
    return '<a href="' + url + '" target="_blank">link</a>'; // Replace the URL with "link"
  });
}


  // Display "No results found" message
  function displayNoResults() {
    var resultContainer = document.getElementById('results-container');
    resultContainer.innerHTML = 'No results found.';
  }

  // Clear search results
  function clearResults() {
    var resultContainer = document.getElementById('results-container');
    resultContainer.innerHTML = '';
  }
});
