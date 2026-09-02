// ---- Konfiguration: hier deine Angaben anpassen -----------------------
const CONFIG = {
  githubUser: "LeandroCell",
  wordmark: "LEO",
  name: "Leandro Paolicelli",
  role: "Informatik-Student · angehender Fachinformatiker Digitale Vernetzung (Mercedes-Benz, ab Sep 2027)",
  location: "Deutschland",
  email: "leandropaolicelli@gmail.com",
  portfolio: "https://leandropaolicelli.de",
  skills: ["Java", "Python", "HTML / CSS / JavaScript", "Git & GitHub"],
};
// -------------------------------------------------------------------------

const output = document.getElementById("output");
const input = document.getElementById("cmd-input");

const COMMANDS = ["help", "about", "whoami", "projects", "contributions", "skills", "contact", "matrix", "clear"];

let history = [];
let historyIndex = -1;

function scrollToBottom() {
  output.scrollTop = output.scrollHeight;
}

function printLine(html, cls) {
  const div = document.createElement("div");
  div.className = "line" + (cls ? " " + cls : "");
  div.innerHTML = html;
  output.appendChild(div);
  scrollToBottom();
}

function printEcho(cmd) {
  const div = document.createElement("div");
  div.className = "line echo-row";
  div.innerHTML = `<span class="prompt-inline">leo@github:~$</span>${escapeHtml(cmd)}`;
  output.appendChild(div);
  scrollToBottom();
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ---- Kopfbereich, Stats-Karten, Link-Zeile befüllen ------------------------

function initHeader() {
  document.getElementById("wordmark").textContent = CONFIG.wordmark;
  document.getElementById("tagline").textContent = CONFIG.role;

  const links = document.getElementById("links-row");
  const entries = [
    ["portfolio", CONFIG.portfolio],
    ["github", `https://github.com/${CONFIG.githubUser}`],
    ["email", `mailto:${CONFIG.email}`],
  ];
  links.innerHTML = entries
    .map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`)
    .join("<span class=\"dim\">·</span>");
}

function printBoot() {
  printLine(`<span class="ok">connected to github.com/${CONFIG.githubUser}</span>`);
  printLine(`type <span class="cmd-hl">help</span> to see available commands`);
}

// ---- Contribution-Stats (Karten oben) --------------------------------------

async function loadStats() {
  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${CONFIG.githubUser}`);
    if (!res.ok) throw new Error("nicht erreichbar");
    const data = await res.json();
    const todayStr = new Date().toISOString().slice(0, 10);
    const days = (data.contributions || [])
      .filter(d => d.date <= todayStr) // Platzhalter-Tage der laufenden Woche rauswerfen
      .sort((a, b) => a.date.localeCompare(b.date));

    const total = Object.values(data.total || {}).reduce((sum, v) => sum + v, 0);
    const { current, best, maxDay } = calcStreaks(days);

    setStat("stat-total", total.toLocaleString("de-DE"));
    setStat("stat-current", current);
    setStat("stat-best", best);
    setStat("stat-max", maxDay);
  } catch (e) {
    ["stat-total", "stat-current", "stat-best", "stat-max"].forEach(id => setStat(id, "–"));
  }
}

function setStat(id, val) {
  document.getElementById(id).textContent = val;
}

function calcStreaks(days) {
  let run = 0, best = 0, maxDay = 0;
  days.forEach(d => {
    if (d.count > 0) { run++; best = Math.max(best, run); }
    else { run = 0; }
    maxDay = Math.max(maxDay, d.count);
  });

  let current = 0;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.count > 0) { current++; }
    else if (d.date === today) { continue; } // heutiger Tag zählt noch nicht als Abbruch
    else { break; }
  }
  return { current, best, maxDay };
}

// ---- Befehle im Terminal ----------------------------------------------------

