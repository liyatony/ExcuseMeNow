
// Firebase Configuration remains same as original
const CONFIG = {
    firebase: {
        apiKey: "AIzaSyB-XUHNBWm3rAEVo_ZH5zpUllULHubFVjY",
        authDomain: "excuse-generator-334bb.firebaseapp.com",
        projectId: "excuse-generator-334bb",
        storageBucket: "excuse-generator-334bb.appspot.com",
        messagingSenderId: "769427317796",
        appId: "1:769427317796:web:de3bd3bf971524f115a4b1",
        measurementId: "G-QTP69W1D8P"
    },
    gemini: {
        apiKey: "AIzaSyDtR4hiU35AgcH_lW0smALDRyKyg-985ZI"
    }
};

// Button texts array remains same
const buttonTexts = [
    "🎪 Conjure Epic Excuse 🎪",
    "✨ Summon Perfect Alibi ✨",
    "🎭 Deploy Excuse Shield 🎭",
    "🌟 Activate Excuse-O-Matic 🌟",
    "🎩 Fabricate Brilliance 🎩",
    "🎨 Paint My Excuse 🎨",
    "🎡 Spin The Excuse Wheel 🎡",
    "🎪 Release The Krex-cuse! 🎪",
    "✨ Unleash The Magic ✨",
    "🎭 Time To Get Creative! 🎭"
];

// Updated predefined excuses to be shorter
const predefinedExcuses = {
    professional: [
        "I must address an urgent client matter that requires immediate attention.",
        "An unexpected system upgrade is requiring my immediate oversight.",
        "A critical deadline in another project needs my immediate focus.",
        "I'm attending an emergency departmental briefing.",
        "An urgent compliance matter requires my immediate attention."
    ],
    creative: [
        "My temporary transformation into a potato has initiated an impromptu adventure.",
        "A time-traveling pigeon delivered an urgent message from my future self.",
        "My pet unicorn is having an existential crisis.",
        "I've been recruited for an emergency rainbow repair mission.",
        "My shadow decided to take a day off and I need to find it."
    ],
    casual: [
        "Got caught in an epic Netflix marathon, totally lost track of time!",
        "My alarm clock went on strike this morning.",
        "My coffee maker staged a rebellion.",
        "Lost in a heated debate with my houseplant.",
        "My cat hid my car keys again."
    ]
};

// Style guides updated for shorter responses
const styleGuides = {
    professional: "brief, formal business excuse",
    creative: "short, whimsical excuse with fantastic elements",
    casual: "brief, informal explanation"
};

// FirebaseManager class remains the same
class FirebaseManager {
    constructor(config) {
        this.db = null;
        this.initializeFirebase(config);
    }

    initializeFirebase(config) {
        try {
            firebase.initializeApp(config);
            this.db = firebase.firestore();
            console.log("Firebase initialized successfully.");
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.handleError('init', error);
        }
    }

    async saveExcuse(excuse, style, professionalism) {
        if (!this.db) return null;
        try {
            const docRef = await this.db.collection('excuses').add({
                text: excuse,
                style: style,
                professionalism: professionalism,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                category: style.toLowerCase(),
                professionalismRange: Math.round(professionalism / 10) * 10
            });
            return docRef.id;
        } catch (error) {
            this.handleError('save', error);
            return null;
        }
    }

    async getRandomExcuse(style, professionalism) {
        if (!this.db) return null;
        try {
            const snapshot = await this.db.collection('excuses')
                .where('category', '==', style.toLowerCase())
                .where('professionalismRange', '>=', Math.floor((professionalism - 20) / 10) * 10)
                .where('professionalismRange', '<=', Math.floor((professionalism + 20) / 10) * 10)
                .orderBy('professionalismRange')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            return snapshot.empty ? null : snapshot.docs[0].data().text;
        } catch (error) {
            this.handleError('get', error);
            return null;
        }
    }

    handleError(operation, error) {
        const errorMessages = {
            init: "Firebase initialization failed. Check your configuration and network connection.",
            save: "Failed to save excuse to Firebase. Check your Firestore permissions and rules.",
            get: "Failed to retrieve excuse from Firebase. Ensure Firestore rules allow reads."
        };
        console.error(`${errorMessages[operation]} Error:`, error);
    }
}

