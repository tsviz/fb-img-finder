// Facebook Group Search Helper - Browser Extension

// Global variables
let savedGroups = [];
let activeSearchType = 'all';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation
  const searchTab = document.getElementById('searchTab');
  const manageGroupsTab = document.getElementById('manageGroupsTab');
  const searchContent = document.getElementById('searchContent');
  const manageGroupsContent = document.getElementById('manageGroupsContent');
  
  // Search form elements
  const searchForm = document.getElementById('searchForm');
  const searchKeywordInput = document.getElementById('searchKeyword');
  const searchTypeInput = document.getElementById('searchType');
  const searchOptions = document.querySelectorAll('.search-option');
  const openAllBtn = document.getElementById('openAllBtn');
  const searchResults = document.getElementById('searchResults');
  
  // Manage groups elements
  const groupInput = document.getElementById('groupInput');
  const addGroupBtn = document.getElementById('addGroupBtn');
  const savedGroupsContainer = document.getElementById('savedGroups');
  const importBtn = document.getElementById('importBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');
  
  // Initialize
  loadSavedGroups();
  
  // Tab navigation functionality
  searchTab.addEventListener('click', function() {
    switchTab('search');
  });
  
  manageGroupsTab.addEventListener('click', function() {
    switchTab('manageGroups');
  });
  
  // Search option selection
  searchOptions.forEach(option => {
    option.addEventListener('click', function() {
      searchOptions.forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      
      activeSearchType = this.getAttribute('data-type');
      searchTypeInput.value = activeSearchType;
    });
  });
  
  // Search form submission
  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const keyword = searchKeywordInput.value.trim();
    
    if (keyword && savedGroups.length > 0) {
      generateSearchLinks(keyword, activeSearchType);
      openAllBtn.style.display = 'block';
    } else if (!keyword) {
      alert('Please enter a search keyword');
    } else if (savedGroups.length === 0) {
      searchResults.innerHTML = '<div class="error">No saved groups found. Please add groups in the "Manage Groups" tab first.</div>';
      openAllBtn.style.display = 'none';
    }
  });
  
  // Open all search links
  openAllBtn.addEventListener('click', function() {
    const links = document.querySelectorAll(`.group-links .group-link[data-type="${activeSearchType}"]`);
    
    if (links.length > 0) {
      if (links.length > 5) {
        if (!confirm(`This will open ${links.length} tabs. Your browser may block some pop-ups. Continue?`)) {
          return;
        }
      }
      
      // Open all links with the current active search type using chrome.tabs API
      links.forEach(link => {
        const url = link.getAttribute('data-url');
        chrome.tabs.create({ url: url });
      });
    } else {
      alert('No search links found for the selected search type.');
    }
  });
  
  // Add group functionality
  addGroupBtn.addEventListener('click', function() {
    addGroup();
  });
  
  groupInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addGroup();
    }
  });
  
  // Import/Export functionality
  importBtn.addEventListener('click', function() {
    importFile.click();
  });
  
  importFile.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        importGroups(event.target.result);
      };
      reader.readAsText(file);
      // Reset file input
      importFile.value = '';
    }
  });
  
  exportBtn.addEventListener('click', function() {
    exportGroups();
  });
});

// Switch between tabs
function switchTab(tabId) {
  const searchTab = document.getElementById('searchTab');
  const manageGroupsTab = document.getElementById('manageGroupsTab');
  const searchContent = document.getElementById('searchContent');
  const manageGroupsContent = document.getElementById('manageGroupsContent');
  
  if (tabId === 'search') {
    searchTab.classList.add('active');
    manageGroupsTab.classList.remove('active');
    searchContent.classList.add('active');
    manageGroupsContent.classList.remove('active');
  } else {
    searchTab.classList.remove('active');
    manageGroupsTab.classList.add('active');
    searchContent.classList.remove('active');
    manageGroupsContent.classList.add('active');
  }
}

// Load saved groups from storage
function loadSavedGroups() {
  chrome.storage.local.get('facebookGroups', function(data) {
    if (data.facebookGroups && Array.isArray(data.facebookGroups)) {
      savedGroups = data.facebookGroups;
    } else {
      savedGroups = [];
    }
    
    displaySavedGroups();
  });
}

// Save groups to storage
function saveGroups() {
  chrome.storage.local.set({ 'facebookGroups': savedGroups }, function() {
    console.log('Groups saved to storage');
  });
  
  displaySavedGroups();
}

// Display saved groups in the UI
function displaySavedGroups() {
  const container = document.getElementById('savedGroups');
  
  if (savedGroups.length === 0) {
    container.innerHTML = '<div class="no-groups">No groups saved yet. Add your first Facebook group above.</div>';
    return;
  }
  
  container.innerHTML = '';
  
  savedGroups.forEach(function(group, index) {
    const groupElement = document.createElement('div');
    groupElement.className = 'saved-group';
    
    const nameElement = document.createElement('div');
    nameElement.className = 'saved-group-name';
    nameElement.textContent = group.name || group.id;
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', function() {
      savedGroups.splice(index, 1);
      saveGroups();
    });
    
    groupElement.appendChild(nameElement);
    groupElement.appendChild(deleteButton);
    container.appendChild(groupElement);
  });
}

