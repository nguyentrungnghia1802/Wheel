// Admin Configuration Manager

const DEFAULT_CONFIG = {
    spin1Names: ['Sinh Huy', 'Đoàn Hiếu', 'Nam Hải', 'Việt Quang'],
    spin2Names: ['Thế Pháp', 'Quang Anh', 'Châu Anh', 'Trung Nghĩa'],
    spin3Names: ['Đình Minh', 'Tùng Nguyễn', 'Anh Tài', 'Huyền Trang'],
    spin4Names: ['Cường', 'Chí Long', 'Trung Mai'],
    spin5Names: ['Ngọc Đức', 'Thành Minh', 'Phương Anh'],
    spin6Names: ['Hoàng Long'],
    spin7Names: ['Xuân Bắc', 'Anh Quốc'],
    spin8Names: ['Phương', 'Lê Nghĩa']
};

// Load configuration from localStorage or use default
function loadConfig() {
    const saved = localStorage.getItem('wheelConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
}

// Initialize form with current configuration
function initForm() {
    const config = loadConfig();
    
    for (let i = 1; i <= 8; i++) {
        const key = `spin${i}Names`;
        const textarea = document.getElementById(`spin${i}`);
        if (textarea && config[key]) {
            textarea.value = config[key].join('\n');
        }
    }
}

// Save configuration to localStorage
function saveConfig() {
    const config = {};
    
    for (let i = 1; i <= 8; i++) {
        const key = `spin${i}Names`;
        const textarea = document.getElementById(`spin${i}`);
        const lines = textarea.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        config[key] = lines;
    }
    
    localStorage.setItem('wheelConfig', JSON.stringify(config));
    showNotification('✅ Configuration saved successfully!');
}

// Export configuration as JSON file
function exportConfig() {
    const config = {};
    
    for (let i = 1; i <= 8; i++) {
        const key = `spin${i}Names`;
        const textarea = document.getElementById(`spin${i}`);
        const lines = textarea.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        config[key] = lines;
    }
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `wheel-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('📥 Configuration exported!');
}

// Import configuration from JSON file
function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            
            // Validate config structure
            for (let i = 1; i <= 8; i++) {
                const key = `spin${i}Names`;
                if (config[key] && Array.isArray(config[key])) {
                    const textarea = document.getElementById(`spin${i}`);
                    textarea.value = config[key].join('\n');
                }
            }
            
            showNotification('📤 Configuration imported successfully!');
        } catch (error) {
            alert('Invalid JSON file!');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Reset to default configuration
function resetConfig() {
    if (!confirm('Are you sure you want to reset to default configuration?')) {
        return;
    }
    
    for (let i = 1; i <= 8; i++) {
        const key = `spin${i}Names`;
        const textarea = document.getElementById(`spin${i}`);
        textarea.value = DEFAULT_CONFIG[key].join('\n');
    }
    
    localStorage.removeItem('wheelConfig');
    showNotification('🗑️ Reset to default configuration!');
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initForm);
