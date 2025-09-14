/* ===== DATA ===== */
const swar = [
  "अ",
  "आ",
  "इ",
  "ई",
  "उ",
  "ऊ",
  "ऋ",
  "ए",
  "ऐ",
  "ओ",
  "औ",
  "अं",
  "अः",
];

const vyanjan = [
  // 5x5 grid consonants
  "क",
  "ख",
  "ग",
  "घ",
  "ङ",
  "च",
  "छ",
  "ज",
  "झ",
  "ञ",
  "ट",
  "ठ",
  "ड",
  "ढ",
  "ण",
  "त",
  "थ",
  "द",
  "ध",
  "न",
  "प",
  "फ",
  "ब",
  "भ",
  "म",
  // Bottom rows (now 2 + 1 rows)
  "य",
  "र",
  "ल",
  "व",
  "श",
  "ष",
  "स",
  "ह",
  "क्ष",
  "त्र",
  "ज्ञ",
  "श्र", // ✅ NEW consonants
];

// Layout structure matching the image
const layoutStructure = {
  vowelRow1: ["अ", "आ", "इ", "ई", "उ", "ऊ", "ऋ", "ए"],
  vowelRow2: ["ऐ", "ओ", "औ", "अं", "अः"],
  consonantGrid: [
    "क",
    "ख",
    "ग",
    "घ",
    "ङ",
    "च",
    "छ",
    "ज",
    "झ",
    "ञ",
    "ट",
    "ठ",
    "ड",
    "ढ",
    "ण",
    "त",
    "थ",
    "द",
    "ध",
    "न",
    "प",
    "फ",
    "ब",
    "भ",
    "म",
  ],
  bottomRow1: ["य", "र", "ल", "व", "श", "ष"],
  bottomRow2: ["स", "ह", "क्ष", "त्र", "ज्ञ", "श्र"],
};

/* Sound filename map */
const soundMap = {
  // Swar
  अ: "a",
  आ: "aa",
  इ: "i",
  ई: "ii",
  उ: "u",
  ऊ: "uu",
  ऋ: "ri",
  ए: "e",
  ऐ: "ai",
  ओ: "o",
  औ: "au",
  अं: "am",
  अः: "ah",
  // Vyanjan
  क: "ka",
  ख: "kha",
  ग: "ga",
  घ: "gha",
  ङ: "nga",
  च: "cha",
  छ: "chha",
  ज: "ja",
  झ: "jha",
  ञ: "nya",
  ट: "tta",
  ठ: "ttha",
  ड: "dda",
  ढ: "ddha",
  ण: "nna",
  त: "ta",
  थ: "tha",
  द: "da",
  ध: "dha",
  न: "na",
  प: "pa",
  फ: "pha",
  ब: "ba",
  भ: "bha",
  म: "ma",
  य: "ya",
  र: "ra",
  ल: "la",
  व: "va",
  श: "sha",
  ष: "ssa",
  स: "sa",
  ह: "ha",
};

// Game state
let currentPhase = "swar"; // 'swar', 'vyanjan_middle', 'vyanjan_bottom', 'complete'
let selectedLetter = null;
let wrongAttempts = 0;

/* ===== HELPERS ===== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const randSort = (arr) => arr.sort(() => Math.random() - 0.5);

/* Show message popup */
function showMessage(text, type = "info") {
  console.log(`Message: ${text} (Type: ${type})`); // Debug log

  const existingPopup = $(".message-popup");
  const existingOverlay = $(".popup-overlay");
  if (existingPopup) existingPopup.remove();
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const popup = document.createElement("div");
  popup.className = `message-popup ${type}`;
  popup.innerHTML = text;

  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  setTimeout(() => {
    if (popup.parentNode) popup.remove();
    if (overlay.parentNode) overlay.remove();
  }, 3000);

  overlay.addEventListener("click", () => {
    if (popup.parentNode) popup.remove();
    if (overlay.parentNode) overlay.remove();
  });
}

