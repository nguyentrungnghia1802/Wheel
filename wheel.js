// Random Picker with Highlight Effect - JavaScript Logic

class RandomPicker {
    constructor() {
        this.canvas = document.querySelector('.wheel-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.entries = ['Ali', 'Beatriz', 'Charles', 'Fatima', 'Gabriel', 'Hanna'];
        this.colors = ['#5B8FED', '#E74C3C', '#FDB82C', '#43A047', '#5B8FED', '#E74C3C'];
        this.isAnimating = false;
        this.currentHighlightIndex = -1;
        this.winner = null;
        
        // Animation control
        this.animationStartTime = null;
        this.animationDuration = 4000; // 4 seconds
        this.targetIndex = null;
        
        // Load configuration from localStorage or use default
        this.loadConfiguration();
        
        this.init();
    }

    loadConfiguration() {
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

        const saved = localStorage.getItem('wheelConfig');
        const config = saved ? JSON.parse(saved) : DEFAULT_CONFIG;

        // Spin count and cheat control
        this.spinCount = 0;
        this.spin1Names = config.spin1Names || DEFAULT_CONFIG.spin1Names;
        this.spin2Names = config.spin2Names || DEFAULT_CONFIG.spin2Names;
        this.spin3Names = config.spin3Names || DEFAULT_CONFIG.spin3Names;
        this.spin4Names = config.spin4Names || DEFAULT_CONFIG.spin4Names;
        this.spin5Names = config.spin5Names || DEFAULT_CONFIG.spin5Names;
        this.spin6Names = config.spin6Names || DEFAULT_CONFIG.spin6Names;
        this.spin7Names = config.spin7Names || DEFAULT_CONFIG.spin7Names;
        this.spin8Names = config.spin8Names || DEFAULT_CONFIG.spin8Names;
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.draw();
        this.animateIdle();
    }

    setupCanvas() {
        const size = Math.min(this.canvas.parentElement.offsetWidth, this.canvas.parentElement.offsetHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY) - 1;
    }

    setupEventListeners() {
        // Canvas click to start random pick
        this.canvas.addEventListener('click', () => this.startPick());
        this.canvas.style.cursor = 'pointer';

        // Keyboard shortcut: Ctrl+Enter
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.startPick();
            }
        });

        // Editor changes
        const editor = document.querySelector('.basic-editor');
        
        // Handle Enter key in editor
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const newDiv = document.createElement('div');
                newDiv.textContent = '';
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                let currentDiv = range.startContainer;
                while (currentDiv && currentDiv.nodeName !== 'DIV') {
                    currentDiv = currentDiv.parentNode;
                }
                if (currentDiv && currentDiv.parentNode === editor) {
                    currentDiv.parentNode.insertBefore(newDiv, currentDiv.nextSibling);
                    const newRange = document.createRange();
                    newRange.setStart(newDiv, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } else {
                    editor.appendChild(newDiv);
                    newDiv.focus();
                }
                this.updateEntriesFromEditor();
            }
        });
        
        // Handle paste event
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length > 0) {
                editor.innerHTML = '';
                lines.forEach(line => {
                    const div = document.createElement('div');
                    div.textContent = line.trim();
                    editor.appendChild(div);
                });
                this.updateEntriesFromEditor();
            }
        });
        
        editor.addEventListener('input', () => this.updateEntriesFromEditor());
        editor.addEventListener('blur', () => this.updateEntriesFromEditor());

        // Shuffle button
        const shuffleBtn = document.querySelector('[aria-label="Shuffle"]');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.shuffle());
        }

        // Sort button
        const sortBtn = document.querySelector('[aria-label="Sort"]');
        if (sortBtn) {
            sortBtn.addEventListener('click', () => this.sort());
        }

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.draw();
        });
    }

    updateEntriesFromEditor() {
        const editor = document.querySelector('.basic-editor');
        const lines = Array.from(editor.children)
            .map(div => div.textContent.trim())
            .filter(text => text.length > 0);
        
        if (lines.length > 0 && JSON.stringify(lines) !== JSON.stringify(this.entries)) {
            this.entries = lines;
            this.spinCount = 0; // Reset spin count when entries change
            this.updateColors();
            this.updateEntryCount();
            this.draw();
        }
    }

    updateColors() {
        const baseColors = ['#5B8FED', '#E74C3C', '#FDB82C', '#43A047'];
        this.colors = [];
        
        for (let i = 0; i < this.entries.length; i++) {
            if (i === 0) {
                this.colors.push(baseColors[i % baseColors.length]);
            } else {
                let colorIndex = i % baseColors.length;
                let prevColor = this.colors[i - 1];
                while (baseColors[colorIndex] === prevColor) {
                    colorIndex = (colorIndex + 1) % baseColors.length;
                }
                this.colors.push(baseColors[colorIndex]);
            }
        }
    }

    updateEntryCount() {
        const badge = document.querySelector('.q-tab--active .q-badge');
        if (badge) {
            badge.textContent = this.entries.length;
            badge.setAttribute('aria-label', this.entries.length);
        }
    }

    shuffle() {
        for (let i = this.entries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.entries[i], this.entries[j]] = [this.entries[j], this.entries[i]];
        }
        this.updateEditor();
        this.updateColors();
        this.draw();
    }

    sort() {
        this.entries.sort();
        this.updateEditor();
        this.updateColors();
        this.draw();
    }

    updateEditor() {
        const editor = document.querySelector('.basic-editor');
        editor.innerHTML = this.entries.map(entry => `<div>${entry}</div>`).join('');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw shadow for entire wheel
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        this.ctx.shadowBlur = 25;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 10;
        
        // Draw a circle for shadow
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Draw wheel segments
        this.drawWheel();
        
        // Draw center circle
        this.drawCenterCircle();
    }

    drawWheel() {
        const numEntries = this.entries.length;
        const anglePerEntry = (Math.PI * 2) / numEntries;

        // Draw outer circle (border)
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 6;
        this.ctx.stroke();

        for (let i = 0; i < numEntries; i++) {
            const startAngle = (i * anglePerEntry);
            const endAngle = startAngle + anglePerEntry;
            const middleAngle = startAngle + anglePerEntry / 2;

            // Highlight current segment during animation
            const isHighlighted = (i === this.currentHighlightIndex);

            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            
            if (isHighlighted) {
                // Gold highlight with glow effect
                this.ctx.save();
                this.ctx.shadowColor = 'rgba(255, 215, 0, 1)';
                this.ctx.shadowBlur = 30;
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fill();
                this.ctx.restore();
            } else {
                this.ctx.fillStyle = this.colors[i];
                this.ctx.fill();
            }

            // Draw text with auto font sizing
            this.ctx.save();
            this.ctx.translate(this.centerX, this.centerY);
            this.ctx.rotate(middleAngle);
            
            // Calculate optimal font size based on text length and available space
            const text = this.entries[i];
            const textRadius = this.radius * 0.65;
            const maxWidth = this.radius * 0.5; // Maximum width for text
            
            let fontSize = Math.min(48, this.radius / 8);
            this.ctx.font = `${fontSize}px Roboto, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif`;
            let textWidth = this.ctx.measureText(text).width;
            
            // Reduce font size if text is too long
            while (textWidth > maxWidth && fontSize > 10) {
                fontSize -= 2;
                this.ctx.font = `${fontSize}px Roboto, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif`;
                textWidth = this.ctx.measureText(text).width;
            }
            
            // Text color
            const bgColor = isHighlighted ? '#FFD700' : this.colors[i];
            if (bgColor === '#43A047' || bgColor === '#FDB82C') {
                this.ctx.fillStyle = '#000';
            } else {
                this.ctx.fillStyle = '#fff';
            }
            
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 2;
            
            // Truncate text if still too long
            let displayText = text;
            if (textWidth > maxWidth) {
                displayText = text.substring(0, Math.floor(text.length * maxWidth / textWidth)) + '...';
            }
            
            this.ctx.fillText(displayText, textRadius, 0);
            
            this.ctx.restore();
        }
    }

    drawCenterCircle() {
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 4;
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius * 0.18, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        
        this.ctx.restore();
        
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius * 0.18, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    // Pick target index (with cheat support)
    pickTargetIndex() {
        let cheatName = null;
        
        if (this.spinCount === 1) {
            for (const name of this.spin1Names) {
                if (this.entries.includes(name)) {
                    cheatName = name;
                    break;
                }
            }
        } else if (this.spinCount === 2) {
            for (const name of this.spin2Names) {
                if (this.entries.includes(name)) {
                    cheatName = name;
                    break;
                }
            }
        } else if (this.spinCount === 3) {
            for (const name of this.spin3Names) {
                if (this.entries.includes(name)) {
                    cheatName = name;
                    break;
                }
            }
        } else if (this.spinCount === 4) {
            for (const name of this.spin4Names) {
                if (this.entries.includes(name)) {
                    cheatName = name;
                    break;
                }
            }
        } else if (this.spinCount === 5) {
            for (const name of this.spin5Names) {
                if (this.entries.includes(name)) {
                    cheatName = name;
                    break;
                }
            }
        } else if (this.spinCount === 6) {
            for (const name of this.spin6Names) {
                if (this.entries.includes(name)) {
                    cheatName = name;
                    break;
                }
            }
        } else if (this.spinCount === 7) {
            for (const name of this.spin7Names) {
                if (this.entries.includes(name)) {
                    cheatName = name;
                    break;
                }
            }
        } else if (this.spinCount === 8) {
            for (const name of this.spin8Names) {
                if (this.entries.includes(name)) {
                    cheatName = name;
                    break;
                }
            }
        }
        
        if (cheatName) {
            const index = this.entries.indexOf(cheatName);
            if (index !== -1) return index;
        }
        
        // Random but avoid future cheat names
        return this.getRandomExcludingFutureNames();
    }
    
    getRandomExcludingFutureNames() {
        // Collect all names reserved for future spins
        const futureNames = [];
        
        if (this.spinCount < 1) futureNames.push(...this.spin1Names);
        if (this.spinCount < 2) futureNames.push(...this.spin2Names);
        if (this.spinCount < 3) futureNames.push(...this.spin3Names);
        if (this.spinCount < 4) futureNames.push(...this.spin4Names);
        if (this.spinCount < 5) futureNames.push(...this.spin5Names);
        if (this.spinCount < 6) futureNames.push(...this.spin6Names);
        if (this.spinCount < 7) futureNames.push(...this.spin7Names);
        if (this.spinCount < 8) futureNames.push(...this.spin8Names);
        
        // Get available entries (excluding future reserved names)
        const availableEntries = this.entries.filter(entry => !futureNames.includes(entry));
        
        // If all entries are reserved, pick from all
        if (availableEntries.length === 0) {
            return Math.floor(Math.random() * this.entries.length);
        }
        
        // Pick random from available
        const randomEntry = availableEntries[Math.floor(Math.random() * availableEntries.length)];
        return this.entries.indexOf(randomEntry);
    }

    startPick() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.spinCount++;
        
        // Pick target
        this.targetIndex = this.pickTargetIndex();
        
        // Start highlight animation
        this.animationStartTime = performance.now();
        this.currentHighlightIndex = 0;
        this.animatePick();
    }

    animatePick() {
        if (!this.isAnimating) return;

        const now = performance.now();
        const elapsed = now - this.animationStartTime;
        const progress = Math.min(elapsed / this.animationDuration, 1);

        // Speed decreases over time (easing)
        const speed = 50 + (1 - progress) * 200; // Start fast, slow down
        
        if (progress >= 0.95) {
            // In final stage, lock to target
            this.currentHighlightIndex = this.targetIndex;
        } else {
            // Pick random index to highlight (not sequential)
            this.currentHighlightIndex = Math.floor(Math.random() * this.entries.length);
        }
        
        // Draw current state
        this.draw();

        if (progress >= 1) {
            // Animation complete - ensure target is highlighted
            this.currentHighlightIndex = this.targetIndex;
            this.draw();
            this.isAnimating = false;
            setTimeout(() => this.showWinner(), 500);
        } else {
            setTimeout(() => this.animatePick(), speed);
        }
    }

    animateIdle() {
        if (!this.isAnimating) {
            this.currentHighlightIndex = -1;
            this.draw();
        }
        requestAnimationFrame(() => this.animateIdle());
    }

    showWinner() {
        this.winner = this.entries[this.targetIndex];

        // Show winner dialog
        this.displayWinnerDialog();
        
        // Add confetti
        this.launchConfetti();
    }

    displayWinnerDialog() {
        const overlay = document.createElement('div');
        overlay.className = 'winner-overlay';
        overlay.innerHTML = `
            <div class="winner-dialog">
                <div class="winner-header">We have a winner!</div>
                <div class="winner-name">${this.winner}</div>
                <div class="winner-actions">
                    <button class="q-btn q-btn--unelevated winner-btn-close">Close</button>
                    <button class="q-btn q-btn--unelevated bg-primary text-white winner-btn-remove">Remove</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('.winner-btn-close').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.querySelector('.winner-btn-remove').addEventListener('click', () => {
            this.removeWinner();
            overlay.remove();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    removeWinner() {
        const index = this.entries.indexOf(this.winner);
        if (index > -1) {
            this.entries.splice(index, 1);
            this.colors.splice(index, 1);
            this.updateEditor();
            this.updateEntryCount();
            this.currentHighlightIndex = -1;
            this.draw();
            
            // Update results count
            const resultsTab = document.querySelectorAll('.q-tab')[1];
            if (resultsTab) {
                const resultsBadge = resultsTab.querySelector('.q-badge');
                const currentCount = parseInt(resultsBadge.textContent) || 0;
                resultsBadge.textContent = currentCount + 1;
            }
        }
    }

    launchConfetti() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            
            for (let i = 0; i < particleCount; i++) {
                createConfettiParticle(
                    randomInRange(0.1, 0.9),
                    randomInRange(0.1, 0.9)
                );
            }
        }, 250);
    }
}

function createConfettiParticle(x, y) {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.style.left = (x * window.innerWidth) + 'px';
    particle.style.top = (y * window.innerHeight) + 'px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    particle.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 3000);
}

// Initialize picker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RandomPicker();
});
