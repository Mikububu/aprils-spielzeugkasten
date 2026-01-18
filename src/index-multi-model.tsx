import { apiClient, ModelProvider } from './api/client';
import { auth, db, storage, signIn } from '../firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

// Constants
const DB_NAME = 'AprilsToyboxDB';
const DB_STORE = 'gallery';
const DB_VERSION = 3;

// State
let sourceImages = { a: null as string | null, b: null as string | null };
let sourceMimes = { a: null as string | null, b: null as string | null };
let activeSlot: 'a' | 'b' | null = null;
let currentUser = null;
let mergeMode: 'blend' | 'couple' = 'blend';
let selectedProvider: string = 'google'; // Default
let availableProviders: ModelProvider[] = [];

let clayBase64: string | null = null;
let clayMimeType: string = 'image/png';
let selectedAspect = '16:9';
let selectedStyle = 'PORTRAIT';
let gallery: Array<any> = [];

// Session state
let sessionCost = 0.00;
let isExtendVideo = false;
let isAudioMuted = true;

const DEFAULT_STYLES: Record<string, string> = {
    'COMIC': 'Medium shot showing ENTIRE HEAD AND TORSO. Slightly comic/caricature claymation style. Bold, expressive features. Saturated, distinct colors (not washed out). Solid, tangible plasticine material. Playful proportions but high-quality clay texture. Studio lighting with clear shadows.',
    'LINOCUT': 'High-contrast LINOCUT WOODBLOCK PRINT style. Bold black ink on textured off-white paper. Rough, hand-carved edges and negative space. Minimalist palette (mostly black/white with a single accent color like red). Folk art aesthetic. 2D graphic illustration.',
    'PORTRAIT': 'Exquisite artisan clay portrait against a CLEAN WHITE BACKGROUND. Soft, sophisticated color palette. Rich colors, not washed out. Hand-sculpted details with visible fingerprints. Expressive glass bead eyes. Soft studio lighting. Elegant and understated.',
    'WARM': 'A masterpiece of stop-motion claymation. Hand-sculpted artisan clay with visible, tactile thumbprints and subtle molding imperfections. The characters have soulful, expressive eyes made of glass beads. Rich, warm studio lighting with soft shadows. High-end polymer clay textures (like Sculpey or Fimo). Cinematic macro photography.',
    'RAW': 'Authentic terracotta and stoneware clay sculpture. Rough, unfinished textures with deep tool marks and heavy fingerprints. Natural, earthy clay pigments. Soft morning window light. Highly tactile and organic, feeling like a work-in-progress on a sculptor\'s bench.',
    'POP': 'Vibrant, saturated plasticine claymation style. Smooth, bold-colored clay with a slight oily sheen. Fun, expressive features reminiscent of classic high-budget stop-motion films. Clean, bright three-point studio lighting. Every detail feels like it was carefully pinched and rolled by hand.',
    'NOIR': 'Dramatic high-contrast claymation. Deep black and stark white clay with crimson accents. Extremely detailed textures where the clay looks weathered and aged. Heavy shadows, moody "Sin City" style lighting. Visible clay seams and handcrafted grit.',
    'REALISTIC': 'Photorealistic style. Natural lighting and textures. High detail and clarity.',
    'ANIME': 'Anime and manga style. Bold lines, vibrant colors, expressive characters.',
    'NONE': ''
};

let styleConfig: Record<string, string> = {};

try {
    const saved = localStorage.getItem('april_styles');
    if (saved) {
        styleConfig = JSON.parse(saved);
        styleConfig = { ...DEFAULT_STYLES, ...styleConfig };
    } else {
        styleConfig = { ...DEFAULT_STYLES };
    }
} catch (e) {
    styleConfig = { ...DEFAULT_STYLES };
}

function saveStyles() {
    localStorage.setItem('april_styles', JSON.stringify(styleConfig));
}

