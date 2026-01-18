import { createClient } from '@supabase/supabase-js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yvlxhcvvwxvfakguldlp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bHhoY3Z3eHZ3ZmFrZ3VkbGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MTk5MzMsImV4cCI6MjA4MTI5NTkzM30.WdQHR8aO_qX6qUm8kN3t6Xq5sVlXxJRX12Pfpospn-7jbP9Z7pHwld_BJXKkhrESFo6ItmDw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DB_NAME = 'AprilsSpielzeugkastenDB';
const DB_STORE = 'gallery';
const DB_VERSION = 1;

const COST_IMAGE = 0.02;
const COST_VIDEO = 0.15;

let sourceImages = { a: null as string | null, b: null as string | null };
let sourceMimes = { a: null as string | null, b: null as string | null };
let activeSlot: 'a' | 'b' | null = null;
let currentUser: any = null;
let mergeMode: 'blend' | 'couple' = 'blend';

let generatedBase64: string | null = null;
let generatedMimeType: string = 'image/png';
let selectedAspect = '16:9';
let selectedStyle = 'REALISTIC';
let gallery: Array<any> = [];

let sessionCost = 0.00;
let isAudioMuted = true;

const DEFAULT_STYLES: Record<string, string> = {
  'REALISTIC': 'Photorealistic, high detail, professional lighting, 4K quality',
  'ANIME': 'Anime style, cel shading, vibrant colors, Japanese art style',
  '3D Render': '3D render, Blender style, octane render, cinematic lighting',
  'Oil Painting': 'Oil painting style, brushstrokes visible, artistic, classic',
  'Sketch': 'Hand-drawn sketch, pencil style, charcoal, rough lines',
  'Minimalist': 'Minimalist, simple, clean lines, modern design',
  'Cyberpunk': 'Cyberpunk, neon lights, futuristic, dystopian, digital',
  'NONE': ''
};

let styleConfig: Record<string, string> = {};

try {
  const saved = localStorage.getItem('april_styles');
  if (saved) {
    styleConfig = { ...DEFAULT_STYLES, ...JSON.parse(saved) };
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
  "GENERATING...",
  "PROCESSING...",
  "ALMOST DONE...",
  "RENDERING...",
  "APPLYING STYLE...",
  "FINALIZING..."
];

const stylePalette = [
  '#FFF000', '#00F0FF', '#00FF41', '#FF3131',
  '#FF9100', '#FF00E5', '#AD00FF', '#FFFFFF'
];

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
  finalImg: document.getElementById('finalImg') as HTMLImageElement,
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
  toggleAudio: document.getElementById('toggleAudio'),
};

const providerBadge = document.createElement('div');
providerBadge.style.cssText = "position:absolute; top:10px; right:10px; background:var(--black); color:var(--cyan); font-size:10px; padding:4px 8px; font-weight:800; border:1px solid var(--cyan); z-index:50;";
providerBadge.innerText = "PROVIDER: MINIMAX (UNCENSORED)";
if (els.placeholder) els.placeholder.parentElement?.appendChild(providerBadge);

function addCost(amount: number) {
  sessionCost += amount;
  if (els.sessionCostDisplay) {
    els.sessionCostDisplay.textContent = `$${sessionCost.toFixed(2)}`;
  }
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
    const request = store.put(item);
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

async function signInAnonymously() {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('Anonymous auth failed, using local session:', error);
      return null;
    }
    return data.user;
  } catch (e) {
    console.warn('Auth error, using local session:', e);
    return null;
  }
}

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    els.authBtn.textContent = "LOGOUT";
    els.authBtn.style.background = "var(--green)";
  } else {
    const user = await signInAnonymously();
    if (user) {
      currentUser = user;
      els.authBtn.textContent = "LOGOUT";
      els.authBtn.style.background = "var(--green)";
    } else {
      els.authBtn.textContent = "ANONYMOUS";
      els.authBtn.style.background = "var(--yellow)";
    }
  }
  loadFromLocalDB();
}

if (els.authBtn) {
  els.authBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    els.authBtn.textContent = "ANONYMOUS";
    els.authBtn.style.background = "var(--yellow)";
    gallery = [];
    loadFromLocalDB();
  });
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    currentUser = null;
    els.authBtn.textContent = "ANONYMOUS";
    els.authBtn.style.background = "var(--yellow)";
  } else if (session?.user) {
    currentUser = session.user;
    els.authBtn.textContent = "LOGOUT";
    els.authBtn.style.background = "var(--green)";
  }
});

