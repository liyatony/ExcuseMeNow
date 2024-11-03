// Firebase Configuration
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

// Dynamic button texts array
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

// Predefined fallback excuses by category
const predefinedExcuses = {
    professional: [
        "I apologize for the delay; I was caught up with another commitment.",
        "Due to unforeseen circumstances, I won't be able to attend the meeting today.",
        "I'm dealing with an urgent personal matter, so I won't make it in time.",
        "I need to reschedule as I'm currently preoccupied with another project.",
        "I have a prior engagement that I cannot miss. I'll catch up afterward."
    ],
    creative: [
        "An alien spaceship landed in my yard, and I was busy negotiating peace!",
        "A portal to another dimension opened, and I had to investigate!",
        "My pet dragon escaped, and I had to chase it down!",
        "The universe aligned and demanded my presence for an intergalactic event!",
        "I was on a secret mission that involved a talking rabbit and a time machine!"
    ],
    casual: [
        "I totally lost track of time, my bad!",
        "Something came up last minute, I'll catch up later.",
        "Got held up with some errands, I'll be a bit late!",
        "Overslept and rushing over now!",
        "Sorry, was just caught in the moment with something else!"
    ]
};

// Style guides for different excuse types
const styleGuides = {
    professional: "formal business language, polite and respectful",
    creative: "imaginative and entertaining, possibly involving fantastic elements",
    casual: "friendly and informal, conversational tone"
};

// Firebase initialization
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

// Excuse Generator class
class ExcuseGenerator {
    constructor(firebaseManager, geminiApiKey) {
        this.firebaseManager = firebaseManager;
        this.geminiApiKey = geminiApiKey;
        this.initializeUI();
    }

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

    async generateAIExcuse(recipient, situation, style, professionalism) {
        try {
            const prompt = `Generate a ${style} excuse message for ${recipient} about ${situation}.
                           Professionalism level: ${professionalism}/100.
                           Style guide: ${styleGuides[style]}
                           Format:
                           - Start with a proper greeting
                           - Include a creative explanation
                           - End with an appropriate closing`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            return result.choices?.[0]?.text?.trim() || this.getFallbackExcuse(style);
        } catch (error) {
            console.error('AI Generation Error:', error);
            return this.getFallbackExcuse(style);
        }
    }

    getFallbackExcuse(style) {
        return predefinedExcuses[style][Math.floor(Math.random() * predefinedExcuses[style].length)];
    }

    async generateExcuse() {
        const recipient = document.getElementById('recipient').value || 'Distinguished Individual';
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
                excuse = await this.firebaseManager.getRandomExcuse(selectedStyle, professionalism) 
                    || await this.generateAIExcuse(recipient, situation, selectedStyle, professionalism);
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