/* Show error message box */
function showErrorBox() {
  console.log("Showing error message box"); // Debug log

  // Get the error message box element
  const errorBox = $("#errorMessageBox");

  // Show the error box with flex display
  errorBox.style.display = "flex";

  // Add event listener to OK button
  $("#errorOkBtn").addEventListener("click", () => {
    // Hide the error box when OK is clicked
    errorBox.style.display = "none";
  });
}

/* Show success message box */
function showSuccessBox() {
  console.log("Showing success message box"); // Debug log

  // Get the success message box element
  const successBox = $("#successMessageBox");

  // Show the success box with flex display
  successBox.style.display = "flex";

  // Add event listener to OK button
  $("#successOkBtn").addEventListener("click", () => {
    // Hide the success box when OK is clicked
    successBox.style.display = "none";
  });
}

/* Initialize speech synthesis voices */
let speechVoices = [];

function loadVoices() {
  speechVoices = window.speechSynthesis.getVoices();
}

// Load voices when they change
if ("speechSynthesis" in window) {
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  // Initial load
  loadVoices();
}

// Create audio context for letter sounds
let audioContext;

function initAudioContext() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    return true;
  } catch (e) {
    console.error("Web Audio API not supported", e);
    return false;
  }
}

// Generate a tone for a letter
function generateLetterTone(letter) {
  if (!audioContext && !initAudioContext()) {
    return;
  }

  // Base frequency mapping for Hindi vowels and consonants
  // This creates a musical pattern for different letter types
  const baseFreq = 220; // A3 note
  let freq = baseFreq;
  let duration = 0.3;

  // Simple mapping to create different sounds for different letter types
  if ("अआइईउऊएऐओऔ".includes(letter)) {
    // Vowels - higher notes
    freq = baseFreq * 1.5;
    duration = 0.4;
  } else if ("कखगघङचछजझञ".includes(letter)) {
    // First consonant row - medium-high notes
    freq = baseFreq * 1.2;
  } else if ("टठडढणतथदधन".includes(letter)) {
    // Second consonant row - medium notes
    freq = baseFreq * 1.0;
  } else if ("पफबभमयरलवश".includes(letter)) {
    // Third consonant row - medium-low notes
    freq = baseFreq * 0.9;
  } else if ("षसहक्षत्रज्ञश्र".includes(letter)) {
    // Fourth consonant row - low notes
    freq = baseFreq * 0.8;
  }

  // Create oscillator
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = freq;
  oscillator.type = "sine";

  // Add a slight attack and release for a more pleasant sound
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);

  return duration;
}