// Updated ExcuseGenerator class
class ExcuseGenerator {
    constructor(firebaseManager, geminiApiKey) {
        this.firebaseManager = firebaseManager;
        this.geminiApiKey = geminiApiKey;
        this.initializeUI();
    }

    // Previous UI initialization methods remain the same
    initializeUI() {
        this.elements = {
            generateButton: document.getElementById('generateButton'),
            buttonText: document.getElementById('button-text'),
            modal: document.getElementById('excuseModal'),
            closeModal: document.getElementById('closeModal'),
            styleButtons: document.querySelectorAll('.style-option'),
            excuseResult: document.getElementById('excuse-result')
        };

        this.setupEventListeners();
        this.initializeStyleButtons();
        this.updateButtonText();
    }

    setupEventListeners() {
        this.elements.generateButton.addEventListener('click', () => this.generateExcuse());
        this.elements.closeModal.addEventListener('click', () => this.elements.modal.style.display = 'none');
        window.onclick = (event) => {
            if (event.target === this.elements.modal) {
                this.elements.modal.style.display = 'none';
            }
        };
    }

    initializeStyleButtons() {
        this.elements.styleButtons.forEach(button => {
            button.classList.remove('active');
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.elements.styleButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
        document.querySelector('[data-style="creative"]').classList.add('active');
    }

    updateButtonText() {
        const randomText = buttonTexts[Math.floor(Math.random() * buttonTexts.length)];
        this.elements.buttonText.innerText = randomText;
    }

    // Updated generateAIExcuse method
    async generateAIExcuse(recipient, situation, style, professionalism) {
        try {
            const prompt = `Generate a very short ${style} excuse (maximum 50 words) about ${situation}.
                           Style: ${styleGuides[style]}
                           Keep it brief and creative.`;
    
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.geminiApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ 
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 100
                    }
                })
            });
    
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
    
            const result = await response.json();
            const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) {
                throw new Error('No text generated from AI');
            }
    
            // Format the excuse with proper greeting and closing
            return this.formatExcuse(recipient, generatedText.trim());
        } catch (error) {
            console.error('AI Generation Error:', error);
            return this.formatExcuse(recipient, this.getFallbackExcuse(style));
        }
    }

    // New method to format excuses
    formatExcuse(recipient, excuseText) {
        const greeting = `Dearest and most understanding ${recipient},\n\n`;
        const closing = "\n\nWith utmost creativity,\nYour Dedicated Excuse Artist";
        return greeting + excuseText + closing;
    }

    getFallbackExcuse(style) {
        return predefinedExcuses[style][Math.floor(Math.random() * predefinedExcuses[style].length)];
    }

    async generateExcuse() {
        const recipient = document.getElementById('recipient').value || 'friend';
        const situation = document.getElementById('situation').value || 'the situation';
        const professionalism = parseInt(document.getElementById('professionalism').value) || 50;
        const selectedStyle = document.querySelector('.style-option.active')?.dataset.style || 'creative';

        this.elements.generateButton.disabled = true;
        this.elements.buttonText.innerText = '🤔 Crafting Excellence...';

        try {
            let excuse;
            const useAI = Math.random() < 0.7;

            if (useAI) {
                excuse = await this.generateAIExcuse(recipient, situation, selectedStyle, professionalism);
                await this.firebaseManager.saveExcuse(excuse, selectedStyle, professionalism);
            } else {
                const storedExcuse = await this.firebaseManager.getRandomExcuse(selectedStyle, professionalism);
                excuse = storedExcuse ? 
                    this.formatExcuse(recipient, storedExcuse) : 
                    await this.generateAIExcuse(recipient, situation, selectedStyle, professionalism);
            }

            this.elements.excuseResult.innerText = excuse;
            this.elements.modal.style.display = 'block';
        } catch (error) {
            console.error("Error generating excuse:", error);
            this.elements.excuseResult.innerText = 'Oops! The excuse machine needs an excuse for itself! 😅 Please try again.';
            this.elements.modal.style.display = 'block';
        } finally {
            this.elements.generateButton.disabled = false;
            this.updateButtonText();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const firebaseManager = new FirebaseManager(CONFIG.firebase);
    const excuseGenerator = new ExcuseGenerator(firebaseManager, CONFIG.gemini.apiKey);
});