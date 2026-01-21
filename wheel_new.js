// Random Picker with Highlight Effect - JavaScript Logic

class RandomPicker {
    constructor() {
        this.entries = ['Ali', 'Beatriz', 'Charles', 'Fatima', 'Gabriel', 'Hanna'];
        this.colors = ['#5B8FED', '#E74C3C', '#FDB82C', '#43A047'];
        this.isAnimating = false;
        this.currentHighlightIndex = 0;
        this.winner = null;
        this.highlightInterval = null;
        
        // Animation control
        this.animationStartTime = null;
        this.animationDuration = 3000; // 3 seconds
        this.targetIndex = null;
        
        // Spin count and cheat control
        this.spinCount = 0;
        this.spin1Names = ['Sinh Huy', 'Đoàn Hiếu', 'Châu Anh', 'Mạnh Hùng', 'Việt Quang'];
        this.spin2Names = ['Thế Pháp', 'Quang Anh', 'Anh Tài', 'Trung Nghĩa'];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderList();
    }

    setupEventListeners() {
        // Spin button click
        const spinButton = document.querySelector('.spin-button');
        if (spinButton) {
            spinButton.addEventListener('click', () => this.startPick());
        }

        // Canvas click (use wheel-canvas area for compatibility)
        const canvas = document.querySelector('.wheel-canvas');
        if (canvas) {
            canvas.style.display = 'none'; // Hide canvas
            const container = canvas.parentElement;
            const pickButton = document.createElement('button');
            pickButton.className = 'pick-button';
            pickButton.textContent = 'Pick Random';
            pickButton.style.cssText = 'font-size: 24px; padding: 20px 40px; background: #5B8FED; color: white; border: none; border-radius: 10px; cursor: pointer; margin: 20px auto; display: block;';
            container.appendChild(pickButton);
            pickButton.addEventListener('click', () => this.startPick());
        }

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
    }

    updateEntriesFromEditor() {
        const editor = document.querySelector('.basic-editor');
        const lines = Array.from(editor.children)
            .map(div => div.textContent.trim())
            .filter(text => text.length > 0);
        
        if (lines.length > 0 && JSON.stringify(lines) !== JSON.stringify(this.entries)) {
            this.entries = lines;
            this.spinCount = 0; // Reset spin count when entries change
            this.updateEntryCount();
            this.renderList();
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
        this.renderList();
    }

    sort() {
        this.entries.sort();
        this.updateEditor();
        this.renderList();
    }

    updateEditor() {
        const editor = document.querySelector('.basic-editor');
        editor.innerHTML = this.entries.map(entry => `<div>${entry}</div>`).join('');
    }

    renderList() {
        // Create or update the list display
        let listContainer = document.querySelector('.picker-list');
        if (!listContainer) {
            const canvas = document.querySelector('.wheel-canvas');
            const container = canvas ? canvas.parentElement : document.body;
            listContainer = document.createElement('div');
            listContainer.className = 'picker-list';
            listContainer.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; padding: 20px; max-width: 800px; margin: 0 auto;';
            container.appendChild(listContainer);
        }

        listContainer.innerHTML = '';
        this.entries.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'picker-item';
            item.dataset.index = index;
            item.textContent = entry;
            const color = this.colors[index % this.colors.length];
            item.style.cssText = `
                padding: 20px;
                background: ${color};
                color: white;
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                border-radius: 10px;
                transition: transform 0.2s, box-shadow 0.2s;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
            listContainer.appendChild(item);
        });
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
        }
        
        if (cheatName) {
            const index = this.entries.indexOf(cheatName);
            if (index !== -1) return index;
        }
        
        return Math.floor(Math.random() * this.entries.length);
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
        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;

        const now = performance.now();
        const elapsed = now - this.animationStartTime;
        const progress = Math.min(elapsed / this.animationDuration, 1);

        // Speed decreases over time (easing)
        const speed = 50 + (1 - progress) * 200; // Start fast, slow down
        
        // Highlight next item
        const items = document.querySelectorAll('.picker-item');
        items.forEach((item, index) => {
            if (index === this.currentHighlightIndex) {
                item.style.transform = 'scale(1.15)';
                item.style.boxShadow = '0 8px 20px rgba(255,255,255,0.8)';
                item.style.border = '4px solid white';
            } else {
                item.style.transform = 'scale(1)';
                item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                item.style.border = 'none';
            }
        });

        if (progress >= 1) {
            // Animation complete - snap to target
            this.currentHighlightIndex = this.targetIndex;
            items.forEach((item, index) => {
                if (index === this.targetIndex) {
                    item.style.transform = 'scale(1.2)';
                    item.style.boxShadow = '0 10px 30px rgba(255,255,0,0.8)';
                    item.style.border = '5px solid yellow';
                } else {
                    item.style.transform = 'scale(1)';
                    item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                    item.style.border = 'none';
                }
            });
            this.isAnimating = false;
            this.showWinner();
        } else {
            // Move to next index
            this.currentHighlightIndex = (this.currentHighlightIndex + 1) % this.entries.length;
            setTimeout(() => this.animate(), speed);
        }
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
            this.updateEditor();
            this.updateEntryCount();
            this.renderList();
            
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