/* Play letter sound with fallback */
function playLetter(letter) {
  console.log(`Playing sound for letter: ${letter}`); // Debug log

  // Add visual feedback regardless of sound method
  const letterElement = document.querySelector(
    `.letter[data-letter="${letter}"]`
  );
  if (letterElement) {
    letterElement.classList.add("speaking");
    setTimeout(() => {
      letterElement.classList.remove("speaking");
    }, 800); // Remove class after animation completes
  }

  // Use speech synthesis to speak the letter
  function speakLetter(text) {
    if ("speechSynthesis" in window) {
      try {
        // Cancel any ongoing speech
        speechSynthesis.cancel();

        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a Hindi voice
        if (speechVoices.length === 0) {
          // Try to load voices again if they weren't loaded initially
          loadVoices();
          console.log(
            "Loaded voices:",
            speechVoices.map((v) => `${v.name} (${v.lang})`).join(", ")
          );
        }

        // Try to find a Hindi voice
        const hindiVoice = speechVoices.find((voice) =>
          voice.lang.includes("hi")
        );

        if (hindiVoice) {
          console.log("Using Hindi voice:", hindiVoice.name);
          utterance.voice = hindiVoice;
        } else {
          console.log(
            "No Hindi voice found, using default voice with Hindi language setting"
          );
        }

        utterance.lang = "hi-IN"; // Hindi language
        utterance.rate = 0.8; // Slightly slower rate for clarity
        utterance.pitch = 1;
        utterance.volume = 1;

        console.log(`Speaking letter: ${text}`);
        speechSynthesis.speak(utterance);

        return true;
      } catch (e) {
        console.error("Speech synthesis error:", e);
        return false;
      }
    }
    return false;
  }

  // Try to use speech synthesis first
  const speechResult = speakLetter(letter);

  // If speech synthesis fails or isn't available, try audio files
  if (!speechResult) {
    // Try to play audio files if available
    const candidates = [
      `sounds/${soundMap[letter] || ""}.mp3`,
      `sounds/${letter}.mp3`,
    ].filter(Boolean);

    function tryPlay(i = 0) {
      if (i >= candidates.length) {
        // If audio files aren't available, generate a tone
        const duration = generateLetterTone(letter);
        if (!duration) {
          // If tone generation fails, play a simple beep
          playSimpleBeep();
        }
        return;
      }
      const audio = new Audio(candidates[i]);
      audio.onerror = () => tryPlay(i + 1);
      audio.play().catch(() => tryPlay(i + 1));
    }

    if (candidates.length > 0) {
      tryPlay(0);
    } else {
      // Generate a tone for the letter
      const duration = generateLetterTone(letter);
      if (!duration) {
        // If tone generation fails, play a simple beep
        playSimpleBeep();
      }
    }
  }

  // Simple beep as last resort
  function playSimpleBeep() {
    try {
      if (!audioContext && !initAudioContext()) {
        console.error("Cannot create audio context for beep");
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log("Audio not supported", e);
    }
  }
}

/* Create letter element */
function createLetterElement(letter) {
  const div = document.createElement("div");
  div.className = swar.includes(letter) ? "letter swar" : "letter vyanjan";
  div.dataset.letter = letter;
  div.textContent = letter;
  div.draggable = swar.includes(letter);
  return div;
}

/* Initialize grid with the static layout structure */
function initializeGrid() {
  // Randomize vowels
  const vowelElements = [
    ...$("#vowelRow1").children,
    ...$("#vowelRow2").children,
  ];
  shuffleElements(vowelElements);

  // Randomize middle consonants (5x5 grid)
  const consonantGridElements = [...$("#consonantGrid").children];
  shuffleElements(consonantGridElements);

  // Randomize bottom consonants
  const bottomElements = [
    ...$("#bottomRow1").children,
    ...$("#bottomRow2").children,
  ];
  shuffleElements(bottomElements);

  // Make vowels draggable
  $$(".letter.swar").forEach((element) => {
    element.draggable = true;
  });

  // Make consonants non-interactive initially
  $$(".letter.vyanjan").forEach((element) => {
    element.draggable = false;
  });

  attachEventListeners();
}

/* Shuffle array of elements in place */
function shuffleElements(elements) {
  for (let i = elements.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    // Swap content and data attributes
    const tempContent = elements[i].textContent;
    const tempLetter = elements[i].dataset.letter;

    elements[i].textContent = elements[j].textContent;
    elements[i].dataset.letter = elements[j].dataset.letter;

    elements[j].textContent = tempContent;
    elements[j].dataset.letter = tempLetter;
  }
}

/* Check if a letter can be interacted with */
function canInteract(letterElement) {
  if (currentPhase === "swar") {
    return letterElement.classList.contains("swar");
  } else if (
    currentPhase === "vyanjan_middle" ||
    currentPhase === "vyanjan_bottom"
  ) {
    return (
      letterElement.classList.contains("vyanjan") &&
      letterElement.classList.contains("active")
    );
  }
  return false;
}

/* NEW FUNCTION: Mark wrong positioned letters */
function markWrongPositions() {
  const currentArrangement = getCurrentArrangement();

  // Clear previous wrong position marks
  $$(".letter").forEach((letter) => {
    letter.classList.remove("wrong-position");
  });

  if (currentPhase === "swar") {
    // Check vowels
    const vowelElements = [
      ...$("#vowelRow1").children,
      ...$("#vowelRow2").children,
    ];

    vowelElements.forEach((element, index) => {
      const isCorrect = element.dataset.letter === swar[index];
      if (!isCorrect) {
        element.classList.add("wrong-position");
        // Remove the class after animation
        setTimeout(() => {
          element.classList.remove("wrong-position");
        }, 2000);
      }
    });
  } else if (currentPhase === "vyanjan_middle") {
    // Check middle consonants
    const consonantGridElements = [...$("#consonantGrid").children];
    const expectedMiddleVyanjan = vyanjan.slice(0, 25);

    consonantGridElements.forEach((element, index) => {
      const isCorrect = element.dataset.letter === expectedMiddleVyanjan[index];
      if (!isCorrect) {
        element.classList.add("wrong-position");
        setTimeout(() => {
          element.classList.remove("wrong-position");
        }, 2000);
      }
    });
  } else if (currentPhase === "vyanjan_bottom") {
    // Check bottom consonants
    const bottomElements = [
      ...$("#bottomRow1").children,
      ...$("#bottomRow2").children,
    ];
    const expectedBottomVyanjan = vyanjan.slice(25);

    bottomElements.forEach((element, index) => {
      const isCorrect = element.dataset.letter === expectedBottomVyanjan[index];
      if (!isCorrect) {
        element.classList.add("wrong-position");
        setTimeout(() => {
          element.classList.remove("wrong-position");
        }, 2000);
      }
    });
  }
}

/* Attach event listeners */
function attachEventListeners() {
  let draggedElement = null;

  $$(".letter").forEach((letter) => {
    // Click to play sound and handle selection
    letter.addEventListener("click", (e) => {
      playLetter(letter.dataset.letter);

      if (!canInteract(letter)) {
        if (letter.classList.contains("vyanjan") && currentPhase === "swar") {
          showMessage("पहले स्वर को सही क्रम में लगाएं!", "error");
        }
        return;
      }

      if (selectedLetter && selectedLetter !== letter) {
        swapLetters(selectedLetter, letter);
        selectedLetter.classList.remove("selected");
        selectedLetter = null;
        checkProgress();
      } else if (selectedLetter === letter) {
        letter.classList.remove("selected");
        selectedLetter = null;
      } else {
        $$(".letter.selected").forEach((l) => l.classList.remove("selected"));
        letter.classList.add("selected");
        selectedLetter = letter;
      }
    });

    // Drag and drop
    letter.addEventListener("dragstart", (e) => {
      if (!canInteract(letter)) {
        e.preventDefault();
        return;
      }
      draggedElement = letter;
      e.dataTransfer.setData("text/plain", letter.dataset.letter);

      // NEW: Play sound when starting to drag
      playLetter(letter.dataset.letter);
    });

    letter.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    letter.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!draggedElement || draggedElement === letter) return;
      if (!canInteract(letter) || !canInteract(draggedElement)) return;

      // Play sound of the letter being dragged (not the target)
      playLetter(draggedElement.dataset.letter);

      swapLetters(draggedElement, letter);
      draggedElement = null;
      checkProgress();
    });

    letter.addEventListener("dragend", () => {
      draggedElement = null;
    });
  });
}