const reassuringMessages = [
    "KNEADING THE CLAY...",
    "FORMING TACTILE TEXTURES...",
    "ADJUSTING STUDIO LIGHTBOX...",
    "REFINING HAND-SCULPTED DETAILS...",
    "CAPTURING MACRO STOP-MOTION...",
    "POLISHING POLYMER SURFACES...",
    "SIMULATING CLAY PHYSICS...",
    "RENDERING ARTISAN MASTERPIECE..."
];

const stylePalette = [
    '#FFF000', '#00F0FF', '#00FF41', '#FF3131',
    '#FF9100', '#FF00E5', '#AD00FF', '#FFFFFF'
];

const modelColors: Record<string, string> = {
    'google': '#4285F4',
    'minimax': '#FF6B6B',
    'runpod': '#00FF88',
    'replicate': '#9C27B0',
    'stability': '#FFB300'
};

function getStyleColor(name: string): string {
    if (name === 'NONE') return '#D0D0D0';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % stylePalette.length;
    return stylePalette[index];
}

const els = {
    authBtn: document.getElementById('authBtn') as HTMLButtonElement,
    slotA: document.getElementById('slotA'),
    slotB: document.getElementById('slotB'),
    removeA: document.getElementById('removeA'),
    removeB: document.getElementById('removeB'),
    fileInput: document.getElementById('fileInput') as HTMLInputElement,
    promptInput: document.getElementById('promptInput') as HTMLInputElement,
    generateBtn: document.getElementById('generateBtn') as HTMLButtonElement,
    clayImg: document.getElementById('clayImg') as HTMLImageElement,
    finalVideo: document.getElementById('finalVideo') as HTMLVideoElement,
    placeholder: document.getElementById('placeholder'),
    actionInput: document.getElementById('actionInput') as HTMLInputElement,
    animateBtn: document.getElementById('animateBtn') as HTMLButtonElement,
    animBlock: document.getElementById('animBlock'),
    animHint: document.getElementById('animHint'),
    loadingTitle: document.getElementById('loadingTitle'),
    artboardOverlay: document.getElementById('artboardOverlay'),
    statusText: document.getElementById('statusText'),
    recipeSelector: document.getElementById('recipeSelector'),
    modelSelector: document.getElementById('modelSelector'),
    modelInfo: document.getElementById('modelInfo'),
    galleryList: document.getElementById('galleryList'),
    styleNameInput: document.getElementById('styleNameInput') as HTMLInputElement,
    stylePromptEditor: document.getElementById('stylePromptEditor') as HTMLTextAreaElement,
    resetStylesBtn: document.getElementById('resetStylesBtn'),
    mergeControls: document.getElementById('mergeControls'),
    btnMergeBlend: document.getElementById('btnMergeBlend'),
    btnMergeCouple: document.getElementById('btnMergeCouple'),
    sessionCostDisplay: document.getElementById('sessionCostDisplay'),
    imgCostLabel: document.getElementById('imgCostLabel'),
    vidCostLabel: document.getElementById('vidCostLabel'),
    toggleExtend: document.getElementById('toggleExtend'),
    toggleAudio: document.getElementById('toggleAudio'),
};

// Initialize API Client
async function initializeProviders() {
    setBusy(true, "CONNECTING TO MODELS...", "INITIALIZING...");
    await apiClient.initialize();
    availableProviders = apiClient.getProviders();
    
    if (availableProviders.length === 0) {
        alert("⚠️ No AI providers available. Please check backend configuration.");
        setBusy(false);
        return;
    }
    
    // Set default provider
    selectedProvider = availableProviders[0].provider;
    
    renderModelSelector();
    updateCostEstimates();
    setBusy(false);
}

function renderModelSelector() {
    if (!els.modelSelector) return;
    els.modelSelector.innerHTML = '';
    
    availableProviders.forEach(provider => {
        const div = document.createElement('div');
        div.className = `recipe-card ${provider.provider === selectedProvider ? 'active' : ''}`;
        div.style.backgroundColor = modelColors[provider.provider] || '#999';
        div.innerHTML = `<span>${provider.name.split(' ')[0].toUpperCase()}</span>`;
        div.title = `${provider.name}\nImage: ${provider.supportsImage ? '✓' : '✗'} | Video: ${provider.supportsVideo ? '✓' : '✗'}\nCensored: ${provider.censored ? 'Yes' : 'No'}`;
        div.onclick = () => {
            selectedProvider = provider.provider;
            renderModelSelector();
            updateModelInfo();
            updateCostEstimates();
        };
        els.modelSelector.appendChild(div);
    });
    
    updateModelInfo();
}

