// AI Tools Data
let aiToolsData = null;

// Load AI tools data from JSON file
async function loadAIToolsData() {
    try {
        const response = await fetch('ai-tools.json');
        aiToolsData = await response.json();
        renderCategories();
        renderContactInfo();
    } catch (error) {
        console.error('Error loading AI tools data:', error);
    }
}

// Render categories and tools
function renderCategories() {
    const categoriesContainer = document.getElementById('categories');
    
    if (!aiToolsData || !aiToolsData.categories) {
        return;
    }
    
    categoriesContainer.innerHTML = '';
    
    aiToolsData.categories.forEach(category => {
        const categoryElement = createCategoryElement(category);
        categoriesContainer.appendChild(categoryElement);
    });
}

// Create category element
function createCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';
    
    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = category.name;
    
    const toolsGrid = document.createElement('div');
    toolsGrid.className = 'tools-grid';
    
    category.tools.forEach(tool => {
        const toolElement = createToolElement(tool);
        toolsGrid.appendChild(toolElement);
    });
    
    categoryDiv.appendChild(title);
    categoryDiv.appendChild(toolsGrid);
    
    return categoryDiv;
}

// Create tool element
function createToolElement(tool) {
    const toolLink = document.createElement('a');
    toolLink.className = 'tool-item';
    toolLink.href = tool.url;
    toolLink.target = '_blank';
    toolLink.rel = 'noopener noreferrer';
    
    const icon = document.createElement('div');
    icon.className = 'tool-icon';
    
    // Check if logo is an image file or emoji
    if (tool.logo.includes('.png') || tool.logo.includes('.jpg') || tool.logo.includes('.svg') || tool.logo.includes('.gif')) {
        const img = document.createElement('img');
        img.src = tool.logo;
        img.alt = tool.name;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        icon.appendChild(img);
    } else {
        icon.textContent = tool.logo;
    }
    
    const name = document.createElement('div');
    name.className = 'tool-name';
    name.textContent = tool.name;
    
    toolLink.appendChild(icon);
    toolLink.appendChild(name);
    
    return toolLink;
}

// Render contact information
function renderContactInfo() {
    if (!aiToolsData || !aiToolsData.contact) {
        return;
    }
    
    const contact = aiToolsData.contact;
    
    document.getElementById('head-office').textContent = contact.headOffice;
    document.getElementById('education-center').textContent = contact.educationCenter;
    document.getElementById('phone').textContent = contact.phone;
    document.getElementById('email').textContent = contact.email;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadAIToolsData();
});

// Add smooth scrolling for better UX
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to all anchor links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add loading state
function showLoading() {
    const categoriesContainer = document.getElementById('categories');
    categoriesContainer.innerHTML = '<div style="text-align: center; padding: 40px;">로딩 중...</div>';
}

// Add error handling
function showError(message) {
    const categoriesContainer = document.getElementById('categories');
    categoriesContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc3545;">오류: ${message}</div>`;
}

// Enhanced error handling for fetch
async function loadAIToolsData() {
    showLoading();
    
    try {
        const response = await fetch('ai-tools.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        aiToolsData = await response.json();
        renderCategories();
        renderContactInfo();
    } catch (error) {
        console.error('Error loading AI tools data:', error);
        showError('AI 도구 데이터를 불러올 수 없습니다.');
    }
}
