// public/js/picturetotext.js - ENHANCED VERSION
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

async function handleUpload() {
  if (!imageInput.files.length) {
    alert('Please select an image first.');
    return;
  }

  // Disable button during upload
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Processing...';

  // Reset UI
  resetResults();
  showProcessing(true);
  
  const formData = new FormData();
  formData.append('image', imageInput.files[0]);
  
  // Get selected language
  const selectedLanguage = languageSelect.value;
  formData.append('language', selectedLanguage);

  const startTime = Date.now();

  try {
    statusText.textContent = 'Uploading image...';
    languageText.textContent = languageSelect.options[languageSelect.selectedIndex].text;
    
    const response = await fetch('http://localhost:3000/api/picturetotext/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      throw new Error(data.error || `Upload failed: ${response.status}`);
    }

    // Store analysis data
    currentAnalysisData = data;
    
    // Update processing info
    timeText.textContent = `${elapsed}s`;
    engineText.textContent = data.ocr?.engine || 'Unknown';
    languageText.textContent = data.languageUsed || selectedLanguage;
    objectsCount.textContent = data.objects?.count || 0;
    statusText.textContent = 'Analysis completed successfully';
    
    // Display results
    displayResults(data);
    
  } catch (error) {
    console.error('Upload error:', error);
    statusText.textContent = 'Analysis failed';
    timeText.textContent = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
    
    let errorMessage = `Error: ${error.message}\n\n`;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage += 'Cannot connect to server. Make sure the backend is running on port 3000.';
    } else if (error.message.includes('404')) {
      errorMessage += 'Server endpoint not found. Check your API routes.';
    } else {
      errorMessage += 'Please try again with a different image.';
    }
    
    textResult.textContent = errorMessage;
    
    // Show error in all result areas
    objectsGrid.innerHTML = '<div class="object-card">Error during analysis</div>';
    objectsDescription.textContent = 'Analysis failed - check server connection';
    combinedResult.textContent = errorMessage;
    
  } finally {
    // Re-enable upload button
    setTimeout(() => {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Analyze Again';
    }, 1000);
  }
}

function resetResults() {
  textResult.textContent = 'Processing... Please wait.';
  objectsGrid.innerHTML = '';
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
  // Enable copy buttons
  copyTextBtn.disabled = false;
  copyAllBtn.disabled = false;
  
  // Display text results
  if (data.ocr?.text && data.ocr.text.trim().length > 0) {
    textResult.textContent = data.ocr.text;
  } else {
    textResult.textContent = 'No text could be extracted from this image.';
  }
  
  // Display object results (limited to 4)
  displayObjects(data.objects);
  
  // Display combined results
  displayCombinedResults(data);
  
  // Switch to combined view by default
  switchTab('combined');
}

function displayObjects(objectsData) {
  if (!objectsData || objectsData.count === 0) {
    objectsGrid.innerHTML = '<div class="object-card">No objects detected</div>';
    if (objectsDescription) {
      objectsDescription.textContent = 'No prominent objects were detected in this image.';
    }
    return;
  }
  
  // Set description
  if (objectsDescription) {
    objectsDescription.textContent = objectsData.description;
  }
  
  // Clear previous objects
  objectsGrid.innerHTML = '';
  
  // Add object cards (limited to 4)
  objectsData.detected.slice(0, 4).forEach(obj => {
    const confidencePercent = Math.round(obj.confidence * 100);
    const objectCard = document.createElement('div');
    objectCard.className = 'object-card';
    objectCard.innerHTML = `
      <div class="object-name">${obj.name}</div>
      <div class="object-confidence">${confidencePercent}% confidence</div>
    `;
    objectsGrid.appendChild(objectCard);
  });
}

function displayCombinedResults(data) {
  let combinedText = '';
  
  // Add processing info
  combinedText += `Processing Time: ${data.processingTime}\n`;
  combinedText += `OCR Engine: ${data.ocr?.engine || 'Unknown'}\n`;
  combinedText += `Language: ${data.languageUsed || 'Auto-detect'}\n`;
  combinedText += `Confidence: ${data.ocr?.confidence ? Math.round(data.ocr.confidence) + '%' : 'N/A'}\n\n`;
  
  // Add object detection results (limited to 4)
  if (data.objects?.count > 0) {
    combinedText += `IMAGE CONTENT:\n`;
    combinedText += `${data.objects.description}\n\n`;
    
    combinedText += `DETECTED OBJECTS (Top ${Math.min(data.objects.count, 4)}):\n`;
    data.objects.detected.slice(0, 4).forEach(obj => {
      const confidencePercent = Math.round(obj.confidence * 100);
      combinedText += `- ${obj.name} ${confidencePercent}% confidence\n`;
    });
    combinedText += `\n`;
  } else {
    combinedText += `IMAGE CONTENT:\nNo objects detected\n\n`;
  }
  
  // Add extracted text
  combinedText += `EXTRACTED TEXT:\n`;
  if (data.ocr?.text && data.ocr.text.trim().length > 0) {
    combinedText += data.ocr.text;
  } else {
    combinedText += 'No text could be extracted from this image.';
  }
  
  combinedResult.textContent = combinedText;
}

// Tab switching function
function switchTab(tabName) {
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
  document.getElementById(tabName + 'Tab').classList.add('active');
}

// Copy text functionality
copyTextBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(textResult.textContent);
    showCopyFeedback(copyTextBtn);
  } catch (err) {
    alert('Failed to copy text to clipboard');
  }
});

// Copy all functionality
copyAllBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(combinedResult.textContent);
    showCopyFeedback(copyAllBtn);
  } catch (err) {
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
console.log('Enhanced OCR Frontend initialized - ready for image upload!');