const express = require('express');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the search page with option to search all subscribed groups
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Facebook Group Image Search Helper</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #1877f2; }
        form { margin-bottom: 20px; }
        input, textarea, button { padding: 10px; margin-bottom: 10px; width: 100%; }
        button { background-color: #1877f2; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #166fe5; }
        .instructions { background-color: #f0f2f5; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .group-link { display: block; margin-bottom: 10px; padding: 10px; background-color: #e9ebee; border-radius: 5px; }
        .option-selector { display: flex; margin-bottom: 15px; }
        .option-selector label { margin-right: 20px; display: flex; align-items: center; }
        .option-selector input { width: auto; margin-right: 5px; }
        #groupsTextarea { display: none; }
        .search-all-link { display: block; padding: 15px; background-color: #e7f3ff; border-radius: 5px; margin-bottom: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Facebook Group Image Search Helper</h1>
        
        <form id="searchForm" method="POST" action="/search">
          <input type="text" name="keyword" placeholder="Enter search keyword (e.g., turtle)" required />
          
          <div class="option-selector">
            <label><input type="radio" name="searchType" value="allGroups" checked> Search all my subscribed groups</label>
            <label><input type="radio" name="searchType" value="specificGroups"> Search specific groups</label>
          </div>
          
          <textarea id="groupsTextarea" name="groups" placeholder="Enter Facebook group URLs or IDs (one per line)" rows="5"></textarea>
          
          <button type="submit">Generate Search Links</button>
        </form>
        
        <div class="instructions">
          <h3>How to use this tool:</h3>
          <ol>
            <li>Enter a keyword you want to search for</li>
            <li>Choose to search all your subscribed groups or specific groups</li>
            <li>If searching specific groups, enter the URLs or IDs</li>
            <li>Click "Generate Search Links"</li>
            <li>Click on the generated links to search each group</li>
          </ol>
          <p><strong>Note:</strong> This tool helps you search Facebook groups you're already a member of. It doesn't access Facebook directly but creates links for you to use.</p>
        </div>
      </div>

      <script>
        document.addEventListener('DOMContentLoaded', function() {
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
        });
      </script>
    </body>
    </html>
  `);
});

// Handle search requests by generating direct Facebook search URLs
app.post('/search', async (req, res) => {
  const keyword = encodeURIComponent(req.body.keyword);
  const searchType = req.body.searchType;
  
  let groupLinks = [];
  
  if (searchType === 'allGroups') {
    // Enhance keyword for photos if it doesn't contain "photos" already
    const enhancedKeyword = keyword.toLowerCase().includes('photo') ? 
      keyword : 
      `${keyword} photos`;
      
    // Enhanced search options for all groups using direct media paths
    groupLinks.push({
      name: 'All My Groups',
      searchLink: `https://www.facebook.com/groups/feed/?q=${keyword}`,
      photosLink: `https://www.facebook.com/groups/feed/photos/?q=${keyword}`,
      videosLink: `https://www.facebook.com/groups/feed/videos/?q=${keyword}`,
      filesLink: `https://www.facebook.com/groups/feed/files/?q=${keyword}`,
      photosFilteredLink: `https://www.facebook.com/groups/feed/photos/?q=${enhancedKeyword}`,
      allGroupsSearch: true,
      enhancedKeyword: enhancedKeyword
    });
  } else {
    // Process specific groups with optimized search patterns
    const groupsInput = req.body.groups;
    const groupsList = groupsInput.split('\n').map(group => group.trim()).filter(group => group);

    groupLinks = groupsList.map(group => {
      // Extract group ID from URL if it's a URL
      let groupId = group;
      if (group.includes('facebook.com/groups/')) {
        const match = group.match(/facebook\.com\/groups\/([0-9]+)/);
        if (match && match[1]) {
          groupId = match[1];
        } else {
          // For named groups like facebook.com/groups/groupname
          const parts = group.split('/');
          groupId = parts[parts.length - 1].split('?')[0];
        }
      }
      
      // Enhance keyword for photos if it doesn't contain "photos" already
      const enhancedKeyword = keyword.toLowerCase().includes('photo') ? 
        keyword : 
        `${keyword} photos`;
      
      // Return all search link options with optimized direct media paths
      // Notice the corrected URL structure for search links
      return {
        groupId: groupId,
        name: group,
        searchLink: `https://www.facebook.com/groups/${groupId}/search?q=${keyword}`,
        // Direct media paths for more accurate results
        photosLink: `https://www.facebook.com/groups/${groupId}/media/photos/?q=${keyword}`,
        videosLink: `https://www.facebook.com/groups/${groupId}/media/videos/?q=${keyword}`,
        albumsLink: `https://www.facebook.com/groups/${groupId}/media/albums/`,
        // Corrected URL format for the enhanced keyword search
        photosFilteredLink: `https://www.facebook.com/groups/${groupId}/search?q=${enhancedKeyword}`,
        allGroupsSearch: false,
        enhancedKeyword: enhancedKeyword
      };
    });
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Search Results for "${req.body.keyword}"</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #1877f2; }
        .group-box { border: 1px solid #dddfe2; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
        .group-title { margin-top: 0; color: #1877f2; }
        .btn { display: inline-block; padding: 8px 16px; background-color: #1877f2; color: white; 
               text-decoration: none; border-radius: 4px; margin-right: 10px; margin-bottom: 10px; }
        .btn:hover { background-color: #166fe5; }
        .btn-secondary { background-color: #e4e6eb; color: #050505; }
        .btn-secondary:hover { background-color: #d8dadf; }
        .note { background-color: #f0f2f5; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .back-link { display: block; margin-top: 20px; }
        .all-groups-box { background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
        .photo-search-help { margin-top: 10px; font-size: 0.9em; color: #65676b; }
        .search-section { margin-bottom: 15px; }
        .search-options { display: flex; flex-wrap: wrap; }
        .search-group { margin-bottom: 15px; }
        .search-group-title { font-size: 16px; margin-bottom: 5px; color: #65676b; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Search Links for "${req.body.keyword}"</h1>
        
        ${groupLinks.map(group => {
          if (group.allGroupsSearch) {
            return `
              <div class="all-groups-box">
                <h2>Search Across All Your Groups</h2>
                
                <div class="search-section">
                  <h3>Search Options:</h3>
                  <div class="search-options">
                    <a href="${group.searchLink}" target="_blank" class="btn">All Content</a>
                    <a href="${group.photosLink}" target="_blank" class="btn">Photos</a>
                    <a href="${group.videosLink}" target="_blank" class="btn">Videos</a>
                    <a href="${group.filesLink}" target="_blank" class="btn">Files</a>
                    <a href="${group.photosFilteredLink}" target="_blank" class="btn btn-secondary">Photos (Enhanced)</a>
                  </div>
                  <p class="photo-search-help">Each button will search for content with "${req.body.keyword}" across all your groups</p>
                  ${group.enhancedKeyword !== keyword ? 
                    `<p class="photo-search-help"><strong>Note:</strong> The "Photos (Enhanced)" button searches for "${decodeURIComponent(group.enhancedKeyword)}" to improve photo results</p>` : ''}
                </div>
                
                <div class="search-section">
                  <h3>Popular Facebook Groups:</h3>
                  <a href="https://www.facebook.com/groups/feed/" target="_blank" class="btn">View All My Groups</a>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="group-box">
                <h3 class="group-title">Group: ${group.name}</h3>
                
                <div class="search-group">
                  <div class="search-group-title">General Search:</div>
                  <div class="search-options">
                    <a href="${group.searchLink}" target="_blank" class="btn">All Content</a>
                  </div>
                </div>
                
                <div class="search-group">
                  <div class="search-group-title">Media Search (Direct Media Tabs):</div>
                  <div class="search-options">
                    <a href="${group.photosLink}" target="_blank" class="btn">Photos</a>
                    <a href="${group.videosLink}" target="_blank" class="btn">Videos</a>
                    <a href="${group.albumsLink}" target="_blank" class="btn btn-secondary">Albums</a>
                  </div>
                </div>
                
                <div class="search-group">
                  <div class="search-group-title">Alternative Search (Filtered Results):</div>
                  <div class="search-options">
                    <a href="${group.photosFilteredLink}" target="_blank" class="btn btn-secondary">Photos (Enhanced)</a>
                  </div>
                  ${group.enhancedKeyword !== keyword ? 
                    `<p class="photo-search-help"><strong>Note:</strong> The "Photos (Enhanced)" button searches for "${decodeURIComponent(group.enhancedKeyword)}" to improve results</p>` : ''}
                </div>
                
                <p class="photo-search-help">For best results with media searches, Facebook may require you to manually enter "${req.body.keyword}" in the search box on the media page.</p>
              </div>
            `;
          }
        }).join('')}
        
        <div class="note">
          <h3>Instructions:</h3>
          <ol>
            <li>Click on a search link to open Facebook with the search results</li>
            <li>For direct media searches (Photos/Videos tabs), you may need to manually type "${req.body.keyword}" in Facebook's search box</li>
            <li>The "Albums" button takes you to all albums in the group - you'll need to browse them manually</li>
            <li>The "Photos (Filtered)" option provides an alternative search method which may yield different results</li>
            <li>You must be logged into Facebook and a member of these groups to see results</li>
          </ol>
        </div>
        
        <a href="/" class="back-link">← Back to search form</a>
      </div>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});