function setBusy(busy: boolean, text: string = "PROCESSING...", title: string = "GENERATING...") {
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
  if (generatedBase64) {
    els.animateBtn.childNodes[0].nodeValue = "VIDEO_FROM_IMAGE";
    if (els.animHint) els.animHint.textContent = "IMG-TO-VIDEO: USING GENERATED IMAGE";
    if (els.animHint) (els.animHint as HTMLElement).style.color = "var(--green)";
  } else if (sourceImages.a && sourceImages.b) {
    els.animateBtn.childNodes[0].nodeValue = `VIDEO_FROM_A_&_B (${mergeMode.toUpperCase()})`;
    if (els.animHint) els.animHint.textContent = "IMG-TO-VIDEO: USING SOURCE A + B";
    if (els.animHint) (els.animHint as HTMLElement).style.color = "var(--cyan)";
  } else if (sourceImages.a) {
    els.animateBtn.childNodes[0].nodeValue = "VIDEO_FROM_IMG_A";
    if (els.animHint) els.animHint.textContent = "IMG-TO-VIDEO: USING SOURCE A";
    if (els.animHint) (els.animHint as HTMLElement).style.color = "var(--cyan)";
  } else if (sourceImages.b) {
    els.animateBtn.childNodes[0].nodeValue = "VIDEO_FROM_IMG_B";
    if (els.animHint) els.animHint.textContent = "IMG-TO-VIDEO: USING SOURCE B";
    if (els.animHint) (els.animHint as HTMLElement).style.color = "var(--cyan)";
  } else {
    els.animateBtn.childNodes[0].nodeValue = "GENERATE_IMAGE";
    if (els.animHint) els.animHint.textContent = "TEXT-TO-IMAGE: MINIMAX AI";
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
    if (confirm('RESET ALL STYLES TO DEFAULT?')) {
      styleConfig = { ...DEFAULT_STYLES };
      saveStyles();
      selectedStyle = 'REALISTIC';
      renderStyles();
      updateStyleEditor();
    }
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

function generateVideoThumbnail(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(blob);
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => { video.currentTime = 0.5; };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 320;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
      resolve(dataUrl);
      URL.revokeObjectURL(video.src);
    };
    setTimeout(() => resolve(''), 3000);
  });
}

async function addToGallery(type: 'image' | 'video', url: string, base64?: string, mimeType?: string) {
  let thumbnail: string | undefined;
  let base64ToStore = base64;
  if (type === 'video' && url.startsWith('blob:')) {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const fullBase64 = await blobToBase64(blob);
      base64ToStore = fullBase64.split(',')[1];
      thumbnail = await generateVideoThumbnail(blob);
    } catch (e) {
      console.warn("Could not process video for storage", e);
    }
  }
  const item: any = {
    id: Date.now(),
    type,
    mimeType,
    style: selectedStyle,
    aspect: selectedAspect,
    base64: base64ToStore,
    thumbnail
  };
  const memoryItem = { ...item, url: url };
  gallery.unshift(memoryItem);
  await saveToLocalDB(item);
  renderGallery();
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
      if (!displayUrl) {
        div.style.backgroundColor = '#ccc';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = '8px';
        div.style.textAlign = 'center';
        div.style.color = '#555';
        div.innerHTML = `<span>LOST<br>ITEM</span>`;
      } else {
        div.style.backgroundImage = `url(${displayUrl})`;
      }
      if (item.type === 'image' && item.base64 === generatedBase64) {
        div.style.borderColor = 'var(--yellow)';
        div.style.boxShadow = '0 0 10px var(--yellow)';
      }
      div.onclick = () => {
        if (!displayUrl) {
          alert("This item is from an older session.");
        } else {
          loadItemToStage(item);
        }
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
    generatedBase64 = item.base64?.replace(/^data:image\/[a-z]+;base64,/, '') || item.base64 || null;
    generatedMimeType = item.mimeType || 'image/png';
    els.finalImg.src = src;
    els.finalImg.classList.remove('hidden');
    els.finalVideo.classList.add('hidden');
    els.placeholder!.classList.add('hidden');
    updateAnimSection();
    renderGallery();
  } else {
    els.finalVideo.src = src;
    els.finalVideo.classList.remove('hidden');
    els.finalImg.classList.add('hidden');
    els.placeholder!.classList.add('hidden');
    els.finalVideo.muted = isAudioMuted;
    els.finalVideo.play();
  }
}

document.querySelectorAll('.aspect-box').forEach(box => {
  box.addEventListener('click', (e) => {
    if ((e.currentTarget as HTMLElement).parentElement?.id === 'mergeControls') return;
    if ((e.currentTarget as HTMLElement).closest('#aspectSelector')) {
      const target = e.currentTarget as HTMLElement;
      updateAspectUI(target.dataset.val!);
    }
  });
});

if (els.btnMergeBlend && els.btnMergeCouple) {
  els.btnMergeBlend.onclick = () => {
    mergeMode = 'blend';
    els.btnMergeBlend?.classList.add('active');
    els.btnMergeCouple?.classList.remove('active');
    updateAnimSection();
  };
  els.btnMergeCouple.onclick = () => {
    mergeMode = 'couple';
    els.btnMergeCouple?.classList.add('active');
    els.btnMergeBlend?.classList.remove('active');
    updateAnimSection();
  };
}

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

