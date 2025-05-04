// Facebook Image Search Client-side JavaScript

// Simplify the search functionality to only generate enhanced search links
const generateLinks = (keyword, groups) => {
  console.log('Generating enhanced search links for:', { keyword, groups });
  const linksContainer = document.getElementById('linksContainer');
  if (!linksContainer) {
    console.error('Links container not found');
    return;
  }

  linksContainer.innerHTML = ''; // Clear previous links

  groups.forEach(group => {
    const groupLink = document.createElement('a');
    groupLink.href = `https://www.facebook.com/groups/${group}/search/?q=${encodeURIComponent(keyword)}`;
    groupLink.target = '_blank';
    groupLink.textContent = `Search for "${keyword}" in group ${group}`;
    groupLink.className = 'btn';
    linksContainer.appendChild(groupLink);
  });
};

// Remove the 'Load Photos Directly' functionality
const loadPhotosBtn = document.getElementById('loadPhotosBtn');
if (loadPhotosBtn) {
  loadPhotosBtn.remove();
}

// Handle "Open Multiple Tabs" button
const openMultipleTabsBtn = document.getElementById('openMultipleTabsBtn');
if (openMultipleTabsBtn) {
  openMultipleTabsBtn.addEventListener('click', function() {
    try {
      console.log('Open Multiple Tabs clicked');
      
      // Check if we have the data
      if (!window.allSearchLinks) {
        console.error('Missing allSearchLinks data');
        alert('Sorry, unable to open multiple tabs. Search data is not available.');
        return;
      }
      
      // Get the photo links for all groups
      let linksToOpen = [];
      
      // For allGroups, get the photos link
      if (window.allSearchLinks.allGroups && window.allSearchLinks.allGroups.length > 0) {
        const allGroupsLink = window.allSearchLinks.allGroups[0].photos;
        if (allGroupsLink) linksToOpen.push(allGroupsLink);
        console.log('Added All Groups photo link:', allGroupsLink);
      }
      
      // For specific groups, get all photo links
      if (window.allSearchLinks.specificGroups && window.allSearchLinks.specificGroups.length > 0) {
        window.allSearchLinks.specificGroups.forEach(group => {
          if (group.photos) {
            linksToOpen.push(group.photos);
            console.log('Added specific group photo link:', group.photos);
          }
        });
      }
      
      console.log('Links to open:', linksToOpen);
      
      // Check if we have any links
      if (linksToOpen.length === 0) {
        alert('No photo links found to open.');
        return;
      }
      
      // Confirm with the user
      const confirmMessage = `This will open ${linksToOpen.length} tabs. Your browser may block some pop-ups. Continue?`;
      if (confirm(confirmMessage)) {
        // Open each link in a new tab
        linksToOpen.forEach(link => {
          if (link) {
            window.open(link, '_blank');
          }
        });
      }
    } catch (err) {
      console.error('Error opening multiple tabs:', err);
      alert('An error occurred when trying to open multiple tabs.');
    }
  });
}

// Initialize event listeners when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Handle search form on the home page
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    const radioButtons = document.querySelectorAll('input[name="searchType"]');
    const groupsTextarea = document.getElementById('groupsTextarea');
    
    function toggleTextarea() {
      const selectedValue = document.querySelector('input[name="searchType"]:checked').value;
      groupsTextarea.style.display = selectedValue === 'specificGroups' ? 'block' : 'none';
      
      if (selectedValue === 'specificGroups') {
        groupsTextarea.setAttribute('required', '');
      } else {
        groupsTextarea.removeAttribute('required');
      }
    }
    
    radioButtons.forEach(button => {
      button.addEventListener('change', toggleTextarea);
    });
    
    // Initialize on page load
    toggleTextarea();
  }
  
  // Store the search keyword from the page for use in various functions
  window.searchKeyword = document.querySelector('h1')?.textContent?.match(/Search Links for "([^"]+)"/)?.at(1) || '';
});

document.addEventListener('DOMContentLoaded', function () {
  const groupSourceRadios = document.querySelectorAll('input[name="groupSource"]');
  const groupsTextarea = document.getElementById('groupsTextarea');
  function updateGroupSource() {
    if (document.querySelector('input[name="groupSource"]:checked').value === 'manual') {
      groupsTextarea.style.display = '';
      groupsTextarea.required = true;
    } else {
      groupsTextarea.style.display = 'none';
      groupsTextarea.required = false;
    }
  }
  groupSourceRadios.forEach(radio => radio.addEventListener('change', updateGroupSource));
  updateGroupSource();
});