const handlers = {
  help() {
    printLine("Verfügbare Befehle:");
    printLine(`&nbsp;&nbsp;<span class="cmd-hl">about</span>          kurze Vorstellung`);
    printLine(`&nbsp;&nbsp;<span class="cmd-hl">projects</span>       meine letzten GitHub-Repos (live)`);
    printLine(`&nbsp;&nbsp;<span class="cmd-hl">contributions</span>  Commit-Aktivität dieses Jahr (live)`);
    printLine(`&nbsp;&nbsp;<span class="cmd-hl">skills</span>         Technologien, mit denen ich arbeite`);
    printLine(`&nbsp;&nbsp;<span class="cmd-hl">contact</span>        wie du mich erreichst`);
    printLine(`&nbsp;&nbsp;<span class="cmd-hl">matrix</span>         ✨`);
    printLine(`&nbsp;&nbsp;<span class="cmd-hl">clear</span>          Terminal leeren`);
  },

  about() { handlers.whoami(); },
  whoami() {
    printLine(`<strong>${CONFIG.name}</strong>`);
    printLine(CONFIG.role);
    printLine(`<span class="dim">${CONFIG.location}</span>`);
    printLine("");
    printLine("Ich studiere Informatik und arbeite parallel an eigenen Projekten " +
               "Richtung Full-Stack-Entwicklung und Netzwerktechnik.");
  },

  skills() {
    printLine("Aktuell im Werkzeugkasten:");
    CONFIG.skills.forEach(s => printLine(`&nbsp;&nbsp;· ${s}`));
  },

  contact() {
    printLine(`E-Mail: <a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`);
    printLine(`GitHub: <a href="https://github.com/${CONFIG.githubUser}" target="_blank" rel="noopener">github.com/${CONFIG.githubUser}</a>`);
    printLine(`Portfolio: <a href="${CONFIG.portfolio}" target="_blank" rel="noopener">${CONFIG.portfolio.replace("https://", "")}</a>`);
  },

  clear() {
    output.innerHTML = "";
  },

  async projects() {
    printLine('<span class="dim">lade Repositories …</span>');
    try {
      const res = await fetch(`https://api.github.com/users/${CONFIG.githubUser}/repos?sort=updated&per_page=6`);
      if (!res.ok) throw new Error("API-Limit oder Netzwerkfehler");
      const repos = await res.json();
      output.lastChild.remove();

      if (!repos.length) { printLine("Keine öffentlichen Repos gefunden."); return; }

      repos.forEach(r => {
        const div = document.createElement("div");
        div.className = "proj-card";
        div.innerHTML =
          `<div class="proj-name"><a href="${r.html_url}" target="_blank" rel="noopener">${r.name}</a> ` +
          `<span class="dim">★ ${r.stargazers_count}</span></div>` +
          `<div class="dim">${r.description ? escapeHtml(r.description) : "keine Beschreibung"}</div>`;
        output.appendChild(div);
      });
      scrollToBottom();
    } catch (e) {
      output.lastChild.remove();
      printLine("Repos konnten nicht geladen werden (GitHub-API-Limit erreicht?). " +
                 `Direkt hier: <a href="https://github.com/${CONFIG.githubUser}?tab=repositories" target="_blank" rel="noopener">github.com/${CONFIG.githubUser}</a>`, "err");
    }
  },

  async contributions() {
    printLine('<span class="dim">lade Commit-Aktivität …</span>');
    try {
      const year = new Date().getFullYear();
      const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${CONFIG.githubUser}?y=${year}`);
      if (!res.ok) throw new Error("nicht erreichbar");
      const data = await res.json();
      output.lastChild.remove();

      const days = data.contributions || [];
      const total = days.reduce((sum, d) => sum + d.count, 0);
      printLine(`${total} Contributions in ${year}.`);

      const last84 = days.slice(-84);
      const ramp = " ░▒▓█";
      let row = "";
      last84.forEach((d, i) => {
        const level = Math.min(4, d.count);
        row += ramp[level];
        if ((i + 1) % 12 === 0) row += "\n";
      });
      const pre = document.createElement("pre");
      pre.className = "line dim";
      pre.style.margin = "6px 0 0";
      pre.textContent = row;
      output.appendChild(pre);
      scrollToBottom();
    } catch (e) {
      output.lastChild.remove();
      printLine("Contribution-Daten gerade nicht erreichbar.", "err");
    }
  },

  matrix() {
    toggleMatrix(true);
    printLine('<span class="dim">Matrix-Modus an. Beliebige Taste zum Beenden.</span>');
  }
};

async function runCommand(raw) {
  const cmd = raw.trim().toLowerCase();
  printEcho(raw);
  if (!cmd) return;

  history.push(raw);
  historyIndex = history.length;

  if (handlers[cmd]) {
    await handlers[cmd]();
  } else {
    printLine(`command not found: ${escapeHtml(cmd)} — tippe <span class="cmd-hl">help</span>`, "err");
  }
}

// ---- Eingabe: Enter, Verlauf, Tab-Autovervollständigung -------------------

input.addEventListener("keydown", async (e) => {
  if (matrixActive) { toggleMatrix(false); return; }

  if (e.key === "Enter") {
    const val = input.value;
    input.value = "";
    await runCommand(val);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (historyIndex > 0) { historyIndex--; input.value = history[historyIndex]; }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (historyIndex < history.length - 1) {
      historyIndex++;
      input.value = history[historyIndex];
    } else {
      historyIndex = history.length;
      input.value = "";
    }
  } else if (e.key === "Tab") {
    e.preventDefault();
    const partial = input.value.trim().toLowerCase();
    if (!partial) return;
    const match = COMMANDS.find(c => c.startsWith(partial));
    if (match) input.value = match;
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".chip")) input.focus();
});
window.addEventListener("load", () => input.focus());

// Klickbare Quick-Command-Chips
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", async () => {
    const cmd = chip.dataset.cmd;
    if (!cmd) return;
    await runCommand(cmd);
    input.focus();
  });
});

// ---- Matrix-Easter-Egg -----------------------------------------------------

const canvas = document.getElementById("matrix-canvas");
const ctx = canvas.getContext("2d");
let matrixActive = false;
let matrixTimer = null;

function toggleMatrix(on) {
  matrixActive = on;
  canvas.classList.toggle("active", on);
  if (on) { startMatrix(); } else { clearInterval(matrixTimer); }
}

function startMatrix() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const chars = "アイウエオカキクケコ01LEO";
  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = new Array(columns).fill(1);

  clearInterval(matrixTimer);
  matrixTimer = setInterval(() => {
    ctx.fillStyle = "rgba(10, 12, 10, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#4ade80";
    ctx.font = fontSize + "px monospace";
    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, y * fontSize);
      if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }, 45);
}

window.addEventListener("resize", () => {
  if (matrixActive) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
});

// ---- Start -------------------------------------------------------------

initHeader();
printBoot();
loadStats();
