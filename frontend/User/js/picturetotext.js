// public/js/picturetotext.js - ENHANCED FOR ALL LANGUAGES
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const selectImageBtn = document.getElementById('selectImageBtn');
const uploadBtn = document.getElementById('uploadBtn');
const languageSelect = document.getElementById('languageSelect');
const processingInfo = document.getElementById('processingInfo');
const statusText = document.getElementById('statusText');
const timeText = document.getElementById('timeText');
const engineText = document.getElementById('engineText');
const languageText = document.getElementById('languageText');
const objectsCount = document.getElementById('objectsCount');

// Results elements
const textResult = document.getElementById('textResult');
const objectsGrid = document.getElementById('objectsGrid');
const objectsDescription = document.getElementById('objectsDescription');
const combinedResult = document.getElementById('combinedResult');

// Copy buttons
const copyTextBtn = document.getElementById('copyTextBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
// Add this function at the top of the file (after the currentAnalysisData declaration)
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (userId) {
        headers['X-User-ID'] = userId;
    }
    
    console.log('🔐 Auth headers:', { 
        hasToken: !!token, 
        userId: userId,
        userIdType: typeof userId 
    });
    return headers;
} 

// Then modify the fetch request in handleUpload function:
// const response = await fetch('http://localhost:3000/api/picturetotext/upload', {
//     method: 'POST',
//     body: formData,
//     credentials: 'include',
//     headers: getAuthHeaders() // ✅ Add auth headers
// });
let currentAnalysisData = null;

// Initialize button state
uploadBtn.disabled = true;
uploadBtn.textContent = 'Analyze Image';

// Select Image button - Opens file explorer
selectImageBtn.addEventListener('click', () => {
  imageInput.click();
});

// Upload area click handler - Also opens file explorer
uploadArea.addEventListener('click', () => {
  imageInput.click();
});

// Drag and drop functionality
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  
  if (e.dataTransfer.files.length) {
    imageInput.files = e.dataTransfer.files;
    handleFileSelect();
  }
});

// File input change handler
imageInput.addEventListener('change', handleFileSelect);