// Parse group input and extract ID
function parseGroupInput(input) {
  input = input.trim();
  
  // Handle Facebook URL format
  if (input.includes('facebook.com/groups/')) {
    const match = input.match(/facebook\.com\/groups\/([^/?]+)/);
    if (match && match[1]) {
      return {
        id: match[1],
        name: match[1]
      };
    }
  }
  
  // Handle numeric ID or name
  return {
    id: input,
    name: input
  };
}

// Add a new group
function addGroup() {
  const input = document.getElementById('groupInput');
  const groupText = input.value.trim();
  
  if (!groupText) {
    return;
  }
  
  const group = parseGroupInput(groupText);
  
  // Check if group already exists
  const exists = savedGroups.some(g => g.id === group.id);
  
  if (!exists) {
    savedGroups.push(group);
    saveGroups();
    
    // Clear input
    input.value = '';
    input.focus();
  } else {
    alert('This group is already in your list');
  }
}

// Generate search links for saved groups
function generateSearchLinks(keyword, searchType) {
  const resultsContainer = document.getElementById('searchResults');
  resultsContainer.innerHTML = '';
  
  const encodedKeyword = encodeURIComponent(keyword);
  
  savedGroups.forEach(group => {
    const groupItem = document.createElement('div');
    groupItem.className = 'group-item';
    
    const groupName = document.createElement('div');
    groupName.className = 'group-name';
    groupName.textContent = group.name || group.id;
    groupItem.appendChild(groupName);
    
    const linksContainer = document.createElement('div');
    linksContainer.className = 'group-links';
    
    // All content search link
    const allContentLink = createSearchLink(group.id, encodedKeyword, '', 'All Content', 'all');
    linksContainer.appendChild(allContentLink);
    
    // Photos search link
    const photosLink = createSearchLink(group.id, encodedKeyword, '/photos', 'Photos', 'photos');
    linksContainer.appendChild(photosLink);
    
    // Videos search link
    const videosLink = createSearchLink(group.id, encodedKeyword, '/videos', 'Videos', 'videos');
    linksContainer.appendChild(videosLink);
    
    // Albums link
    const albumsLink = createSearchLink(group.id, encodedKeyword, '/media/albums', 'Albums', 'albums');
    linksContainer.appendChild(albumsLink);
    
    groupItem.appendChild(linksContainer);
    resultsContainer.appendChild(groupItem);
  });
}

// Create a search link element
function createSearchLink(groupId, keyword, suffix, label, type) {
  const link = document.createElement('a');
  link.className = 'group-link';
  link.setAttribute('data-type', type);
  
  // Base URL for search
  let searchUrl;
  
  if (type === 'all') {
    searchUrl = `https://www.facebook.com/groups/${groupId}/search/?q=${keyword}%20photos`;
  } else if (type === 'photos' || type === 'videos') {
    searchUrl = `https://www.facebook.com/groups/${groupId}${suffix}`;
  } else if (type === 'albums') {
    searchUrl = `https://www.facebook.com/groups/${groupId}${suffix}`;
  }
  
  // Store URL as data attribute instead of href
  link.setAttribute('data-url', searchUrl);
  link.textContent = label;
  
  // Use click handler to open in new tab without closing popup
  link.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: searchUrl });
    return false;
  });
  
  // Keep href for right-click "open in new tab" functionality
  link.href = searchUrl;
  link.setAttribute('target', '_blank');
  
  return link;
}

// Import groups from CSV or text file
function importGroups(fileContent) {
  const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  
  if (lines.length === 0) {
    alert('No valid groups found in the imported file');
    return;
  }
  
  let newGroups = 0;
  
  lines.forEach(line => {
    const group = parseGroupInput(line);
    const exists = savedGroups.some(g => g.id === group.id);
    
    if (!exists) {
      savedGroups.push(group);
      newGroups++;
    }
  });
  
  if (newGroups > 0) {
    saveGroups();
    alert(`Successfully imported ${newGroups} new group${newGroups === 1 ? '' : 's'}`);
    switchTab('manageGroups'); // Switch to the manage groups tab
  } else {
    alert('No new groups found to import');
  }
}

// Export groups to CSV file
function exportGroups() {
  if (savedGroups.length === 0) {
    alert('No groups to export');
    return;
  }
  
  // Create CSV content
  const csvContent = savedGroups.map(group => {
    if (group.id === group.name) {
      return group.id;
    } else {
      return `${group.id},${group.name}`;
    }
  }).join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'facebook_groups.csv';
  
  // Programmatically click to download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}