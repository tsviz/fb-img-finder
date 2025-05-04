const express = require('express');
const app = express();
const port = 3000;
require('dotenv').config(); // Added for environment variables
const axios = require('axios');
const cheerio = require('cheerio'); // For HTML parsing
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const GROUPS_CSV_PATH = path.join(__dirname, 'groups.csv');
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the public directory

// Serve the search page with option to search specific groups
app.get('/', (req, res) => {
  let groupsCSV = '';
  if (fs.existsSync(GROUPS_CSV_PATH)) {
    groupsCSV = fs.readFileSync(GROUPS_CSV_PATH, 'utf8');
  }
  // Show upload status message if present
  let uploadMsg = '';
  if (req.query.uploadStatus === 'success') {
    uploadMsg = '<div class="upload-success">CSV uploaded and validated successfully.</div>';
  } else if (req.query.uploadStatus === 'fail') {
    uploadMsg = '<div class="upload-fail">CSV upload failed. Please upload a valid .csv file with at least one group name, ID, or group URL per line.</div>';
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Facebook Group Search Helper</title>
      <link rel="stylesheet" href="/styles.css">
      <style>
        .toggle-btn {
          padding: 10px 15px;
          margin-right: 10px;
          background-color: #e4e6eb;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .toggle-btn.active {
          background-color: #1877f2;
          color: white;
        }
        #manualEntryBox {
          border: 1px solid #ddd;
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          background: #f8f9fa;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Facebook Group Search Helper</h1>
        ${uploadMsg}
        
        <div class="toggle-container" style="margin-bottom: 20px;">
          <button type="button" id="csvToggle" class="toggle-btn active">Upload CSV</button>
          <button type="button" id="manualToggle" class="toggle-btn">Enter groups manually</button>
        </div>
        
        <form id="csvForm" method="POST" action="/upload-groups" enctype="multipart/form-data" style="margin-bottom:1em;">
          <label><strong>Upload groups CSV (one group name or ID per line):</strong></label>
          <input type="file" name="groupsCSV" accept=".csv">
          <button type="submit">Upload CSV</button>
        </form>
        
        <div id="manualEntryBox" style="display:none;">
          <label><strong>Enter group names or IDs (one per line):</strong></label>
          <textarea id="groupsTextarea" placeholder="Enter Facebook group URLs or IDs (one per line)" rows="5" style="width:100%;max-width:400px;display:block;margin:10px 0;"></textarea>
        </div>
        
        <form id="searchForm" method="POST" action="/search">
          <input type="hidden" name="groupSource" id="groupSourceInput" value="csv">
          <input type="text" name="keyword" placeholder="Enter search keyword (e.g., turtle)" required style="width:100%;max-width:400px;margin-bottom:15px;" />
          <input type="hidden" name="groups" id="groupsInput">
          <button type="submit">Generate Search Links</button>
        </form>
        
        <div class="instructions" style="margin-top:2em;">
          <ol>
            <li>Upload a CSV file with your group names/IDs (optional), or enter them manually</li>
            <li>Enter a keyword you want to search for</li>
            <li>Click "Generate Search Links"</li>
            <li>Click on the generated links to search each group</li>
          </ol>
        </div>
        
        <script>
          window.groupsCSV = ${JSON.stringify(groupsCSV)};
          document.addEventListener('DOMContentLoaded', function() {
            const csvToggle = document.getElementById('csvToggle');
            const manualToggle = document.getElementById('manualToggle');
            const csvForm = document.getElementById('csvForm');
            const manualEntryBox = document.getElementById('manualEntryBox');
            const groupsTextarea = document.getElementById('groupsTextarea');
            const groupSourceInput = document.getElementById('groupSourceInput');
            const groupsInput = document.getElementById('groupsInput');
            const searchForm = document.getElementById('searchForm');
            
            // Toggle between CSV and manual entry
            csvToggle.addEventListener('click', function() {
              csvToggle.classList.add('active');
              manualToggle.classList.remove('active');
              csvForm.style.display = 'block';
              manualEntryBox.style.display = 'none';
              groupSourceInput.value = 'csv';
            });
            
            manualToggle.addEventListener('click', function() {
              manualToggle.classList.add('active');
              csvToggle.classList.remove('active');
              csvForm.style.display = 'none';
              manualEntryBox.style.display = 'block';
              groupSourceInput.value = 'manual';
              groupsTextarea.focus();
            });
            
            // When form is submitted, copy textarea content to hidden input
            searchForm.addEventListener('submit', function(e) {
              if (groupSourceInput.value === 'manual') {
                groupsInput.value = groupsTextarea.value;
              } else {
                groupsInput.value = '';  // Use uploaded CSV
              }
            });
          });
        </script>
      </div>
    </body>
    </html>
  `);
});

// Handle search requests by generating direct Facebook search URLs
app.post('/search', async (req, res) => {
  const keyword = encodeURIComponent(req.body.keyword);
  const groupSource = req.body.groupSource;
  let groupsList = [];

  if (groupSource === 'csv') {
    // Read from stored CSV
    if (fs.existsSync(GROUPS_CSV_PATH)) {
      const csvContent = fs.readFileSync(GROUPS_CSV_PATH, 'utf8');
      console.log('CSV file content:', csvContent); // Debug log
      groupsList = csvContent.split(/\r?\n/).map(g => g.trim()).filter(Boolean);
      console.log('Parsed groups from CSV:', groupsList); // Debug log
    } else {
      console.log('CSV file not found at', GROUPS_CSV_PATH);
    }
  } else if (groupSource === 'manual') {
    // Read from textarea
    const groupsInput = req.body.groups || '';
    groupsList = groupsInput.split(/\r?\n/).map(g => g.trim()).filter(Boolean);
    console.log('Parsed groups from manual input:', groupsList); // Debug log
  }

  if (!groupsList.length) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>No Groups Found</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="container">
          <h1>No valid groups found</h1>
          <p style="color:red;">No valid groups found. Please upload a CSV with one group name, ID, or group URL per line, or enter them manually.<br>Example:<br><code>123456789012345</code><br><code>mygroupname</code><br><code>https://www.facebook.com/groups/123456789012345</code><br><code>https://www.facebook.com/groups/mygroupname</code></p>
          <a href="/" class="back-link">← Back to search form</a>
        </div>
      </body>
      </html>
    `);
  }

  const groupLinks = groupsList.map(group => {
    let groupId = group;
    if (group.includes('facebook.com/groups/')) {
      const match = group.match(/facebook\.com\/groups\/([0-9A-Za-z._-]+)/);
      if (match && match[1]) {
        groupId = match[1];
      } else {
        const parts = group.split('/');
        groupId = parts[parts.length - 1].split('?')[0];
      }
    }
    return {
      groupId: groupId,
      name: group,
      searchLink: `https://www.facebook.com/groups/${groupId}/search/?q=${keyword}%20photos`,
      photosLink: `https://www.facebook.com/groups/${groupId}/photos/`,
      videosLink: `https://www.facebook.com/groups/${groupId}/videos/`,
      albumsLink: `https://www.facebook.com/groups/${groupId}/media/albums/`
    };
  });

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Search Results for "${req.body.keyword}"</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div class="container">
        <h1>Search Links for "${req.body.keyword}"</h1>
        <button id="openAllGroupsBtn" class="btn" style="margin-bottom:20px;">Open All Groups in New Tabs</button>
        ${groupLinks.map(group => `
          <div class="group-box">
            <h3 class="group-title">Group: ${group.name}</h3>
            <div class="search-options">
              <a href="${group.searchLink}" target="_blank" class="btn">All Content</a>
              <a href="${group.photosLink}" target="_blank" class="btn">Photos</a>
              <a href="${group.videosLink}" target="_blank" class="btn">Videos</a>
              <a href="${group.albumsLink}" target="_blank" class="btn btn-secondary">Albums</a>
            </div>
          </div>
        `).join('')}
        <a href="/" class="back-link">← Back to search form</a>
      </div>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const openAllBtn = document.getElementById('openAllGroupsBtn');
          if (openAllBtn) {
            openAllBtn.addEventListener('click', function(e) {
              e.preventDefault();
              // Get all group search links (All Content)
              const links = Array.from(document.querySelectorAll('.group-box .search-options a.btn'))
                .filter(a => a.textContent.trim() === 'All Content')
                .map(a => a.href);
              if (links.length === 0) {
                alert('No group links found to open.');
                return;
              }
              if (confirm('This will open ' + links.length + ' tabs. Your browser may block some pop-ups. Continue?')) {
                // Open all links immediately in response to the click event
                links.forEach(link => window.open(link, '_blank'));
              }
            });
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});

