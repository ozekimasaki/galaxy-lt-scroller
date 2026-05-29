import "./styles.css";
import slideMarkdown from "./slides.md?raw";

const crawlRoot = document.querySelector("#crawl-root");
const stateLabel = document.querySelector("#state-label");
const sectionLabel = document.querySelector("#section-label");
const promptText = document.querySelector("#prompt-text");
const primaryAction = document.querySelector("#primary-action");
const autoAction = document.querySelector("#auto-action");
const resetAction = document.querySelector("#reset-action");

const transforms = {
  below: "translate3d(-50%, 86vh, 64px) rotateX(58deg) scale(1.05)",
  idle: "translate3d(-50%, 56vh, 0) rotateX(58deg) scale(1)",
  far: "translate3d(-50%, -154vh, -560px) rotateX(62deg) scale(0.16)",
};

const transition = {
  crawlDistanceVh: 210,
  entryDistanceVh: 30,
  visibleExitRatio: 0.56,
  autoPauseMs: 420,
};

const sections = parseSlides(slideMarkdown);

let currentIndex = 0;
let state = "idle";
let currentElement = null;
let activeAnimation = null;
let entryAnimation = null;
let autoTimer = null;
let entryTimer = null;
let sectionExitTimer = null;
let autoMode = false;
let hudHidden = false;

function parseSlides(markdown) {
  return markdown
    .split(/^---\s*$/m)
    .map((block) => parseSection(block.trim()))
    .filter((section) => section.title || section.paragraphs.length || section.image);
}

