// Wheel of Names - JavaScript Logic

class WheelOfNames {
    constructor() {
        this.canvas = document.querySelector('.wheel-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.entries = ['Ali', 'Beatriz', 'Charles', 'Fatima', 'Gabriel', 'Hanna'];
        this.colors = ['#5B8FED', '#E74C3C', '#FDB82C', '#43A047', '#5B8FED', '#E74C3C'];
        this.currentRotation = 0;
        this.isSpinning = false;
        this.spinSpeed = 0;
        this.friction = 0.985;
        this.minSpeed = 0.001;
        this.idleRotationSpeed = 0.002;
        this.winner = null;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.draw();
        this.animate();
    }

    setupCanvas() {
        const size = Math.min(this.canvas.parentElement.offsetWidth, this.canvas.parentElement.offsetHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = (Math.min(this.centerX, this.centerY) - 10) * 0.85;
    }

    setupEventListeners() {
        // Spin button click (hidden but still functional)
        const spinButton = document.querySelector('.spin-button');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.spin());
        }

        // Canvas click
        this.canvas.addEventListener('click', () => this.spin());

        // Keyboard shortcut: Ctrl+Enter
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.spin();
            }
        });

        // Editor changes
        const editor = document.querySelector('.basic-editor');
        
        // Xử lý Enter key trong editor
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                
                // Tạo div mới
                const newDiv = document.createElement('div');
                newDiv.textContent = '';
                
                // Lấy selection hiện tại
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                // Tìm div cha
                let currentDiv = range.startContainer;
                while (currentDiv && currentDiv.nodeName !== 'DIV') {
                    currentDiv = currentDiv.parentNode;
                }
                
                if (currentDiv && currentDiv.parentNode === editor) {
                    // Chèn div mới sau div hiện tại
                    currentDiv.parentNode.insertBefore(newDiv, currentDiv.nextSibling);
                    
                    // Focus vào div mới
                    const newRange = document.createRange();
                    newRange.setStart(newDiv, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } else {
                    // Nếu không tìm thấy, thêm vào cuối
                    editor.appendChild(newDiv);
                    newDiv.focus();
                }
                
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
                // Phần tử đầu tiên chọn màu bất kỳ
                this.colors.push(baseColors[i % baseColors.length]);
            } else {
                // Tìm màu khác với màu trước đó
                let colorIndex = i % baseColors.length;
                let prevColor = this.colors[i - 1];
                
                // Nếu màu hiện tại trùng với màu trước, chọn màu tiếp theo
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
        this.draw();
    }

    sort() {
        this.entries.sort();
        this.updateEditor();
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
        
        // Draw wheel
        this.drawWheel();
        
        // Draw center circle
        this.drawCenterCircle();
        
        // Draw arrow
        this.drawArrow();
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
            const startAngle = this.currentRotation + (i * anglePerEntry);
            const endAngle = startAngle + anglePerEntry;
            const middleAngle = startAngle + anglePerEntry / 2;

            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(this.centerX, this.centerY);
            this.ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = this.colors[i];
            this.ctx.fill();

            // Draw text - aligned with slice center
            this.ctx.save();
            this.ctx.translate(this.centerX, this.centerY);
            this.ctx.rotate(middleAngle);
            
            // Font
            const fontSize = 48;
            this.ctx.font = `${fontSize}px Roboto, -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif`;
            
            // Chọn màu chữ theo màu nền
            const bgColor = this.colors[i];
            if (bgColor === '#43A047' || bgColor === '#FDB82C') {
                // Xanh lá và vàng -> chữ đen
                this.ctx.fillStyle = '#000';
            } else {
                // Đỏ và xanh dương -> chữ trắng
                this.ctx.fillStyle = '#fff';
            }
            
            // Căn giữa chuẩn
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 2;
            
            // Vị trí chữ: giữa slice
            const textRadius = this.radius * 0.65;
            
            // Vẽ chữ
            this.ctx.fillText(this.entries[i], textRadius, 0);
            
            this.ctx.restore();
        }
    }

    drawCenterCircle() {
        // Shadow for center circle
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 4;
        
        // White center circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius * 0.18, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        
        this.ctx.restore();
        
        // Border for center circle
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius * 0.18, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    drawArrow() {
        const arrowSize = 35;
        const arrowX = this.centerX + this.radius + 5;
        const arrowY = this.centerY;

        // Get the color of the segment the arrow is pointing to
        const segmentColor = this.getArrowColor();

        this.ctx.save();
        this.ctx.translate(arrowX, arrowY);
        
        // Shadow for arrow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = -2;
        this.ctx.shadowOffsetY = 2;
        
        // Draw arrow triangle - pointing right (from outside into wheel)
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(arrowSize, -arrowSize * 0.6);
        this.ctx.lineTo(arrowSize, arrowSize * 0.6);
        this.ctx.closePath();
        
        // Use segment color for arrow
        this.ctx.fillStyle = segmentColor;
        this.ctx.fill();
        
        // White border for arrow
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    getArrowColor() {
        // Calculate which segment the arrow is pointing to
        const numEntries = this.entries.length;
        const anglePerEntry = (Math.PI * 2) / numEntries;
        
        // Arrow points to the right (0 degrees)
        // Normalize rotation to 0-2π
        let normalizedRotation = this.currentRotation % (Math.PI * 2);
        if (normalizedRotation < 0) normalizedRotation += Math.PI * 2;
        
        // Find which segment is at the arrow position
        const arrowAngle = 0; // Arrow is at 0 degrees (pointing right)
        let segmentIndex = Math.floor((Math.PI * 2 - normalizedRotation) / anglePerEntry) % numEntries;
        
        return this.colors[segmentIndex];
    }

    spin() {
        if (this.isSpinning) return;

        this.isSpinning = true;
        // Tốc độ ban đầu để quay kéo dài ~6 giây
        this.spinSpeed = 0.6 + Math.random() * 0.2;
    }

    animate() {
        if (this.isSpinning) {
            this.currentRotation += this.spinSpeed;
            this.spinSpeed *= this.friction;

            if (this.spinSpeed < this.minSpeed) {
                this.isSpinning = false;
                this.spinSpeed = 0;
                this.showWinner();
            }
        } else {
            // Idle rotation
            this.currentRotation += this.idleRotationSpeed;
        }

        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    showWinner() {
        // Calculate winner based on current rotation
        const numEntries = this.entries.length;
        const anglePerEntry = (Math.PI * 2) / numEntries;
        
        let normalizedRotation = this.currentRotation % (Math.PI * 2);
        if (normalizedRotation < 0) normalizedRotation += Math.PI * 2;
        
        const winnerIndex = Math.floor((Math.PI * 2 - normalizedRotation) / anglePerEntry) % numEntries;
        this.winner = this.entries[winnerIndex];

        // Cập nhật lại màu sau khi quay
        this.updateColors();

        // Show winner dialog
        this.displayWinnerDialog();
        
        // Add confetti
        this.launchConfetti();
    }

    displayWinnerDialog() {
        // Create dialog overlay
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

        // Add event listeners
        overlay.querySelector('.winner-btn-close').addEventListener('click', () => {
            overlay.remove();
        });

        overlay.querySelector('.winner-btn-remove').addEventListener('click', () => {
            this.removeWinner();
            overlay.remove();
        });

        // Click outside to close
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
            this.draw();
            
            // Update results count
            const resultsTab = document.querySelectorAll('.q-tab')[1];
            const resultsBadge = resultsTab.querySelector('.q-badge');
            const currentCount = parseInt(resultsBadge.textContent) || 0;
            resultsBadge.textContent = currentCount + 1;
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
            
            // Create confetti particles
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

// Initialize wheel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WheelOfNames();
});