function updateModelInfo() {
    const provider = apiClient.getProvider(selectedProvider);
    if (!provider || !els.modelInfo) return;
    
    const censorBadge = provider.censored ? 
        '<span style="color:red;">🔒 CENSORED</span>' : 
        '<span style="color:#00FF41;">🔓 UNCENSORED</span>';
    
    els.modelInfo.innerHTML = `
        <strong>${provider.name}</strong><br>
        ${censorBadge}<br>
        Image: ${provider.supportsImage ? '✓' : '✗'} | 
        Video: ${provider.supportsVideo ? '✓' : '✗'} | 
        Img2Img: ${provider.supportsImageToImage ? '✓' : '✗'}
    `;
}

function updateCostEstimates() {
    const provider = apiClient.getProvider(selectedProvider);
    if (!provider) return;
    
    if (els.imgCostLabel && provider.costPerImage) {
        els.imgCostLabel.textContent = `(EST. ~$${provider.costPerImage.toFixed(2)})`;
    }
    if (els.vidCostLabel && provider.costPerVideo) {
        const totalCost = isExtendVideo ? (provider.costPerVideo * 2) : provider.costPerVideo;
        els.vidCostLabel.textContent = `(EST. ~$${totalCost.toFixed(2)})`;
    }
}

// --- COST & UI ---
function addCost(amount: number) {
    sessionCost += amount;
    if (els.sessionCostDisplay) {
        els.sessionCostDisplay.textContent = `$${sessionCost.toFixed(2)}`;
    }
}

if (els.toggleExtend) {
    els.toggleExtend.addEventListener('click', () => {
        isExtendVideo = !isExtendVideo;
        if (isExtendVideo) {
            els.toggleExtend?.classList.add('active');
        } else {
            els.toggleExtend?.classList.remove('active');
        }
        updateCostEstimates();
    });
}

if (els.toggleAudio) {
    els.toggleAudio.addEventListener('click', () => {
        isAudioMuted = !isAudioMuted;
        
        if (isAudioMuted) {
            els.toggleAudio?.classList.add('active');
            els.toggleAudio!.innerHTML = `AUDIO: MUTED<br><span style="font-size: 8px;">(DEFAULT)</span>`;
            if (els.finalVideo) els.finalVideo.muted = true;
        } else {
            els.toggleAudio?.classList.remove('active');
            els.toggleAudio!.innerHTML = `AUDIO: ON<br><span style="font-size: 8px;">(EXPERIMENTAL)</span>`;
            if (els.finalVideo) els.finalVideo.muted = false;
        }
    });
}

// --- INDEXED DB ---
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject("IndexedDB not supported");
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE, { keyPath: 'id' });
            }
        };
        request.onsuccess = (event: any) => resolve(event.target.result);
        request.onerror = (event: any) => reject(event.target.error);
    });
}

async function saveToLocalDB(item: any) {
    try {
        const db = await openDB();
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        if (!item.id) item.id = Date.now();
        
        const itemToSave = { ...item };
        delete itemToSave.url;
        delete itemToSave.blob;
        
        const request = store.put(itemToSave);
        request.onerror = (e) => console.error("IDB Put Error", e);
        request.onsuccess = () => console.log("Saved item to IndexedDB", item.id);
    } catch (e) {
        console.error("IndexedDB Save Failed", e);
    }
}

