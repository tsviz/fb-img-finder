// Facebook Image Search Client-side JavaScript

// Function to handle loading photos directly in the page
function loadPhotosDirectly(keyword, groups) {
  const photoResults = document.getElementById('photoResults');
  const photosContainer = document.getElementById('photosContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const noResultsMessage = document.getElementById('noResultsMessage');
  
  // Show photo results section and loading indicator
  photoResults.style.display = 'block';
  loadingIndicator.style.display = 'block';
  noResultsMessage.style.display = 'none';
  photosContainer.innerHTML = ''; // Clear previous results
  
  // Make AJAX request to load photos
  fetch('/load-photos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      keyword: keyword,
      groups: groups
    })
  })
  .then(response => response.json())
  .then(data => {
    loadingIndicator.style.display = 'none';
    
    if (data.success) {
      if (data.photos.length === 0) {
        noResultsMessage.style.display = 'block';
      } else {
        // Render photos with filtering options
        data.photos.forEach(photo => {
          const photoCard = document.createElement('div');
          photoCard.className = 'photo-card';
          photoCard.style.border = '1px solid #dddfe2';
          photoCard.style.borderRadius = '8px';
          photoCard.style.overflow = 'hidden';
          photoCard.style.backgroundColor = '#fff';
          photoCard.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
          
          // Calculate relevance bar width based on score (0-100%)
          const relevancePercent = Math.round(photo.relevanceScore * 100);
          const relevanceColor = relevancePercent > 85 ? '#42b72a' : 
                               relevancePercent > 70 ? '#1877f2' : '#f5bb41';
          
          // Create the photo card HTML content
          photoCard.innerHTML = createPhotoCardHTML(photo, relevancePercent, relevanceColor);
          
          photosContainer.appendChild(photoCard);
        });
        
        // Add filter controls
        addFilterControls(photosContainer, data);
      }
    } else {
      noResultsMessage.textContent = data.message || 'Failed to load photos.';
      noResultsMessage.style.display = 'block';
    }
  })
  .catch(error => {
    console.error('Error:', error);
    loadingIndicator.style.display = 'none';
    noResultsMessage.textContent = 'An error occurred while loading photos.';
    noResultsMessage.style.display = 'block';
  });
}

// Function to create HTML for a photo card
function createPhotoCardHTML(photo, relevancePercent, relevanceColor) {
  return `
    <img src="${photo.imageUrl}" alt="Photo from ${photo.groupName}" style="width: 100%; height: 200px; object-fit: cover;">
    <div style="padding: 12px;">
      <div style="font-size: 14px; margin-bottom: 5px; color: #65676b;">
        ${photo.groupName}
      </div>
      <p style="margin: 8px 0; font-size: 14px;">${photo.caption}</p>
      <div style="display: flex; align-items: center; margin: 8px 0;">
        <span style="font-size: 12px; color: #65676b; margin-right: 5px;">Relevance:</span>
        <div style="flex-grow: 1; height: 6px; background: #e4e6eb; border-radius: 3px;">
          <div style="height: 100%; width: ${relevancePercent}%; background: ${relevanceColor}; border-radius: 3px;"></div>
        </div>
        <span style="font-size: 12px; color: #65676b; margin-left: 5px;">${relevancePercent}%</span>
      </div>
      <a href="${photo.postUrl}" target="_blank" 
         style="display: block; text-align: center; padding: 8px 0; background: #e4e6eb; 
                color: #050505; text-decoration: none; border-radius: 4px; 
                margin-top: 8px; font-size: 14px;">
        View on Facebook
      </a>
    </div>
  `;
}

// Function to add filter controls above the photos container
function addFilterControls(photosContainer, data) {
  const filterControls = document.createElement('div');
  filterControls.style.marginBottom = '15px';
  filterControls.style.padding = '10px';
  filterControls.style.backgroundColor = '#f0f2f5';
  filterControls.style.borderRadius = '8px';
  
  filterControls.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <div>
        <label style="margin-right: 10px; font-size: 14px;">
          <strong>Filter by relevance:</strong>
        </label>
        <input type="range" id="relevanceFilter" min="0" max="100" value="70" style="width: 150px;">
        <span id="relevanceValue" style="margin-left: 5px; font-size: 14px;">70%</span>
      </div>
      <span style="color: #65676b; font-size: 14px;">
        Showing ${data.photos.length} of ${data.totalPhotos} photos
      </span>
    </div>
  `;
  
  photosContainer.insertAdjacentElement('beforebegin', filterControls);
  
  // Add relevance filter functionality
  const relevanceFilter = document.getElementById('relevanceFilter');
  const relevanceValue = document.getElementById('relevanceValue');
  const noResultsMessage = document.getElementById('noResultsMessage');
  
  relevanceFilter.addEventListener('input', function() {
    const threshold = this.value;
    relevanceValue.textContent = threshold + '%';
    
    // Filter photos based on relevance threshold
    const photoCards = photosContainer.querySelectorAll('.photo-card');
    let visibleCount = 0;
    
    photoCards.forEach((card, index) => {
      const photoRelevance = data.photos[index].relevanceScore * 100;
      if (photoRelevance >= threshold) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // Show no results message if all photos are filtered out
    if (visibleCount === 0) {
      noResultsMessage.style.display = 'block';
      noResultsMessage.textContent = 'No photos match the current relevance filter.';
    } else {
      noResultsMessage.style.display = 'none';
    }
  });
}

// Function to open multiple tabs for group photo searches
function openMultipleTabs(links) {
  for (const link of links) {
    window.open(link, '_blank');
  }
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
  
  // Handle "Load Photos Directly" button on results page
  const loadPhotosBtn = document.getElementById('loadPhotosBtn');
  if (loadPhotosBtn) {
    loadPhotosBtn.addEventListener('click', function() {
      // These values will be filled in by server-side templating
      const keyword = window.searchKeyword || '';
      const groups = window.searchGroups || [];
      
      loadPhotosDirectly(keyword, groups);
    });
  }
  
  // Handle "Open Multiple Tabs" button
  const openMultipleTabsBtn = document.getElementById('openMultipleTabsBtn');
  if (openMultipleTabsBtn) {
    openMultipleTabsBtn.addEventListener('click', function() {
      // These values will be filled in by server-side templating
      const links = window.groupPhotoLinks || [];
      openMultipleTabs(links);
    });
  }
});