function handleFileSelect() {
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, etc.).');
      resetFileInput();
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      resetFileInput();
      return;
    }
    
    // Show preview and enable button
    const reader = new FileReader();
    reader.onload = function(e) {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
      
      // Enable upload button
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Analyze Image';
      
      // Update upload area text
      const uploadText = document.querySelector('.upload-text');
      const uploadSubtext = document.querySelector('.upload-subtext');
      
      if (uploadText) uploadText.textContent = file.name;
      if (uploadSubtext) uploadSubtext.textContent = `Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    };
    reader.readAsDataURL(file);
  }
}

function resetFileInput() {
  imageInput.value = '';
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Analyze Image';
  imagePreview.style.display = 'none';
  
  const uploadText = document.querySelector('.upload-text');
  const uploadSubtext = document.querySelector('.upload-subtext');
  
  if (uploadText) uploadText.textContent = 'Drop your image here or click to browse';
  if (uploadSubtext) uploadSubtext.textContent = 'Supports JPG, PNG, GIF • Max 10MB';
}

// Analyze button click handler
uploadBtn.addEventListener('click', handleUpload);

// Fix the handleUpload function - around line 161

async function handleUpload() {
  if (!imageInput.files.length) {
    alert('Please select an image first.');
    return;
  }

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Processing...';

  resetResults();
  showProcessing(true);
  
  const formData = new FormData();
  formData.append('image', imageInput.files[0]);
  
  const selectedLanguage = languageSelect.value;
  formData.append('language', selectedLanguage);
  
  // ✅ ADD USER ID TO FORMDATA (not headers!)
  const userId = localStorage.getItem('userId');
  if (userId) {
    formData.append('userId', userId);
    console.log('👤 Adding user ID to form:', userId);
  } else {
    console.warn('⚠️ No user ID found in localStorage');
  }

  console.log('🚀 Starting analysis...');
  console.log('📁 File:', imageInput.files[0].name);
  console.log('🌍 Language:', selectedLanguage);

  const startTime = Date.now();

  try {
    statusText.textContent = 'Uploading and analyzing image...';
    languageText.textContent = languageSelect.options[languageSelect.selectedIndex].text;
    
    // ✅ NO CUSTOM HEADERS - userId is in FormData body
    const response = await fetch('http://localhost:3000/api/picturetotext/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
      // DON'T set headers - browser needs to set Content-Type automatically
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Analysis complete!');
    console.log('📊 Response:', data);

    currentAnalysisData = data;
    
    timeText.textContent = data.processingTime || `${elapsed}s`;
    engineText.textContent = data.ocr?.engine || 'Unknown';
    languageText.textContent = data.languageUsed || selectedLanguage;
    objectsCount.textContent = data.objects?.count || 0;
    statusText.textContent = '✅ Analysis completed successfully';
    
    console.log('📝 Extracted text length:', data.ocr?.text?.length || 0);
    console.log('💯 Confidence:', data.ocr?.confidence || 0);
    if (data.ocr?.text) {
      console.log('📄 Text preview:', data.ocr.text.substring(0, 100) + '...');
    }
    
    displayResults(data);
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    statusText.textContent = '❌ Analysis failed';
    timeText.textContent = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    
    let errorMessage = `Error: ${error.message}\n\n`;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage += '⚠️ Cannot connect to server.\n';
      errorMessage += 'Make sure the backend is running on port 3000.\n\n';
      errorMessage += 'Try: npm start (in backend directory)';
    } else if (error.message.includes('404')) {
      errorMessage += '⚠️ Server endpoint not found.\n';
      errorMessage += 'Check your API routes are properly configured.';
    } else {
      errorMessage += '⚠️ Please try again with a different image or check server logs.';
    }
    
    textResult.textContent = errorMessage;
    objectsGrid.innerHTML = '<div class="object-card error-card">❌ Error during analysis</div>';
    objectsDescription.textContent = 'Analysis failed - check server connection';
    combinedResult.textContent = errorMessage;
    
  } finally {
    setTimeout(() => {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Analyze Again';
    }, 1000);
  }
} 

function resetResults() {
  textResult.textContent = 'Processing... Please wait.';
  objectsGrid.innerHTML = '<div class="loading-card">⏳ Analyzing image...</div>';
  objectsDescription.textContent = '';
  combinedResult.textContent = 'Processing...';
  copyTextBtn.disabled = true;
  copyAllBtn.disabled = true;
  currentAnalysisData = null;
}

function showProcessing(show) {
  if (processingInfo) {
    processingInfo.style.display = show ? 'block' : 'none';
  }
  if (show) {
    if (statusText) statusText.textContent = 'Processing...';
    if (timeText) timeText.textContent = '-';
    if (engineText) engineText.textContent = '-';
    if (languageText) languageText.textContent = '-';
    if (objectsCount) objectsCount.textContent = '-';
  }
}

function displayResults(data) {
  console.log('🎨 Displaying results...');
  
  // Enable copy buttons
  copyTextBtn.disabled = false;
  copyAllBtn.disabled = false;
  
  // Display text results with proper Unicode handling
  displayTextResults(data.ocr);
  
  // Display object results
  displayObjects(data.objects);
  
  // Display combined results
  displayCombinedResults(data);
  
  // Switch to appropriate tab based on content
  if (data.ocr?.text && data.ocr.text.trim().length > 20) {
    switchTab('text'); // Show text tab if significant text found
  } else if (data.objects?.count > 0) {
    switchTab('objects'); // Show objects if no text but objects found
  } else {
    switchTab('combined'); // Show combined view otherwise
  }
}

function displayTextResults(ocrData) {
  if (!ocrData || !ocrData.text || ocrData.text.trim().length === 0) {
    textResult.innerHTML = `
      <div style="color: #888; text-align: center; padding: 2rem;">
        ℹ️ No text could be extracted from this image.
        <br><br>
        This could mean:
        <ul style="text-align: left; display: inline-block; margin-top: 1rem;">
          <li>The image contains no text</li>
          <li>The text is too small or blurry</li>
          <li>The language is not supported</li>
        </ul>
      </div>
    `;
    return;
  }
  
  const text = ocrData.text;
  const confidence = ocrData.confidence || 0;
  const engine = ocrData.engine || 'Unknown';
  
  // Check if text contains non-Latin characters
  const hasAsianChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/.test(text);
  const hasArabicChars = /[\u0600-\u06FF]/.test(text);
  
  console.log('📝 Text Analysis:');
  console.log('   Length:', text.length);
  console.log('   Has Asian chars:', hasAsianChars);
  console.log('   Has Arabic chars:', hasArabicChars);
  console.log('   Confidence:', confidence);
  
  // Create result HTML with proper styling for different scripts
  let resultHTML = '';
  
  // Add confidence indicator
  const confidenceClass = confidence > 70 ? 'high' : confidence > 40 ? 'medium' : 'low';
  resultHTML += `
    <div class="confidence-badge ${confidenceClass}" style="
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      background: ${confidence > 70 ? '#d4edda' : confidence > 40 ? '#fff3cd' : '#f8d7da'};
      color: ${confidence > 70 ? '#155724' : confidence > 40 ? '#856404' : '#721c24'};
    ">
      ${confidence > 70 ? '✅' : confidence > 40 ? '⚠️' : '❌'} 
      Confidence: ${confidence}% (${engine})
    </div>
  `;
  
  // Add extracted text with proper line breaks and Unicode support
  resultHTML += `
    <div class="extracted-text" style="
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: ${hasAsianChars ? "'Noto Sans CJK', 'Malgun Gothic', 'Microsoft YaHei', " : 
                    hasArabicChars ? "'Arial', 'Tahoma', " : 
                    "'Segoe UI', "}sans-serif;
      font-size: ${hasAsianChars ? '1.1rem' : '1rem'};
      line-height: 1.6;
      text-align: ${hasArabicChars ? 'right' : 'left'};
      direction: ${hasArabicChars ? 'rtl' : 'ltr'};
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 0.5rem;
      border-left: 4px solid #007bff;
    ">${escapeHtml(text)}</div>
  `;
  
  textResult.innerHTML = resultHTML;
}

function displayObjects(objectsData) {
  if (!objectsData || objectsData.count === 0) {
    objectsGrid.innerHTML = `
      <div class="object-card no-objects" style="
        text-align: center;
        padding: 2rem;
        color: #888;
        grid-column: 1 / -1;
      ">
        ℹ️ No objects detected in this image
      </div>
    `;
    if (objectsDescription) {
      objectsDescription.textContent = 'No prominent objects were detected in this image.';
    }
    return;
  }
  
  // Set description
  if (objectsDescription) {
    objectsDescription.textContent = objectsData.description || 'Objects detected in the image.';
  }
  
  // Clear previous objects
  objectsGrid.innerHTML = '';
  
  // Add object cards (limited to 4)
  objectsData.detected.slice(0, 4).forEach((obj, index) => {
    const confidencePercent = Math.round(obj.confidence * 100);
    const objectCard = document.createElement('div');
    objectCard.className = 'object-card';
    objectCard.style.animationDelay = `${index * 0.1}s`;
    objectCard.innerHTML = `
      <div class="object-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">
        ${getObjectEmoji(obj.name)}
      </div>
      <div class="object-name" style="font-weight: 600; margin-bottom: 0.25rem;">
        ${obj.name}
      </div>
      <div class="object-confidence" style="
        color: ${confidencePercent > 70 ? '#28a745' : confidencePercent > 40 ? '#ffc107' : '#6c757d'};
        font-size: 0.9rem;
      ">
        ${confidencePercent}% confidence
      </div>
    `;
    objectsGrid.appendChild(objectCard);
  });
}

function displayCombinedResults(data) {
  let combinedText = '';
  
  // Header section
  combinedText += '═══════════════════════════════════════\n';
  combinedText += '          IMAGE ANALYSIS REPORT\n';
  combinedText += '═══════════════════════════════════════\n\n';
  
  // Processing info
  combinedText += '📊 PROCESSING DETAILS:\n';
  combinedText += '─────────────────────────────────────\n';
  combinedText += `⏱️  Processing Time: ${data.processingTime}\n`;
  combinedText += `🔧 OCR Engine: ${data.ocr?.engine || 'Unknown'}\n`;
  combinedText += `🌐 Language: ${data.languageUsed || 'Auto-detect'}\n`;
  combinedText += `💯 Confidence: ${data.ocr?.confidence ? data.ocr.confidence + '%' : 'N/A'}\n`;
  combinedText += `📁 Filename: ${data.filename || 'Unknown'}\n`;
  combinedText += `📋 Analysis Type: ${data.analysisType || 'standard'}\n\n`;
  
  // Object detection results
  if (data.objects?.count > 0) {
    combinedText += '🔍 DETECTED OBJECTS:\n';
    combinedText += '─────────────────────────────────────\n';
    combinedText += `${data.objects.description}\n\n`;
    
    combinedText += `Found ${data.objects.count} object(s):\n`;
    data.objects.detected.slice(0, 4).forEach((obj, index) => {
      const confidencePercent = Math.round(obj.confidence * 100);
      combinedText += `  ${index + 1}. ${obj.name} - ${confidencePercent}% confidence\n`;
    });
    combinedText += '\n';
  } else {
    combinedText += '🔍 DETECTED OBJECTS:\n';
    combinedText += '─────────────────────────────────────\n';
    combinedText += 'No objects detected\n\n';
  }
  
  // Extracted text
  combinedText += '📝 EXTRACTED TEXT:\n';
  combinedText += '─────────────────────────────────────\n';
  if (data.ocr?.text && data.ocr.text.trim().length > 0) {
    combinedText += data.ocr.text;
  } else {
    combinedText += 'No text could be extracted from this image.';
  }
  
  combinedText += '\n\n═══════════════════════════════════════\n';
  combinedText += '              END OF REPORT\n';
  combinedText += '═══════════════════════════════════════';
  
  combinedResult.textContent = combinedText;
}

// Helper function to get emoji for objects
function getObjectEmoji(objectName) {
  const emojiMap = {
    'person': '👤',
    'car': '🚗',
    'dog': '🐕',
    'cat': '🐈',
    'bird': '🐦',
    'chair': '🪑',
    'table': '🪑',
    'book': '📖',
    'phone': '📱',
    'laptop': '💻',
    'cup': '☕',
    'bottle': '🍾',
    'food': '🍕',
    'tree': '🌳',
    'flower': '🌸',
    'building': '🏢',
    'clock': '🕐',
    'bag': '👜',
    'shoe': '👟',
    'hat': '🎩'
  };
  
  const key = objectName.toLowerCase();
  for (let [name, emoji] of Object.entries(emojiMap)) {
    if (key.includes(name)) return emoji;
  }
  return '📦'; // Default icon
}

// Helper function to escape HTML for safe display
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Tab switching function
function switchTab(tabName) {
  console.log('🔄 Switching to tab:', tabName);
  
  // Update tab active states
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Activate selected tab
  const activeTab = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
  
  const tabContent = document.getElementById(tabName + 'Tab');
  if (tabContent) {
    tabContent.classList.add('active');
  }
}

// Copy text functionality
copyTextBtn.addEventListener('click', async () => {
  try {
    const textToCopy = textResult.textContent || textResult.innerText;
    await navigator.clipboard.writeText(textToCopy);
    showCopyFeedback(copyTextBtn);
    console.log('✅ Text copied to clipboard');
  } catch (err) {
    console.error('❌ Failed to copy:', err);
    alert('Failed to copy text to clipboard');
  }
});

// Copy all functionality
copyAllBtn.addEventListener('click', async () => {
  try {
    const textToCopy = combinedResult.textContent || combinedResult.innerText;
    await navigator.clipboard.writeText(textToCopy);
    showCopyFeedback(copyAllBtn);
    console.log('✅ Combined results copied to clipboard');
  } catch (err) {
    console.error('❌ Failed to copy:', err);
    alert('Failed to copy text to clipboard');
  }
});

function showCopyFeedback(button) {
  const originalText = button.innerHTML;
  button.classList.add('copy-success');
  button.innerHTML = '✅ Copied!';
  
  setTimeout(() => {
    button.classList.remove('copy-success');
    button.innerHTML = originalText;
  }, 2000);
}

// Make switchTab function globally available
window.switchTab = switchTab;

// Initialize
resetResults();
console.log('🚀 Enhanced OCR Frontend initialized!');
console.log('✅ Multi-language support enabled');
console.log('✅ Unicode display support enabled');
console.log('📋 Ready for image upload!');