async function loadFromLocalDB() {
    try {
        const db = await openDB();
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const items = request.result;
            items.sort((a: any, b: any) => b.id - a.id);
            
            items.forEach((it: any) => {
                if (it.base64 && !it.url) {
                    const mime = it.mimeType || (it.type === 'video' ? 'video/mp4' : 'image/png');
                    it.url = `data:${mime};base64,${it.base64}`;
                }
            });
            
            gallery = items;
            renderGallery();
        };
    } catch (e) {
        console.error("IndexedDB Load Failed", e);
    }
}

// --- AUTH ---
if(els.authBtn) {
    els.authBtn.addEventListener('click', async () => {
        if(currentUser) {
            await signOut(auth);
            gallery = [];
            loadFromLocalDB();
        } else {
            await signIn();
        }
    });
}

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        els.authBtn.textContent = "LOGOUT";
        els.authBtn.style.background = "var(--green)";
        initGalleryListener();
    } else {
        els.authBtn.textContent = "LOGIN";
        els.authBtn.style.background = "var(--yellow)";
        loadFromLocalDB();
    }
});

// --- CLOUD STORAGE ---
async function saveToCloud(type: 'image' | 'video', base64Data: string, prompt: string, style: string, aspect: string, mimeType?: string) {
    if (!currentUser) return;

    console.log(`Starting cloud save for ${type}...`);
    try {
        const timestamp = Date.now();
        const mime = mimeType || (type === 'image' ? 'image/png' : 'video/mp4');
        const ext = mime.includes('jpeg') ? 'jpg' : (type === 'image' ? 'png' : 'mp4');
        
        const safePrompt = (prompt || 'untitled').replace(/[^a-z0-9]/gi, '_').substring(0, 30).toLowerCase();
        const safeStyle = (style || 'STYLE').replace(/[^a-z0-9]/gi, '').toUpperCase();
        
        const fileName = `april_toybox_${safeStyle}_${safePrompt}_${timestamp}.${ext}`;
        
        const storageRef = ref(storage, `users/${currentUser.uid}/${fileName}`);
        
        if (type === 'image') {
            await uploadString(storageRef, base64Data, 'base64', { contentType: mime });
        } else {
            // For video, would need to upload bytes
        }
        
        const downloadURL = await getDownloadURL(storageRef).catch((err) => {
            console.warn("Could not get download URL:", err);
            return null;
        });

        if (downloadURL) {
            await addDoc(collection(db, "creations"), {
                uid: currentUser.uid,
                type: type,
                url: downloadURL,
                style: style,
                aspect: aspect,
                prompt: prompt,
                provider: selectedProvider,
                mergeMode: (sourceImages.a && sourceImages.b) ? mergeMode : 'single',
                mimeType: mime,
                timestamp: new Date(),
                fileName: fileName
            });
            console.log("Cloud save complete:", fileName);
        }
    } catch (e) {
        console.error("Cloud save failed:", e);
    }
}

function initGalleryListener() {
    if (!currentUser) return;
    const q = query(
        collection(db, "creations"),
        where("uid", "==", currentUser.uid),
        orderBy("timestamp", "desc")
    );
    
    onSnapshot(q, (snapshot) => {
        gallery = [];
        snapshot.forEach((doc) => {
            gallery.push(doc.data());
        });
        renderGallery();
    });
}

// --- CORE ---

function setBusy(busy: boolean, text: string = "PROCESSING...", title: string = "SCULPTING...") {
    if (els.artboardOverlay) els.artboardOverlay.style.display = busy ? 'flex' : 'none';
    if (els.statusText) els.statusText.textContent = text;
    if (els.loadingTitle) els.loadingTitle.textContent = title;
    
    els.generateBtn.disabled = busy;
    els.animateBtn.disabled = busy;
    els.actionInput.disabled = busy;

    if (busy) {
        els.generateBtn.classList.add('loading-pulse');
        els.animateBtn.classList.add('loading-pulse');
    } else {
        els.generateBtn.classList.remove('loading-pulse');
        els.animateBtn.classList.remove('loading-pulse');
    }
}

