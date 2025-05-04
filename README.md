# 🔍 Facebook Group Search Helper

<div align="center">

![Facebook Group Search Helper Logo](https://img.shields.io/badge/Facebook-Group_Search_Helper-1877F2?style=for-the-badge&logo=facebook&logoColor=white)

*Search across multiple Facebook groups with ease!*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)

</div>

---

## 📋 Overview

Facebook Group Search Helper is a web application that helps users search across multiple Facebook groups simultaneously. It generates direct search links for each group, allowing you to quickly find content across groups you're a member of.

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=Facebook+Group+Search+Helper" alt="Application Screenshot" width="80%"/>
</div>

---

## ✨ Features

- 🔎 **Search Multiple Groups** - Generate links to search across all your Facebook groups at once
- 📋 **Two Input Methods** - Upload a CSV file with group IDs or manually enter them
- 🔗 **Quick Access Links** - Direct links for general search, photos, videos, and albums
- 🔄 **Bulk Open** - Open all search links in new tabs with one click
- 🖼️ **Media Search** - Easily find photos, videos and albums in any group
- 💯 **No Authentication Required** - No need to share credentials, works with direct Facebook URLs

---

## 📲 How to Use

1. **Choose Input Method**
   - Upload a CSV file with Facebook group IDs/URLs
   - Or enter group IDs/URLs manually

2. **Enter Search Keyword**
   - Type what you want to search for across your groups

3. **Generate Links**
   - Click "Generate Search Links" to create links for each group

4. **Search Groups**
   - Click individual links to search specific groups
   - Use "Open All Groups in New Tabs" for bulk searching

---

## 📝 CSV Format

Your CSV file should contain one Facebook group ID or URL per line:

```
123456789012345
mygroupname
https://www.facebook.com/groups/123456789012345
https://www.facebook.com/groups/mygroupname
```

---

## 💻 Installation & Setup

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/facebook-group-search-helper.git
cd facebook-group-search-helper
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the application**

```bash
npm start
```

4. **Access the application**
   - Open your browser and go to: `http://localhost:3000`

---

## 🔧 Technical Details

- **Backend**: Node.js with Express.js
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **File Handling**: multer for CSV uploads
- **Facebook Integration**: Uses direct Facebook search URLs, no API access required

---

## 🙌 Contributing

Contributions are welcome! Feel free to submit a pull request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <sub>Built with ❤️ for easier Facebook group navigation</sub>
</div>