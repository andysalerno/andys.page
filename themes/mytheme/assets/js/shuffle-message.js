const tagLines = [
    'Cautiously optimistic',
    'Brewer of coffee ☕',
    'Breaker of email chains',
    'Occasionally overeager',
    'Beatle person',
    'Prone to rambling',
    'Long time reader first time blogger',
    'Talks while muted',
    'Pronounces it "jiff"',
    'Night owl',
    'Probably humming somewhere',
    'Just married!'
];

class TaglineAnimator {
    constructor(containerSelector = '.bonusTagline', options = {}) {
        this.container = document.querySelector(containerSelector);
        this.typeSpeed = options.typeSpeed || 60;
        this.prefix = options.prefix || ' / ';
        this.timeouts = [];
        
        if (!this.container) {
            console.warn(`TaglineAnimator: Container '${containerSelector}' not found`);
            return;
        }
    }

    getRndInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    getRandomTagline() {
        const randomIndex = this.getRndInteger(0, tagLines.length);
        return tagLines[randomIndex];
    }

    clearTimeouts() {
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts = [];
    }

    setTagline(tagline) {
        if (!this.container) return;
        this.clearTimeouts();
        this.container.textContent = this.prefix + tagline;
    }

    typeTagline(tagline) {
        if (!this.container) return;
        
        this.clearTimeouts();
        this.container.textContent = this.prefix;

        for (let i = 0; i <= tagline.length; i++) {
            const timeout = setTimeout(() => {
                if (this.container) {
                    this.container.textContent = this.prefix + tagline.substring(0, i);
                }
            }, i * this.typeSpeed);
            
            this.timeouts.push(timeout);
        }
    }

    animateRandomTagline() {
        const selectedTagline = this.getRandomTagline();
        this.typeTagline(selectedTagline);
    }

    destroy() {
        this.clearTimeouts();
    }
}

// Initialize when DOM is ready
function initTaglineAnimation() {
    const animator = new TaglineAnimator();
    animator.animateRandomTagline();
    
    // Store reference globally for potential cleanup
    window.taglineAnimator = animator;
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTaglineAnimation);
} else {
    initTaglineAnimation();
}