/* Swap two letters */
function swapLetters(a, b) {
  const tempContent = a.textContent;
  const tempLetter = a.dataset.letter;

  a.textContent = b.textContent;
  a.dataset.letter = b.dataset.letter;

  b.textContent = tempContent;
  b.dataset.letter = tempLetter;
}

/* Get current arrangement */
function getCurrentArrangement() {
  const arrangement = [];

  // Vowel rows
  [...$("#vowelRow1").children, ...$("#vowelRow2").children].forEach(
    (element) => {
      arrangement.push(element.dataset.letter);
    }
  );

  // Consonant sections
  [
    ...$("#consonantGrid").children,
    ...$("#bottomRow1").children,
    ...$("#bottomRow2").children,
  ].forEach((element) => {
    arrangement.push(element.dataset.letter);
  });

  return arrangement;
}

/* Check current progress */
function checkProgress() {
  const currentArrangement = getCurrentArrangement();
  const progressText = $("#progressText");
  const allLetterElements = $$(".letter");
  const vowelElements = [
    ...$("#vowelRow1").children,
    ...$("#vowelRow2").children,
  ];
  const consonantGridElements = [...$("#consonantGrid").children];
  const bottomElements = [
    ...$("#bottomRow1").children,
    ...$("#bottomRow2").children,
  ];

  if (currentPhase === "swar") {
    // Check if vowels are in correct order
    const currentSwar = currentArrangement.slice(0, swar.length);
    const swarCorrect = currentSwar.every(
      (letter, index) => letter === swar[index]
    );

    // Mark correct vowels
    vowelElements.forEach((element, index) => {
      const isCorrect = element.dataset.letter === swar[index];
      element.classList.toggle("correct", isCorrect);
    });

    if (swarCorrect) {
      currentPhase = "vyanjan_middle";
      if (progressText) {
        progressText.innerHTML =
          "🎉 <strong>बहुत अच्छा!</strong> अब मध्य व्यंजन (क, ख, ग, घ, ङ...) को सही क्रम में लगाएं";
      }

      // Disable vowels
      vowelElements.forEach((letter) => {
        letter.classList.add("disabled");
        letter.draggable = false;
      });

      // Activate only middle consonants (5x5 grid)
      consonantGridElements.forEach((letter) => {
        letter.classList.add("active");
        letter.draggable = true;
      });

      // Keep bottom consonants inactive
      bottomElements.forEach((letter) => {
        letter.classList.remove("active");
        letter.draggable = false;
      });

      // showMessage(
      //   "🌟 शानदार! स्वर सही क्रम में हैं। अब मध्य व्यंजन की बारी!",
      //   "success"
      // );
      showSuccessBox(); // Show success message box
      playSuccessSound();
      wrongAttempts = 0;
    }
  } else if (currentPhase === "vyanjan_middle") {
    // Check if middle consonants (5x5 grid) are in correct order
    const middleVyanjanStart = swar.length;
    const middleVyanjanEnd = middleVyanjanStart + 25; // 5x5 grid = 25 consonants
    const currentMiddleVyanjan = currentArrangement.slice(
      middleVyanjanStart,
      middleVyanjanEnd
    );
    const expectedMiddleVyanjan = vyanjan.slice(0, 25);

    const middleVyanjanCorrect = currentMiddleVyanjan.every(
      (letter, index) => letter === expectedMiddleVyanjan[index]
    );

    // Mark correct middle consonants
    consonantGridElements.forEach((element, index) => {
      const isCorrect = element.dataset.letter === expectedMiddleVyanjan[index];
      element.classList.toggle("correct", isCorrect);
    });

    if (middleVyanjanCorrect) {
      currentPhase = "vyanjan_bottom";
      if (progressText) {
        progressText.innerHTML =
          "🎉 <strong>शाबाश!</strong> अब अंतिम व्यंजन (य, र, ल, व...) को सही क्रम में लगाएं";
      }

      // Disable middle consonants
      consonantGridElements.forEach((letter) => {
        letter.classList.add("disabled");
        letter.draggable = false;
      });

      // Activate bottom consonants
      bottomElements.forEach((letter) => {
        letter.classList.add("active");
        letter.draggable = true;
      });

      showMessage(
        "🌟 बहुत बढ़िया! मध्य व्यंजन सही क्रम में हैं। अब अंतिम व्यंजन की बारी!",
        "success"
      );
      showSuccessBox(); // Show success message box
      playSuccessSound();
      wrongAttempts = 0;
    }
  } else if (currentPhase === "vyanjan_bottom") {
    // Check if bottom consonants are in correct order
    const bottomVyanjanStart = swar.length + 25;
    const currentBottomVyanjan = currentArrangement.slice(bottomVyanjanStart);
    const expectedBottomVyanjan = vyanjan.slice(25);

    const bottomVyanjanCorrect = currentBottomVyanjan.every(
      (letter, index) => letter === expectedBottomVyanjan[index]
    );

    // Mark correct bottom consonants
    bottomElements.forEach((element, index) => {
      const isCorrect = element.dataset.letter === expectedBottomVyanjan[index];
      element.classList.toggle("correct", isCorrect);
    });

    if (bottomVyanjanCorrect) {
      currentPhase = "complete";
      if (progressText) {
        progressText.innerHTML =
          "🎊 <strong>परफेक्ट!</strong> पूरी वर्णमाला सही क्रम में है!";
      }
      showMessage(
        "🏆 वाह! आपने पूरी वर्णमाला को सही क्रम में लगा दिया! आप बहुत होशियार हैं!",
        "success"
      );
      showSuccessBox(); // Show success message box
      playCompletionSound();
    }
  }
}