function updateAnimSection() {
    const provider = apiClient.getProvider(selectedProvider);
    if (!provider) return;
    
    if (clayBase64) {
        els.animateBtn.childNodes[0].nodeValue = "VIDEO_FROM_SCULPTURE";
        if (els.animHint) els.animHint.textContent = `IMG-TO-VIDEO: USING ${provider.name.toUpperCase()}`;
        if (els.animHint) (els.animHint as HTMLElement).style.color = "var(--green)";
    } else if (sourceImages.a && sourceImages.b) {
        els.animateBtn.childNodes[0].nodeValue = `VIDEO_FROM_A_&_B (${mergeMode.toUpperCase()})`;
        if (els.animHint) els.animHint.textContent = `IMG-TO-VIDEO: USING ${provider.name.toUpperCase()}`;
        if (els.animHint) (els.animHint as HTMLElement).style.color = "var(--cyan)";
    } else if (sourceImages.a || sourceImages.b) {
        const slot = sourceImages.a ? 'A' : 'B';
        els.animateBtn.childNodes[0].nodeValue = `VIDEO_FROM_IMG_${slot}`;
        if (els.animHint) els.animHint.textContent = `IMG-TO-VIDEO: USING ${provider.name.toUpperCase()}`;
        if (els.animHint) (els.animHint as HTMLElement).style.color = "var(--cyan)";
    } else {
        els.animateBtn.childNodes[0].nodeValue = `GENERATE_WITH_${provider.name.split(' ')[0].toUpperCase()}`;
        if (els.animHint) els.animHint.textContent = `TEXT-TO-IMAGE: USING ${provider.name.toUpperCase()}`;
        if (els.animHint) (els.animHint as HTMLElement).style.color = "var(--yellow)";
    }
}

function updateSlotUI(slot: 'a' | 'b') {
    const el = slot === 'a' ? els.slotA : els.slotB;
    const removeBtn = slot === 'a' ? els.removeA : els.removeB;
    const data = sourceImages[slot];

    if (data) {
        el!.style.backgroundImage = `url(data:image/png;base64,${data})`;
        el!.classList.add('has-img');
        el!.querySelector('.slot-label')!.textContent = "";
        removeBtn!.classList.remove('hidden');
    } else {
        el!.style.backgroundImage = 'none';
        el!.classList.remove('has-img');
        el!.querySelector('.slot-label')!.textContent = `IMG ${slot.toUpperCase()}`;
        removeBtn!.classList.add('hidden');
    }
    
    if (sourceImages.a && sourceImages.b) {
        els.mergeControls?.classList.remove('hidden');
    } else {
        els.mergeControls?.classList.add('hidden');
    }
}

function updateAspectUI(newAspect: string) {
    selectedAspect = newAspect;
    document.querySelectorAll('#aspectSelector .aspect-box').forEach(b => {
        b.classList.remove('active');
        if ((b as HTMLElement).dataset.val === newAspect) {
            b.classList.add('active');
        }
    });
}

function renderStyles() {
    if (!els.recipeSelector) return;
    els.recipeSelector.innerHTML = '';
    Object.keys(styleConfig).forEach(key => {
        const div = document.createElement('div');
        div.className = `recipe-card ${key === selectedStyle ? 'active' : ''}`;
        div.style.backgroundColor = getStyleColor(key);
        div.innerHTML = `<span>${key}</span>`;
        div.onclick = () => {
            selectedStyle = key;
            renderStyles();
            updateStyleEditor();
        };
        els.recipeSelector.appendChild(div);
    });
    const addBtn = document.createElement('div');
    addBtn.className = 'recipe-card add-new';
    addBtn.innerHTML = '<span>+</span>';
    addBtn.onclick = () => {
        const name = prompt("ENTER NEW STYLE NAME:");
        if (name) {
            const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);
            if (cleanName && !styleConfig[cleanName]) {
                styleConfig[cleanName] = "Describe your custom style here...";
                selectedStyle = cleanName;
                saveStyles();
                renderStyles();
                updateStyleEditor();
            } else if (styleConfig[cleanName]) {
                alert("STYLE ALREADY EXISTS");
            }
        }
    };
    els.recipeSelector.appendChild(addBtn);
}

