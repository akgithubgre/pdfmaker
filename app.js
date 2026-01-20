// ===== State Management =====
const state = {
    images: [], // Array of { file, dataUrl, name, id }
    pdfFile: null,
    imageFile: null,
    lastCreatedPdf: null
};

// ===== DOM Elements =====
const elements = {
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // PDF Maker
    pdfUploadZone: document.getElementById('pdf-upload-zone'),
    imageInput: document.getElementById('image-input'),
    imageList: document.getElementById('image-list'),
    orderSection: document.getElementById('order-section'),
    pdfActions: document.getElementById('pdf-actions'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    createPdfBtn: document.getElementById('create-pdf-btn'),
    addMoreBtn: document.getElementById('add-more-btn'),
    imageCount: document.querySelector('.image-count'),
    
    // Success Modal
    successModal: document.getElementById('success-modal'),
    compressPdfBtn: document.getElementById('compress-pdf-btn'),
    createNewBtn: document.getElementById('create-new-btn'),
    
    // PDF Compress
    pdfCompressZone: document.getElementById('pdf-compress-zone'),
    pdfCompressInput: document.getElementById('pdf-compress-input'),
    pdfCompressOptions: document.getElementById('pdf-compress-options'),
    pdfFileName: document.getElementById('pdf-file-name'),
    pdfFileSize: document.getElementById('pdf-file-size'),
    compressPdfAction: document.getElementById('compress-pdf-action'),
    
    // Image Compress
    imageCompressZone: document.getElementById('image-compress-zone'),
    imageCompressInput: document.getElementById('image-compress-input'),
    imageCompressOptions: document.getElementById('image-compress-options'),
    imagePreview: document.getElementById('image-preview'),
    imageFileName: document.getElementById('image-file-name'),
    imageFileSize: document.getElementById('image-file-size'),
    compressImageAction: document.getElementById('compress-image-action'),
    
    // Loading
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingText: document.getElementById('loading-text')
};

// ===== Utility Functions =====
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showLoading(text = 'Processing...') {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}

function showModal() {
    elements.successModal.classList.add('active');
}

function hideModal() {
    elements.successModal.classList.remove('active');
}

// Filename prompt modal
function promptFilename(defaultName, extension, showFormatDropdown = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('filename-modal');
        const input = document.getElementById('filename-input');
        const extSpan = document.getElementById('file-extension');
        const extSelect = document.getElementById('file-extension-select');
        const saveBtn = document.getElementById('filename-save');
        const cancelBtn = document.getElementById('filename-cancel');
        
        // Set default values
        input.value = defaultName;
        
        // Show dropdown or static extension
        if (showFormatDropdown) {
            extSpan.style.display = 'none';
            extSelect.style.display = 'block';
            extSelect.value = extension;
        } else {
            extSpan.style.display = 'block';
            extSelect.style.display = 'none';
            extSpan.textContent = extension;
        }
        
        // Show modal
        modal.classList.add('active');
        input.focus();
        input.select();
        
        // Handle save
        const handleSave = () => {
            const filename = input.value.trim() || defaultName;
            const finalExt = showFormatDropdown ? extSelect.value : extension;
            cleanup();
            resolve({ filename: filename + finalExt, extension: finalExt });
        };
        
        // Handle cancel
        const handleCancel = () => {
            cleanup();
            resolve(null);
        };
        
        // Handle enter key
        const handleKeydown = (e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
        };
        
        // Cleanup listeners
        const cleanup = () => {
            modal.classList.remove('active');
            saveBtn.removeEventListener('click', handleSave);
            cancelBtn.removeEventListener('click', handleCancel);
            input.removeEventListener('keydown', handleKeydown);
        };
        
        saveBtn.addEventListener('click', handleSave);
        cancelBtn.addEventListener('click', handleCancel);
        input.addEventListener('keydown', handleKeydown);
    });
}

// ===== Navigation =====
function initNavigation() {
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            
            // Update active tab
            elements.navTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            elements.tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ===== PDF Maker - Image Upload =====
function initPdfMaker() {
    // Click to upload
    elements.pdfUploadZone.addEventListener('click', () => {
        elements.imageInput.click();
    });
    
    // File input change
    elements.imageInput.addEventListener('change', handleImageSelect);
    
    // Drag and drop
    elements.pdfUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.pdfUploadZone.classList.add('drag-over');
    });
    
    elements.pdfUploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        elements.pdfUploadZone.classList.remove('drag-over');
    });
    
    elements.pdfUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.pdfUploadZone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length) processImages(files);
    });
    
    // Action buttons
    elements.clearAllBtn.addEventListener('click', clearAllImages);
    elements.createPdfBtn.addEventListener('click', createPdf);
    
    // Add more images button
    elements.addMoreBtn.addEventListener('click', () => {
        elements.imageInput.click();
    });
    
    // Modal buttons
    elements.createNewBtn.addEventListener('click', () => {
        hideModal();
        clearAllImages();
    });
    
    elements.compressPdfBtn.addEventListener('click', () => {
        hideModal();
        // Switch to compress tab and load the created PDF
        switchToCompressTab();
    });
}