/* Audio functions */
function playSuccessSound() {
  try {
    // Play clapping sound from file - use path that works in both localhost and production
    const clappingAudio = new Audio("/sound/clappingsound.mp3");
    clappingAudio.play().catch((error) => {
      console.log("Error playing clapping sound:", error);

      // Fallback to generated tone if audio file fails
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(
        659.25,
        audioContext.currentTime + 0.1
      );
      oscillator.frequency.setValueAtTime(
        783.99,
        audioContext.currentTime + 0.2
      );

      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    });
  } catch (e) {
    console.log("Audio not supported");
  }
}

function playCompletionSound() {
  try {
    // Play clapping sound from file - use consistent path
    const clappingAudio = new Audio("sound/clappingsound.mp3");
    clappingAudio.play().catch((error) => {
      console.log("Error playing clapping sound:", error);

      // Fallback to generated tone if audio file fails
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        oscillator.type = "sine";

        const startTime = audioContext.currentTime + index * 0.2;
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
    });
  } catch (e) {
    console.log("Audio not supported");
  }
}

function playErrorSound() {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);

    oscillator.type = "sawtooth";
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log("Audio not supported");
  }
}

/* Check if current arrangement is correct */
function isCurrentArrangementCorrect() {
  const currentArrangement = getCurrentArrangement();

  if (currentPhase === "swar") {
    const currentSwar = currentArrangement.slice(0, swar.length);
    return currentSwar.every((letter, index) => letter === swar[index]);
  } else if (currentPhase === "vyanjan_middle") {
    const middleVyanjanStart = swar.length;
    const middleVyanjanEnd = middleVyanjanStart + 25; // 5x5 grid = 25 consonants
    const currentMiddleVyanjan = currentArrangement.slice(
      middleVyanjanStart,
      middleVyanjanEnd
    );
    const expectedMiddleVyanjan = vyanjan.slice(0, 25);

    return currentMiddleVyanjan.every(
      (letter, index) => letter === expectedMiddleVyanjan[index]
    );
  } else if (currentPhase === "vyanjan_bottom") {
    const bottomVyanjanStart = swar.length + 25;
    const currentBottomVyanjan = currentArrangement.slice(bottomVyanjanStart);
    const expectedBottomVyanjan = vyanjan.slice(25);

    return currentBottomVyanjan.every(
      (letter, index) => letter === expectedBottomVyanjan[index]
    );
  }

  return false;
}