function parseSection(block) {
  const lines = block.split(/\r?\n/);
  const section = {
    kicker: "",
    title: "",
    level: 2,
    paragraphs: [],
    image: null,
    caption: "",
    duration: null,
  };
  let paragraph = [];

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    section.paragraphs.push(paragraph.join(" ").trim());
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const directive = line.match(/^@([a-z]+)\s+(.+)$/i);
    if (directive) {
      flushParagraph();
      applyDirective(section, directive[1].toLowerCase(), directive[2].trim());
      continue;
    }

    const heading = line.match(/^(#{1,2})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      section.level = heading[1].length;
      section.title = heading[2].trim();
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushParagraph();
      section.image = {
        alt: image[1].trim(),
        src: image[2].trim(),
      };
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return section;
}

function applyDirective(section, key, value) {
  if (key === "kicker") {
    section.kicker = value;
    return;
  }

  if (key === "caption") {
    section.caption = value;
    return;
  }

  if (key === "duration") {
    const duration = Number.parseInt(value, 10);
    section.duration = Number.isFinite(duration) && duration > 0 ? duration : null;
  }
}

function renderSection(section, index) {
  const article = document.createElement("article");
  article.className = "crawl-section";
  article.setAttribute("aria-label", section.title || `Section ${index + 1}`);

  if (section.kicker) {
    const kicker = document.createElement("span");
    kicker.className = "kicker";
    kicker.textContent = section.kicker;
    article.append(kicker);
  }

  if (section.title) {
    const title = document.createElement(section.level === 1 ? "h1" : "h2");
    title.textContent = section.title;
    article.append(title);
  }

  if (section.image) {
    const media = document.createElement("figure");
    media.className = "media-frame";
    const image = document.createElement("img");
    image.src = section.image.src;
    image.alt = section.image.alt;
    media.append(image);
    article.append(media);
  }

  section.paragraphs.forEach((text, paragraphIndex) => {
    const paragraphElement = document.createElement("p");
    paragraphElement.textContent = text;
    if (paragraphIndex === 0 && index === 0) {
      paragraphElement.className = "lead";
    }
    article.append(paragraphElement);
  });

  if (section.caption) {
    const caption = document.createElement("p");
    caption.className = "caption";
    caption.textContent = section.caption;
    article.append(caption);
  }

  return article;
}

function mountSection(index, startTransform = transforms.idle) {
  const element = renderSection(sections[index], index);
  element.style.transform = startTransform;
  element.style.opacity = "1";
  element.style.filter = "none";
  crawlRoot.append(element);
  return element;
}

function entryDurationForSection(section) {
  return Math.round(
    durationForSection(section) * (transition.entryDistanceVh / transition.crawlDistanceVh),
  );
}

function animateSectionIn(element, index, delay = 0) {
  return element.animate(
    [
      { transform: transforms.below, opacity: 1, filter: "blur(0px)" },
      { transform: transforms.idle, opacity: 1, filter: "blur(0px)" },
    ],
    {
      delay,
      duration: entryDurationForSection(sections[index]),
      easing: "linear",
      fill: "both",
    },
  );
}

function updateHud() {
  const total = sections.length;
  const displayIndex = Math.min(currentIndex + 1, total);
  sectionLabel.textContent = `${displayIndex} / ${total}`;

  if (state === "complete") {
    stateLabel.textContent = "Complete";
    promptText.textContent = "最初に戻る";
    primaryAction.textContent = "Replay";
    autoAction.textContent = autoMode ? "Auto On" : "Auto Off";
    return;
  }

  autoAction.textContent = autoMode ? "Auto On" : "Auto Off";

  if (state === "entering") {
    stateLabel.textContent = autoMode ? "Auto cue" : "Cueing";
    promptText.textContent = autoMode ? "自動再生中" : "次を表示中";
    primaryAction.textContent = "Advance";
    return;
  }

  if (state === "scrolling") {
    stateLabel.textContent = autoMode ? "Auto scrolling" : "Scrolling";
    promptText.textContent = autoMode ? "自動再生中" : "次へ";
    primaryAction.textContent = "Next";
    return;
  }

  stateLabel.textContent = "Standby";
  promptText.textContent = autoMode ? "自動再生待機" : currentIndex === 0 ? "開始" : "次へ";
  primaryAction.textContent = currentIndex === 0 ? "Start" : "Advance";
}

function prepareCurrent(animateIn = false) {
  clearAutoTimer();
  clearEntryTimer();
  clearSectionExitTimer();
  crawlRoot.innerHTML = "";
  activeAnimation = null;
  entryAnimation = null;

  if (!sections.length) {
    renderEmptyState();
    return;
  }

  if (currentIndex >= sections.length) {
    currentElement = null;
    state = "complete";
    updateHud();
    return;
  }

  currentElement = mountSection(currentIndex);
  if (animateIn) {
    state = "entering";
    updateHud();
    entryAnimation = animateSectionIn(currentElement, currentIndex);
    entryAnimation.onfinish = finishEntry;
    scheduleEntryFinish(sections[currentIndex]);
    return;
  }
  state = "idle";
  updateHud();
  scheduleAuto();
}

function renderEmptyState() {
  const empty = document.createElement("article");
  empty.className = "crawl-section";
  empty.style.transform = transforms.idle;
  empty.innerHTML = "<h1>No slides</h1><p>src/slides.md に原稿を追加してください。</p>";
  crawlRoot.replaceChildren(empty);
  state = "complete";
  stateLabel.textContent = "No slides";
  sectionLabel.textContent = "0 / 0";
  promptText.textContent = "原稿なし";
  primaryAction.textContent = "Reload";
}

function durationForSection(section) {
  if (section.duration) {
    return section.duration;
  }

  const textLength = [
    section.title,
    ...section.paragraphs,
    section.caption,
  ].join("").length;
  return Math.min(21000, Math.max(12000, textLength * 78));
}

function finishEntry() {
  if (state !== "entering") {
    return;
  }

  clearEntryTimer();
  entryAnimation = null;
  state = "idle";
  updateHud();
  scheduleAuto();
}

function finishCurrentSection() {
  if (state !== "scrolling") {
    return;
  }

  clearSectionExitTimer();
  activeAnimation?.cancel();
  activeAnimation = null;
  currentElement?.remove();
  currentIndex += 1;
  prepareCurrent(true);
}

function startScroll() {
  clearAutoTimer();
  clearEntryTimer();
  clearSectionExitTimer();
  if (!currentElement || currentIndex >= sections.length) {
    prepareCurrent();
    return;
  }

  state = "scrolling";
  updateHud();

  activeAnimation = currentElement.animate(
    [
      { transform: transforms.idle, opacity: 1, filter: "blur(0px)" },
      { transform: transforms.far, opacity: 0.03, filter: "blur(1.4px)" },
    ],
    {
      duration: durationForSection(sections[currentIndex]),
      easing: "linear",
      fill: "forwards",
    },
  );

  activeAnimation.onfinish = finishCurrentSection;
  sectionExitTimer = window.setTimeout(
    finishCurrentSection,
    Math.round(durationForSection(sections[currentIndex]) * transition.visibleExitRatio),
  );
}

function goToNextSection() {
  if (!activeAnimation || state !== "scrolling") {
    return;
  }

  clearSectionExitTimer();
  activeAnimation.cancel();
  activeAnimation = null;
  currentElement?.remove();
  currentIndex += 1;
  prepareCurrent(true);
}

function advance() {
  if (state === "complete") {
    reset();
    return;
  }

  if (state === "entering") {
    entryAnimation?.finish();
    finishEntry();
    startScroll();
    return;
  }

  if (state === "scrolling") {
    goToNextSection();
    return;
  }

  if (state === "idle") {
    startScroll();
  }
}

function reset() {
  clearAutoTimer();
  clearEntryTimer();
  clearSectionExitTimer();
  activeAnimation?.cancel();
  entryAnimation?.cancel();
  currentIndex = 0;
  state = "idle";
  prepareCurrent();
}

function clearAutoTimer() {
  if (!autoTimer) {
    return;
  }

  window.clearTimeout(autoTimer);
  autoTimer = null;
}

function clearEntryTimer() {
  if (!entryTimer) {
    return;
  }

  window.clearTimeout(entryTimer);
  entryTimer = null;
}

function clearSectionExitTimer() {
  if (!sectionExitTimer) {
    return;
  }

  window.clearTimeout(sectionExitTimer);
  sectionExitTimer = null;
}

function scheduleEntryFinish(section) {
  clearEntryTimer();
  entryTimer = window.setTimeout(
    finishEntry,
    entryDurationForSection(section) + 80,
  );
}

function scheduleAuto() {
  clearAutoTimer();
  if (!autoMode || state !== "idle") {
    return;
  }

  autoTimer = window.setTimeout(() => {
    autoTimer = null;
    if (autoMode && state === "idle") {
      startScroll();
    }
  }, transition.autoPauseMs);
}

function toggleAutoMode() {
  autoMode = !autoMode;
  updateHud();
  if (autoMode) {
    scheduleAuto();
    return;
  }

  clearAutoTimer();
}

function toggleHud() {
  hudHidden = !hudHidden;
  document.body.classList.toggle("hud-hidden", hudHidden);
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable;

  if (isTyping) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    advance();
    return;
  }

  if (event.key.toLowerCase() === "a") {
    event.preventDefault();
    toggleAutoMode();
    return;
  }

  if (event.key.toLowerCase() === "h") {
    event.preventDefault();
    toggleHud();
  }
});