function handleImageSelect(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    if (files.length) processImages(files);
    e.target.value = ''; // Reset input
}

async function processImages(files) {
    showLoading('Loading images...');
    
    for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        state.images.push({
            id: generateId(),
            file,
            dataUrl,
            name: file.name
        });
    }
    
    updateImageList();
    updateUI();
    hideLoading();
}

function readFileAsDataUrl(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

function updateImageList() {
    elements.imageList.innerHTML = '';
    
    state.images.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.dataset.id = img.id;
        div.innerHTML = `
            <div class="drag-handle">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5"/>
                    <circle cx="15" cy="6" r="1.5"/>
                    <circle cx="9" cy="12" r="1.5"/>
                    <circle cx="15" cy="12" r="1.5"/>
                    <circle cx="9" cy="18" r="1.5"/>
                    <circle cx="15" cy="18" r="1.5"/>
                </svg>
            </div>
            <span class="order-number">${index + 1}</span>
            <img class="thumbnail" src="${img.dataUrl}" alt="${img.name}">
            <div class="item-info">
                <span class="image-name">${img.name}</span>
            </div>
            <button class="remove-btn" onclick="event.stopPropagation(); removeImage('${img.id}')" title="Remove">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        elements.imageList.appendChild(div);
    });
    
    // Re-initialize sortable after updating list
    initSortable();
}

function initSortable() {
    if (elements.imageList.sortableInstance) {
        elements.imageList.sortableInstance.destroy();
    }
    
    elements.imageList.sortableInstance = new Sortable(elements.imageList, {
        animation: 200,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        delay: 150,
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        preventOnFilter: true,
        forceFallback: false,
        scrollSensitivity: 100,
        scrollSpeed: 20,
        bubbleScroll: true,
        onStart: () => {
            if (navigator.vibrate) navigator.vibrate(50);
            // Prevent body scroll while dragging
            document.body.style.overflow = 'hidden';
        },
        onEnd: (evt) => {
            // Re-enable body scroll
            document.body.style.overflow = '';
            
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            
            if (oldIndex !== newIndex) {
                // Reorder state.images array
                const [movedItem] = state.images.splice(oldIndex, 1);
                state.images.splice(newIndex, 0, movedItem);
                
                // Update order numbers without full re-render
                updateOrderNumbers();
                
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(30);
            }
        }
    });
}

function updateOrderNumbers() {
    const items = elements.imageList.querySelectorAll('.order-item');
    items.forEach((item, index) => {
        const numberEl = item.querySelector('.order-number');
        if (numberEl) numberEl.textContent = index + 1;
    });
}

function updateUI() {
    const hasImages = state.images.length > 0;
    
    elements.imageCount.textContent = `${state.images.length} image${state.images.length !== 1 ? 's' : ''}`;
    elements.orderSection.style.display = hasImages ? 'block' : 'none';
    elements.pdfActions.style.display = hasImages ? 'flex' : 'none';
    
    // Hide upload zone when images exist to save space on mobile
    if (hasImages) {
        elements.pdfUploadZone.style.display = 'none';
    } else {
        elements.pdfUploadZone.style.display = 'flex';
    }
}

window.removeImage = function(id) {
    state.images = state.images.filter(img => img.id !== id);
    updateImageList();
    updateUI();
};

function clearAllImages() {
    state.images = [];
    updateImageList();
    updateUI();
}

// ===== PDF Creation =====
async function createPdf() {
    if (state.images.length === 0) return;
    
    showLoading('Creating PDF...');
    
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        
        for (let i = 0; i < state.images.length; i++) {
            if (i > 0) pdf.addPage();
            
            const img = state.images[i];
            const imgData = img.dataUrl;
            
            // Get image dimensions
            const dimensions = await getImageDimensions(imgData);
            const imgWidth = dimensions.width;
            const imgHeight = dimensions.height;
            
            // Calculate scaling to fit page
            const availableWidth = pageWidth - (margin * 2);
            const availableHeight = pageHeight - (margin * 2);
            
            let finalWidth, finalHeight;
            const ratio = imgWidth / imgHeight;
            
            if (imgWidth > imgHeight) {
                finalWidth = Math.min(availableWidth, imgWidth);
                finalHeight = finalWidth / ratio;
                if (finalHeight > availableHeight) {
                    finalHeight = availableHeight;
                    finalWidth = finalHeight * ratio;
                }
            } else {
                finalHeight = Math.min(availableHeight, imgHeight);
                finalWidth = finalHeight * ratio;
                if (finalWidth > availableWidth) {
                    finalWidth = availableWidth;
                    finalHeight = finalWidth / ratio;
                }
            }
            
            // Center image on page
            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;
            
            pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
        }
        
        // Generate blob for potential compression
        const pdfBlob = pdf.output('blob');
        state.lastCreatedPdf = pdfBlob;
        
        hideLoading();
        
        // Prompt for filename
        const result = await promptFilename('my_document', '.pdf');
        if (!result) return; // User cancelled
        
        // Download with chosen name
        pdf.save(result.filename);
        
        showModal();
        
    } catch (error) {
        console.error('Error creating PDF:', error);
        hideLoading();
        alert('Error creating PDF. Please try again.');
    }
}

function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = dataUrl;
    });
}

function switchToCompressTab() {
    // Switch to PDF compress tab
    elements.navTabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="pdf-compress"]').classList.add('active');
    
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === 'pdf-compress') {
            content.classList.add('active');
        }
    });
    
    // If we have a created PDF, show it
    if (state.lastCreatedPdf) {
        state.pdfFile = state.lastCreatedPdf;
        elements.pdfFileName.textContent = 'Recently Created PDF';
        elements.pdfFileSize.textContent = `Original: ${formatFileSize(state.lastCreatedPdf.size)}`;
        elements.pdfCompressOptions.style.display = 'flex';
    }
}

// ===== PDF Compression =====
function initPdfCompress() {
    // Click to upload
    elements.pdfCompressZone.addEventListener('click', () => {
        elements.pdfCompressInput.click();
    });
    
    // File input change
    elements.pdfCompressInput.addEventListener('change', handlePdfSelect);
    
    // Drag and drop
    elements.pdfCompressZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.pdfCompressZone.classList.add('drag-over');
    });
    
    elements.pdfCompressZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        elements.pdfCompressZone.classList.remove('drag-over');
    });
    
    elements.pdfCompressZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.pdfCompressZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            processPdfFile(file);
        }
    });
    
    // Compress action
    elements.compressPdfAction.addEventListener('click', compressPdf);
}

function handlePdfSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        processPdfFile(file);
    }
    e.target.value = '';
}

function processPdfFile(file) {
    state.pdfFile = file;
    elements.pdfFileName.textContent = file.name;
    elements.pdfFileSize.textContent = `Original: ${formatFileSize(file.size)}`;
    elements.pdfCompressOptions.style.display = 'flex';
}

async function compressPdf() {
    if (!state.pdfFile) return;
    showLoading('Compressing PDF...');
    
    try {
        // Read PDF file
        const arrayBuffer = await state.pdfFile.arrayBuffer();
        const originalSize = state.pdfFile.size;
        
        // Load PDF with PDF.js for rendering
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;
        
        // Render each page to canvas and collect as images
        const pageImages = [];
        const pageSizes = [];
        
        for (let i = 1; i <= numPages; i++) {
            showLoading(`Processing page ${i} of ${numPages}...`);
            
            const page = await pdfDoc.getPage(i);
            // Scale 3 = 216 DPI (good for text clarity)
            const viewport = page.getViewport({ scale: 3 });
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            // Store original page dimensions (in points, 72 points = 1 inch)
            const originalViewport = page.getViewport({ scale: 1 });
            pageSizes.push({
                width: originalViewport.width,
                height: originalViewport.height
            });
            
            pageImages.push(canvas);
        }
        
        showLoading('Creating compressed PDF...');
        
        const { jsPDF } = window.jspdf;
        const firstPageSize = pageSizes[0];
        
        // Create PDF with first page dimensions
        const pdf = new jsPDF({
            orientation: firstPageSize.width > firstPageSize.height ? 'l' : 'p',
            unit: 'pt',
            format: [firstPageSize.width, firstPageSize.height]
        });
        
        for (let i = 0; i < pageImages.length; i++) {
            if (i > 0) {
                const pageSize = pageSizes[i];
                pdf.addPage([pageSize.width, pageSize.height], 
                    pageSize.width > pageSize.height ? 'l' : 'p');
            }
            
            const canvas = pageImages[i];
            const pageSize = pageSizes[i];
            
            // Use JPEG at 95% quality - good balance of size and clarity
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Add image to fill the page
            pdf.addImage(imgData, 'JPEG', 0, 0, pageSize.width, pageSize.height, undefined, 'FAST');
        }
        
        const compressedBlob = pdf.output('blob');
        
        hideLoading();
        
        // Prompt for filename
        const originalName = state.pdfFile.name || 'document';
        const baseName = originalName.replace('.pdf', '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const result = await promptFilename(`${baseName}_compressed`, '.pdf');
        if (!result) return; // User cancelled
        
        // Download the compressed PDF
        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show results
        const newSize = compressedBlob.size;
        const savings = ((1 - (newSize / originalSize)) * 100).toFixed(1);
        
        let message = `PDF Compressed! ✨\n\n`;
        message += `📄 Original: ${formatFileSize(originalSize)}\n`;
        message += `📦 Compressed: ${formatFileSize(newSize)}\n`;
        message += `📉 Reduced by: ${savings}%`;
        
        alert(message);
        
    } catch (error) {
        console.error('Error compressing PDF:', error);
        hideLoading();
        alert('Error compressing PDF: ' + error.message);
    }
}

// ===== Image Compression =====
function initImageCompress() {
    // Click to upload
    elements.imageCompressZone.addEventListener('click', () => {
        elements.imageCompressInput.click();
    });
    
    // File input change
    elements.imageCompressInput.addEventListener('change', handleImageCompressSelect);
    
    // Drag and drop
    elements.imageCompressZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.imageCompressZone.classList.add('drag-over');
    });
    
    elements.imageCompressZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        elements.imageCompressZone.classList.remove('drag-over');
    });
    
    elements.imageCompressZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.imageCompressZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processImageFile(file);
        }
    });
    
    // Compress action
    elements.compressImageAction.addEventListener('click', compressImage);
}

function handleImageCompressSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        processImageFile(file);
    }
    e.target.value = '';
}

function processImageFile(file) {
    state.imageFile = file;
    elements.imageFileName.textContent = file.name;
    elements.imageFileSize.textContent = `Original: ${formatFileSize(file.size)}`;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.imagePreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    elements.imageCompressOptions.style.display = 'flex';
}

async function compressImage() {
    if (!state.imageFile) return;
    
    showLoading('Compressing image...');
    
    try {
        // Read original image
        const originalDataUrl = await readFileAsDataUrl(state.imageFile);
        const img = new Image();
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = originalDataUrl;
        });
        
        hideLoading();
        
        // Prompt for filename with format dropdown
        const baseName = state.imageFile.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const result = await promptFilename(`${baseName}_compressed`, '.jpg', true);
        if (!result) return; // User cancelled
        
        // Get format based on selected extension
        const formatMap = {
            '.jpg': { mime: 'image/jpeg', quality: 0.85 },
            '.png': { mime: 'image/png', quality: 1 },
            '.webp': { mime: 'image/webp', quality: 0.85 }
        };
        const format = formatMap[result.extension];
        
        showLoading('Compressing...');
        
        // Compress with selected format
        const compressedBlob = await compressImageToBlob(img, format.quality, format.mime);
        
        hideLoading();
        
        // Download
        const url = URL.createObjectURL(compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show result
        const originalSize = state.imageFile.size;
        const newSize = compressedBlob.size;
        const savings = ((1 - (newSize / originalSize)) * 100).toFixed(1);
        
        let message = `Image Compressed! ✨\n\n`;
        message += `📷 Original: ${formatFileSize(originalSize)}\n`;
        message += `📦 Compressed: ${formatFileSize(newSize)}\n`;
        message += `📉 Reduced by: ${savings}%`;
        
        alert(message);
        
    } catch (error) {
        console.error('Error compressing image:', error);
        hideLoading();
        alert('Error compressing image. Please try again.');
    }
}

function compressImageToBlob(img, quality, mimeType = 'image/jpeg') {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Keep original dimensions or scale down if very large
        let width = img.width;
        let height = img.height;
        
        // Optional: Scale down very large images
        const maxDimension = 4096;
        if (width > maxDimension || height > maxDimension) {
            if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
            } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // For PNG, fill with transparent background
        if (mimeType === 'image/png') {
            ctx.clearRect(0, 0, width, height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
            resolve(blob);
        }, mimeType, quality);
    });
}

// ===== Mobile Detection & Helpers =====
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Prevent zoom on double tap for buttons
function preventDoubleTapZoom(element) {
    let lastTap = 0;
    element.addEventListener('touchend', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < 500 && tapLength > 0) {
            e.preventDefault();
        }
        lastTap = currentTime;
    });
}

// Better touch feedback
function addTouchFeedback() {
    document.querySelectorAll('.btn, .nav-tab, .upload-zone').forEach(el => {
        preventDoubleTapZoom(el);
    });
}

// Handle orientation change
function handleOrientationChange() {
    // Small delay to let the browser finish orientation change
    setTimeout(() => {
        // Trigger resize event for any dependent calculations
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initPdfMaker();
    initPdfCompress();
    initImageCompress();
    
    // Mobile optimizations
    if (isTouchDevice) {
        addTouchFeedback();
        document.body.classList.add('touch-device');
    }
    
    // Handle orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Prevent pull-to-refresh on mobile when scrolling inside app
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.closest('.image-list') || e.target.closest('.modal-content')) {
            e.stopPropagation();
        }
    }, { passive: true });
});