/* ===== EVENT LISTENERS ===== */

/* Play instructions audio */
function playInstructionsAudio() {
  const instructionsAudio = new Audio("/sound/intro.mp3");

  instructionsAudio.onerror = () => {
    console.log("Error: audio not found, using speech synthesis.");
    speakFallback();
  };

  instructionsAudio.play().catch((error) => {
    console.log("Autoplay blocked, falling back:", error);
    speakFallback();
  });

  console.log("Attempting to play intro.mp3");
}

function speakFallback() {
  const msg = new SpeechSynthesisUtterance(
    "यहाँ वर्णमाला के दो समूह हैं। पहले स्वर को सही क्रम में रखें, फिर व्यंजन को।"
  );
  msg.lang = "hi-IN";
  speechSynthesis.speak(msg);
}


$("#doneBtn").addEventListener("click", () => {
  console.log(`Done button clicked. Current phase: ${currentPhase}`); // Debug log

  if (currentPhase === "complete") {
    showMessage(
      "🎊 बधाई हो! आपने पूरी वर्णमाला को सही क्रम में लगाया है! आप बहुत होशियार हैं!",
      "success"
    );
    playCompletionSound();
  } else if (currentPhase === "swar") {
    if (isCurrentArrangementCorrect()) {
      showMessage(
        "🌟 शानदार! स्वर सही क्रम में हैं। अब व्यंजन की बारी!",
        "success"
      );
      playSuccessSound();
      checkProgress();
    } else {
      wrongAttempts++;
      playErrorSound();
      // NEW: Mark wrong positioned letters
      markWrongPositions();

      // Show error message box instead of gradient message
      showErrorBox();
      return;
    }
  } else if (currentPhase === "vyanjan_middle") {
    if (isCurrentArrangementCorrect()) {
      showMessage(
        "🌟 बहुत बढ़िया! मध्य व्यंजन सही क्रम में हैं। अब अंतिम व्यंजन की बारी!",
        "success"
      );
      playSuccessSound();
      checkProgress();
    } else {
      wrongAttempts++;
      playErrorSound();
      // NEW: Mark wrong positioned letters
      markWrongPositions();

      // Show error message box instead of gradient message
      showErrorBox();
      return;
    }
  } else if (currentPhase === "vyanjan_bottom") {
    if (isCurrentArrangementCorrect()) {
      currentPhase = "complete";
      // showMessage(
      //   "🎊 शाबाश! आपने पूरी वर्णमाला सही क्रम में लगा दी है!",
      //   "success"
      // );
      playCompletionSound();
      checkProgress();
    } else {
      wrongAttempts++;
      playErrorSound();
      // NEW: Mark wrong positioned letters
      markWrongPositions();

      // Show error message box instead of gradient message
      showErrorBox();
      return;
    }
  }
});