function handleFileSelect(file: File, slot: 'a' | 'b') {
  if (!file.type.startsWith('image/')) {
    alert("ONLY IMAGE FILES ALLOWED!");
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const result = ev.target?.result as string;
    generatedBase64 = null;
    els.finalImg.classList.add('hidden');
    els.finalVideo.classList.add('hidden');
    els.placeholder!.classList.remove('hidden');
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      let newAspect = '1:1';
      if (ratio > 1.2) newAspect = '16:9';
      else if (ratio < 0.8) newAspect = '9:16';
      updateAspectUI(newAspect);
    };
    img.src = result;
    const mime = result.match(/data:([^;]+);/)?.[1] || 'image/png';
    sourceMimes[slot] = mime;
    sourceImages[slot] = result.split(',')[1];
    updateSlotUI(slot);
    updateAnimSection();
  };
  reader.readAsDataURL(file);
}

function setupDragDrop(element: HTMLElement, slot: 'a' | 'b') {
  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    element.classList.add('drag-active');
  });
  element.addEventListener('dragleave', (e) => {
    e.preventDefault();
    element.classList.remove('drag-active');
  });
  element.addEventListener('drop', (e) => {
    e.preventDefault();
    element.classList.remove('drag-active');
    const file = e.dataTransfer?.files[0];
    if (file) handleFileSelect(file, slot);
  });
}

if (els.slotA) setupDragDrop(els.slotA, 'a');
if (els.slotB) setupDragDrop(els.slotB, 'b');

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

els.fileInput.addEventListener('change', (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file && activeSlot) {
    handleFileSelect(file, activeSlot);
    els.fileInput.value = '';
  }
});

els.generateBtn!.addEventListener('click', async () => {
  const userPrompt = els.promptInput.value.trim();
  if (!userPrompt) {
    alert("PLEASE ENTER A PROMPT!");
    return;
  }
  setBusy(true, "GENERATING IMAGE...", "MINIMAX AI");
  addCost(COST_IMAGE);
  try {
    const stylePrompt = styleConfig[selectedStyle] || '';
    const fullPrompt = selectedStyle !== 'NONE' ? `${userPrompt}. ${stylePrompt}` : userPrompt;
    const aspectRatio = selectedAspect === '16:9' ? '16:9' : selectedAspect === '9:16' ? '9:16' : '1:1';

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'minimax',
        type: 'image',
        prompt: fullPrompt,
        aspectRatio: aspectRatio,
        sourceImage: sourceImages.a || sourceImages.b || undefined
      })
    });

    const result = await response.json();
    if (result.success && result.data) {
      generatedBase64 = result.data.mediaBase64;
      generatedMimeType = result.data.mimeType || 'image/png';
      finalizeImage(generatedBase64, generatedMimeType, userPrompt);
    } else {
      throw new Error(result.error || 'Generation failed');
    }
  } catch (e: any) {
    console.error("Image Error:", e);
    alert("IMAGE_ERROR: " + e.message);
  } finally {
    setBusy(false);
  }
});

function finalizeImage(base64: string, mime: string, prompt: string) {
  const dataUrl = `data:${mime};base64,${base64}`;
  els.finalImg.src = dataUrl;
  els.placeholder!.classList.add('hidden');
  els.finalVideo.classList.add('hidden');
  els.finalImg.classList.remove('hidden');
  addToGallery('image', dataUrl, base64, mime);
  updateAnimSection();
}

els.animateBtn!.addEventListener('click', async () => {
  const action = els.actionInput.value.trim();
  if (!action && !generatedBase64 && !sourceImages.a && !sourceImages.b) {
    alert("PLEASE ENTER A PROMPT OR UPLOAD A SOURCE IMAGE!");
    return;
  }
  setBusy(true, "GENERATING VIDEO...", "MINIMAX AI");
  addCost(COST_VIDEO);
  try {
    const source = generatedBase64 || sourceImages.a || sourceImages.b;
    const aspectRatio = selectedAspect === '9:16' ? '9:16' : '16:9';

    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'minimax',
        type: 'video',
        prompt: action || "Animate this naturally",
        aspectRatio: aspectRatio,
        sourceImage: source
      })
    });

    const result = await response.json();
    if (result.success && result.data) {
      const videoBlob = await (await fetch(`data:${result.data.mimeType};base64,${result.data.mediaBase64}`)).blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      els.placeholder!.classList.add('hidden');
      els.finalImg.classList.add('hidden');
      els.finalVideo.classList.remove('hidden');
      els.finalVideo.src = videoUrl;
      els.finalVideo.muted = isAudioMuted;
      els.finalVideo.play();
      addToGallery('video', videoUrl, undefined, undefined);
    } else {
      throw new Error(result.error || 'Video generation failed');
    }
  } catch (e: any) {
    console.error("Video Error:", e);
    alert("VIDEO_ERROR: " + e.message);
  } finally {
    setBusy(false);
  }
});

renderStyles();
updateStyleEditor();
updateAnimSection();
updateSlotUI('a');
checkAuth();