function updateStyleEditor() {
    if (els.stylePromptEditor) els.stylePromptEditor.value = styleConfig[selectedStyle] || '';
    if (els.styleNameInput) els.styleNameInput.value = selectedStyle || '';
}

if (els.stylePromptEditor) {
    els.stylePromptEditor.addEventListener('input', (e) => {
        const val = (e.target as HTMLTextAreaElement).value;
        if (selectedStyle) {
            styleConfig[selectedStyle] = val;
            saveStyles();
        }
    });
}

if (els.styleNameInput) {
    els.styleNameInput.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        const newName = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 12);
        
        if (!newName) { input.value = selectedStyle; return; }
        if (newName === selectedStyle) return;
        
        if (styleConfig[newName]) {
            selectedStyle = newName;
            renderStyles();
            updateStyleEditor();
            return;
        }
        
        const currentPrompt = els.stylePromptEditor ? els.stylePromptEditor.value : styleConfig[selectedStyle];
        styleConfig[newName] = currentPrompt;
        
        selectedStyle = newName;
        saveStyles();
        renderStyles();
    });
}

if (els.resetStylesBtn) {
    els.resetStylesBtn.addEventListener('click', () => {
        if (confirm('RESET ALL STYLES TO DEFAULT? THIS WILL DELETE CUSTOM STYLES.')) {
            styleConfig = { ...DEFAULT_STYLES };
            saveStyles();
            selectedStyle = 'WARM';
            renderStyles();
            updateStyleEditor();
        }
    });
}

// Slot click handlers
els.slotA!.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.remove-btn')) return;
    activeSlot = 'a';
    els.fileInput.click();
});

els.slotB!.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.remove-btn')) return;
    activeSlot = 'b';
    els.fileInput.click();
});

// Remove button handlers
els.removeA!.addEventListener('click', (e) => {
    e.stopPropagation();
    sourceImages.a = null;
    sourceMimes.a = null;
    updateSlotUI('a');
    updateAnimSection();
});

els.removeB!.addEventListener('click', (e) => {
    e.stopPropagation();
    sourceImages.b = null;
    sourceMimes.b = null;
    updateSlotUI('b');
    updateAnimSection();
});

// File upload handlers
els.fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file && activeSlot) {
        handleFileSelect(file, activeSlot);
        els.fileInput.value = '';
    }
});

function handleFileSelect(file: File, slot: 'a' | 'b') {
    if (!file.type.startsWith('image/')) {
        alert("ONLY IMAGE FILES ALLOWED!");
        return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
        const result = ev.target?.result as string;
        
        // RESET STATE
        clayBase64 = null;
        els.clayImg.classList.add('hidden');
        els.finalVideo.classList.add('hidden');
        els.placeholder!.classList.remove('hidden');

        const mime = result.match(/data:([^;]+);/)?.[1] || 'image/png';
        sourceMimes[slot] = mime;
        sourceImages[slot] = result.split(',')[1];
        updateSlotUI(slot);
        updateAnimSection();
    };
    reader.readAsDataURL(file);
}

function renderGallery() {
    if (els.galleryList) {
        els.galleryList.innerHTML = '';
        gallery.forEach((item) => {
            const div = document.createElement('div');
            div.className = `gallery-item ${item.type === 'video' ? 'video-type' : ''}`;
            
            let displayUrl = item.url;
            
            if (item.thumbnail) {
                displayUrl = item.thumbnail;
            } else if (!displayUrl && item.base64) {
                const mime = item.mimeType || (item.type === 'image' ? 'image/png' : 'video/mp4');
                if (item.type === 'image') {
                    displayUrl = `data:${mime};base64,${item.base64}`;
                }
            }
            
            if (displayUrl) {
                div.style.backgroundImage = `url(${displayUrl})`;
            }

            if (item.type === 'image' && item.base64 === clayBase64) {
                div.style.borderColor = 'var(--yellow)';
                div.style.boxShadow = '0 0 10px var(--yellow)';
            }

            div.onclick = () => {
                if (displayUrl) loadItemToStage(item);
            };
            els.galleryList.appendChild(div);
        });
    }
}