/* ===== INITIALIZE ===== */
// Initialize audio on first user interaction to work around autoplay restrictions
function initializeAudioOnInteraction() {
  // Create a silent audio context
  if (!audioContext && initAudioContext()) {
    // Create and play a silent sound to unlock audio
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);

    console.log("Audio context initialized on user interaction");

    // Also try to initialize speech synthesis
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel(); // Reset any pending speech
      const utterance = new SpeechSynthesisUtterance("");
      speechSynthesis.speak(utterance);
      console.log("Speech synthesis initialized");
    }
  }

  // Remove the initialization event listeners once initialized
  document.removeEventListener("click", initializeAudioOnInteraction);
  document.removeEventListener("touchstart", initializeAudioOnInteraction);

  // No need to play instructions on first interaction as it now plays automatically on page load
}

// Add event listeners to initialize audio on first interaction
document.addEventListener("click", initializeAudioOnInteraction);
document.addEventListener("touchstart", initializeAudioOnInteraction);

// Wait for DOM to be fully loaded before initializing
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing grid...");
  initializeGrid();

  // Play instructions audio automatically when page loads
  setTimeout(() => {
    playInstructionsAudio();
  }, 1000); // Short delay to ensure everything is loaded
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === "loading") {
  // DOM is still loading, wait for DOMContentLoaded
} else {
  // DOM is already loaded
  console.log("DOM already loaded, initializing grid immediately...");
  initializeGrid();

  // Play instructions audio automatically when page loads
  setTimeout(() => {
    playInstructionsAudio();
  }, 1000); // Short delay to ensure everything is loaded
}