// New route to handle direct photo loading from multiple groups
app.post('/load-photos', async (req, res) => {
  const { keyword, groups } = req.body;
  let groupIds = [];
  
  // Process specific groups or use default list if searching all groups
  if (groups && groups.length > 0) {
    groupIds = groups.filter(Boolean).map(group => {
      // Check if this is the special "all_groups" identifier
      if (group === 'all_groups') {
        return group; // Keep as is, will be handled specially
      }
      
      // Extract group ID from URL if it's a URL
      if (typeof group === 'string' && group.includes('facebook.com/groups/')) {
        const match = group.match(/facebook\.com\/groups\/([0-9]+)/);
        if (match && match[1]) {
          return match[1];
        } else {
          // For named groups like facebook.com/groups/groupname
          const parts = group.split('/');
          return parts[parts.length - 1].split('?')[0];
        }
      }
      return group;
    });
  }
  
  // Handle "all_groups" special case or empty groups array
  const useDefaultGroups = groupIds.length === 0 || groupIds.includes('all_groups');
  if (useDefaultGroups) {
    // Default mock group IDs to use for "all groups" search
    groupIds = ['123456789', '987654321', '456789123', '246813579', '135792468'];
  }
  
  try {
    // Note: In a real implementation, this would use the Facebook Graph API
    // to fetch photos from the specified groups using the access token.
    // For demonstration purposes, we're returning a mock response.
    // You would need to implement proper FB API calls using axios.
    
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Define group names based on IDs for better mock data
    const groupNames = {
      '123456789': 'Photography Enthusiasts',
      '987654321': 'Travel Adventures',
      '456789123': 'Nature Lovers',
      '246813579': 'Food & Recipes',
      '135792468': 'Hobby Crafters'
    };
    
    // Create mock photos for selected groups
    const mockPhotos = [];
    
    // Generate 2-3 photos per group with realistic group names
    groupIds.forEach((groupId, index) => {
      if (groupId === 'all_groups') return; // Skip the 'all_groups' identifier
      
      const groupName = groupNames[groupId] || `Group ${index + 1}`;
      const photoCount = Math.floor(Math.random() * 2) + 2; // 2-3 photos per group
      
      for (let i = 0; i < photoCount; i++) {
        const id = Math.floor(Math.random() * 1000000).toString();
        const relevanceScore = Math.random() * 0.3 + 0.7; // Random score between 0.7-1.0
        
        mockPhotos.push({
          id: id,
          groupId: groupId,
          groupName: groupName,
          // Using more reliable placeholder images with better keyword integration
          imageUrl: `https://placehold.co/300x200/random?text=${encodeURIComponent(keyword)}`,
          caption: `${groupName}: ${keyword} photo example ${i+1} (DEMO ONLY)`,
          relevanceScore: relevanceScore,
          postUrl: `https://facebook.com/groups/${groupId}/posts/${id}`
        });
      }
    });
    
    // Filter mock photos based on relevance to keyword
    const filteredPhotos = mockPhotos
      .filter(photo => {
        // Check if the photo caption contains the keyword or has high relevance
        return photo.caption.toLowerCase().includes(keyword.toLowerCase()) || 
               photo.relevanceScore > 0.7;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    res.json({
      success: true,
      keyword,
      totalPhotos: mockPhotos.length,
      photos: filteredPhotos,
      message: `Found ${filteredPhotos.length} photos related to "${keyword}" across ${useDefaultGroups ? 'all your groups' : groupIds.length + ' groups'}`
    });
    
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load photos. Please try again later.',
      error: error.message
    });
  }
});

// Upload groups CSV
app.post('/upload-groups', upload.single('groupsCSV'), (req, res) => {
  if (!req.file) {
    console.log('No file uploaded.');
    return res.redirect('/?uploadStatus=fail');
  }
  // Validate the file: must be .csv and contain at least one valid line
  const uploadedPath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.csv') {
    fs.unlinkSync(uploadedPath);
    console.log('Upload failed: Not a CSV file.');
    return res.redirect('/?uploadStatus=fail');
  }
  const content = fs.readFileSync(uploadedPath, 'utf8');
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) {
    fs.unlinkSync(uploadedPath);
    console.log('Upload failed: CSV is empty or has no valid lines.');
    return res.redirect('/?uploadStatus=fail');
  }
  // Save as groups.csv
  fs.renameSync(uploadedPath, GROUPS_CSV_PATH);
  console.log('CSV uploaded and validated successfully:', lines);
  res.redirect('/?uploadStatus=success');
});

// Download groups CSV
app.get('/download-groups', (req, res) => {
  if (fs.existsSync(GROUPS_CSV_PATH)) {
    res.download(GROUPS_CSV_PATH, 'groups.csv');
  } else {
    res.status(404).send('No groups CSV found.');
  }
});