function loadItemToStage(item: any) {
    let src = item.url;
    
    if (!src && item.base64) {
        const mime = item.mimeType || (item.type === 'image' ? 'image/png' : 'video/mp4');
        src = `data:${mime};base64,${item.base64}`;
    }

    if (item.type === 'image') {
        clayBase64 = item.base64?.replace(/^data:image\/[a-z]+;base64,/, '') || item.base64 || null;
        clayMimeType = item.mimeType || 'image/png';
        
        els.clayImg.src = src;
        els.clayImg.classList.remove('hidden');
        els.finalVideo.classList.add('hidden');
        els.placeholder!.classList.add('hidden');
        updateAnimSection();
        renderGallery();
    } else {
        els.finalVideo.src = src;
        els.finalVideo.classList.remove('hidden');
        els.clayImg.classList.add('hidden');
        els.placeholder!.classList.add('hidden');
        
        els.finalVideo.muted = isAudioMuted;
        els.finalVideo.play();
    }
}

async function addToGallery(type: 'image' | 'video', url: string, base64?: string, mimeType?: string) {
    const item: any = {
        id: Date.now(),
        type,
        mimeType,
        style: selectedStyle,
        aspect: selectedAspect,
        base64: base64,
        url: url
    };
    
    gallery.unshift(item);
    
    if (!currentUser) {
        await saveToLocalDB(item);
    }
    
    renderGallery();
}

// Generate Image Button
els.generateBtn!.addEventListener('click', async () => {
    const userPrompt = els.promptInput.value.trim();
    if (!userPrompt && !sourceImages.a && !sourceImages.b) {
        alert("Please enter a prompt or upload an image!");
        return;
    }
    
    setBusy(true, "GENERATING IMAGE...", "CREATING...");
    
    const provider = apiClient.getProvider(selectedProvider);
    if (!provider) {
        alert("No provider selected!");
        setBusy(false);
        return;
    }
    
    addCost(provider.costPerImage || 0);
    
    try {
        const stylePrompt = styleConfig[selectedStyle] || '';
        const fullPrompt = stylePrompt ? `${userPrompt}. ${stylePrompt}` : userPrompt;
        
        const request: any = {
            prompt: fullPrompt,
            provider: selectedProvider,
            type: 'image',
            aspectRatio: selectedAspect,
            safetyLevel: 'minimal'
        };
        
        if (sourceImages.a && sourceImages.b) {
            request.referenceImages = [
                { data: sourceImages.a, mimeType: sourceMimes.a || 'image/png' },
                { data: sourceImages.b, mimeType: sourceMimes.b || 'image/png' }
            ];
        } else if (sourceImages.a) {
            request.sourceImage = sourceImages.a;
            request.sourceMimeType = sourceMimes.a || 'image/png';
        } else if (sourceImages.b) {
            request.sourceImage = sourceImages.b;
            request.sourceMimeType = sourceMimes.b || 'image/png';
        }
        
        const result = await apiClient.generateImage(request);
        
        if (result.success && result.data) {
            clayBase64 = result.data.mediaBase64!;
            clayMimeType = result.data.mimeType;
            
            const dataUrl = `data:${clayMimeType};base64,${clayBase64}`;
            els.clayImg.src = dataUrl;
            els.placeholder!.classList.add('hidden');
            els.finalVideo.classList.add('hidden');
            els.clayImg.classList.remove('hidden');
            
            await addToGallery('image', dataUrl, clayBase64, clayMimeType);
            updateAnimSection();
        } else {
            alert("Generation failed: " + result.error);
        }
    } catch (e: any) {
        console.error(e);
        alert("Error: " + e.message);
    } finally {
        setBusy(false);
    }
});

// Initialize on load
initializeProviders().then(() => {
    renderStyles();
    updateStyleEditor();
    updateAnimSection();
    updateSlotUI('a');
    updateSlotUI('b');
    renderGallery();
});

// Export for debugging
(window as any).apiClient = apiClient;