primaryAction.addEventListener("click", advance);
autoAction.addEventListener("click", toggleAutoMode);
resetAction.addEventListener("click", reset);

createStars();
prepareCurrent();

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function createStars() {
  const containers = [
    { el: document.querySelector(".stars-a"), count: 70, colorBias: [0, 1] },
    { el: document.querySelector(".stars-b"), count: 130, colorBias: [0, 2] },
    { el: document.querySelector(".stars-c"), count: 160, colorBias: [0] },
  ];

  const colors = [
    "rgba(255, 255, 255, 0.95)",
    "rgba(120, 217, 255, 0.85)",
    "rgba(255, 224, 130, 0.85)",
    "rgba(255, 255, 255, 0.75)",
    "rgba(200, 230, 255, 0.8)",
  ];

  const layers = [
    { className: "star-near", sizeMin: 1.5, sizeMax: 3.2, opacityMin: 0.75, opacityMax: 1.0, durationMin: 22, durationMax: 38, driftXMin: -200, driftXMax: 200, driftYMin: 80, driftYMax: 220, glowMax: 5 },
    { className: "star-mid",  sizeMin: 1.0, sizeMax: 2.2, opacityMin: 0.45, opacityMax: 0.85, durationMin: 38, durationMax: 58, driftXMin: -140, driftXMax: 140, driftYMin: 40, driftYMax: 160, glowMax: 3 },
    { className: "star-far",  sizeMin: 0.6, sizeMax: 1.6, opacityMin: 0.25, opacityMax: 0.55, durationMin: 55, durationMax: 90, driftXMin: -80,  driftXMax: 80,  driftYMin: 20, driftYMax: 100, glowMax: 2 },
  ];

  containers.forEach((containerInfo) => {
    const { el, count, colorBias } = containerInfo;
    if (!el) return;

    for (let i = 0; i < count; i++) {
      const layer = layers[Math.floor(Math.random() * layers.length)];

      const star = document.createElement("span");
      star.className = `star ${layer.className}`;

      const size = rand(layer.sizeMin, layer.sizeMax);
      const x = rand(-10, 110);
      const y = rand(-10, 110);
      const opacity = rand(layer.opacityMin, layer.opacityMax);
      const duration = rand(layer.durationMin, layer.durationMax);
      const driftX = rand(layer.driftXMin, layer.driftXMax);
      const driftY = rand(layer.driftYMin, layer.driftYMax);
      const delay = rand(0, duration);
      const twinkleDuration = rand(2.5, 6.5);
      const twinkleDelay = rand(0, twinkleDuration);
      const glow = rand(0, layer.glowMax);

      const colorIndex = colorBias.length === 1
        ? colorBias[0]
        : colorBias[Math.floor(Math.random() * colorBias.length)];
      const finalColorIndex = Math.random() < 0.75 ? colorIndex : Math.floor(Math.random() * colors.length);
      const color = colors[finalColorIndex];

      star.style.cssText = `
        left: ${x}vw;
        top: ${y}vh;
        width: ${size}px;
        height: ${size}px;
        color: ${color};
        --star-opacity: ${opacity};
        --star-drift-duration: ${duration}s;
        --star-drift-x: ${driftX}px;
        --star-drift-y: ${driftY}px;
        --star-drift-delay: -${delay}s;
        --star-twinkle-duration: ${twinkleDuration}s;
        --star-twinkle-delay: -${twinkleDelay}s;
        --star-glow: ${glow}px;
      `;

      el.appendChild(star);
    }
  });
}
