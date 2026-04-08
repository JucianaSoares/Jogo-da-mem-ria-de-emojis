// TEMPO POR DIFICULDADE
const timeLimits = {
  easy: 45,   // Fácil → 45s
  medium: 75, // Médio → 75s
  hard: 90    // Difícil → 90s
};

// VARIÁVEIS GLOBAIS
let audioUnlocked = false;
let openCards = [];
let moves = 0;
let errors = 0;
let timerInterval = null;
let currentTheme = "default";     // tema inicial
let currentDifficulty = "easy";   // dificuldade inicial
let timeLeft = timeLimits[currentDifficulty]; 
let totalTime = timeLimits.easy;  // inicializa com fácil
let difficulty = "FÁCIL";
let emojis = [];
let hintsAvailable = 0;
let victoryMessages = null;
let defeatMessages = null;
let externalRanking = { 
  players: JSON.parse(localStorage.getItem("ranking")) || [] 
};
let playerLevel = 1;
let totalXP = 0;
let todayMissions = []; // global
let hintsUsed = 0;
let lockBoard = false;

// Recupera progresso salvo
const savedLevel = localStorage.getItem("playerLevel");
const savedXP = localStorage.getItem("totalXP");

if (savedLevel) {
  playerLevel = parseInt(savedLevel);
}
if (savedXP) {
  totalXP = parseInt(savedXP);
}
// lista de temas com cores e imagens
// conjuntos de emojis por tema
const themes = {
  default: {
    background: "#f0f0f0",
    cardFront: "lightgray",
    cardBack: "white",
    textColor: "#000",
    containerImage: "url('src/imagens/fundoemojis2.jpg')",
    cardImage: "linear-gradient(yellow,white)",
    emojis: ["😀","😎","😍","🤩","😡","😭","😴","🤖"]
  },
  oceano: {
    background: "#cce7ff",
   cardFront: "#0066cc",
    cardBack: "#99ccff",
    textColor: "#000",
    containerImage: "url('src/imagens/ocean.jpg')",
    cardImage: "linear-gradient(#0E90AD,#e2ca76)",
    emojis: ["🐠","🐟","🐬","🐳","🦑","🦀","🦈","🐋"]
  },
  floresta: {
    background: "#e0ffe0",
    cardFront: "#228B22",
    cardBack: "#90ee90",
    textColor: "#000",
    containerImage: "url('src/imagens/forest.jpg')",
    cardImage: "linear-gradient(green, brown)",
    emojis: ["🌲","🌳","🍄","🦉","🦊","🐻","🦌","🐿️"]
  },
  espaço: {
    background: "#000",
    cardFront: "#333",
    cardBack: "#555",
    textColor: "#fff",
    containerImage: "url('src/imagens/Space.jpg')",
    cardImage:"linear-gradient(#1b263b, #778da9)",
    emojis: ["🌍","🌙","⭐","🚀","🛸","🪐","☄️","🌌"]
  },
  fantasia: {
    background: "#f3e5f5", // lilás suave
    cardFront: "#7e57c2",  // roxo fantasia
    cardBack: "#d1c4e9",   // lilás claro
    textColor: "#000",
    containerImage:"url('src/imagens/Fantasy.jpg')",
    cardImage: "linear-gradient(purple, pink)", // verso mágico
    emojis: ["🧚‍♀️","🧙‍♂️","🐉","🦄","✨","🔮","🧝‍♀️","🏰"]
  },
  flores: {
    background: "#fff0f5", // rosa suave
    cardFront: "#e91e63",  // rosa vibrante
    cardBack: "#f8bbd0",   // rosa claro
    textColor: "#000",
    containerImage:"url('src/imagens/flores.jpg')",
    cardImage: "linear-gradient(pink,lightgreen)", // verso floral
    emojis: ["🌹","🌻","🌷","🪷","🌸","💐","🥀","🌺"]
  },
  animais: {
    background: "#e0f7fa", // azul claro
    cardFront: "#00796b",  // verde escuro
    cardBack: "#80cbc4",   // verde água
    textColor: "#000",
    containerImage:"url('src/imagens/Animals.jpg')",
    cardImage: "linear-gradient(lightblue,lightgreen)", // verso natureza
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼"]
  }
};

// dificuldades (quantos pares usar)
const emojiSets = {
  easy: 4,   // 4 pares
  medium: 6, // 6 pares
  hard: 8    // 8 pares
};

const allMissions = [
  "Ganhe uma partida sem erros",
  "Complete uma partida em menos de 1 minuto",
  "Use apenas 1 dica durante a partida",
  "Finalize uma partida com mais de 200 XP",
  "Jogue 3 partidas seguidas",
  "Complete uma partida no modo difícil",
  "Alcance um novo nível hoje"
];

// mapa de missões: condição → índice
const missionMap = {
  noErrors: 0,          // Ganhe uma partida sem erros
  fastWin: 1,           // Complete em menos de 1 minuto
  oneHint: 2,           // Use apenas 1 dica
  highXP: 3,            // Finalize com mais de 200 XP
  streak3: 4,           // Jogue 3 partidas seguidas
  hardMode: 5,          // Complete no modo difícil
  newLevel: 6           // Alcançar um novo nível hoje
};

const somVitoria = document.querySelector("#victory-sound");
const somDerrota = document.querySelector("#defeat-sound");
const somAcerto = document.querySelector("#correct-sound");
const somErro = document.querySelector("#wrong-sound");
const somAlertaTimer = document.querySelector("#timer-alert");
const somAplausos = document.querySelector("#congrats-sound");
const somUltimaDica = document.querySelector("#last-hint-sound");
const somLevelUp = document.querySelector("#level-up-sound");

const winnerMsg = document.querySelector(".winner-message")
// --- LÓGICA DE TEMAS ---

function applyTheme(themeName) {
  // Garante que a variável global e o storage estejam em sintonia
  currentTheme = themeName;
  localStorage.setItem("selectedTheme", themeName);
  
  const theme = themes[themeName] || themes["default"];
  const container = document.querySelector(".container");
  
// --- 1. AJUSTE INTELIGENTE DO BODY ---
  if (themeName === "default") {
    // Para o padrão, usamos um gradiente que remete ao amarelo dos cards
    // mas com um tom "Dourado/Âmbar" para não ficar branco.
    document.body.style.background = "linear-gradient(180deg, #FFD700 0%, #f0a500 100%)";
  } else {
    // Para os outros temas, usamos a cor viva do background e do cardFront
    document.body.style.background = `linear-gradient(180deg, ${theme.background} 0%, ${theme.cardFront} 100%)`;
  }
  
  document.body.style.backgroundAttachment = "fixed";
  // 1. Ajuste do Fundo do Jogo
  if (container) {
    container.style.backgroundColor = theme.background;
    container.style.backgroundImage = theme.containerImage || "none";
    container.style.backgroundSize = "cover";
    container.style.backgroundPosition = "center";
    
// Sombra que combina com o tema para dar profundidade
    container.style.boxShadow = `0 10px 40px rgba(0,0,0,0.3)`;
  }


  // Pinta tudo que estiver dentro da div de ranking
  const rankingArea = document.querySelector(".ranking");
  if (rankingArea) {
    // O "*" seleciona TUDO (h3, p, li, strong, etc.) dentro do ranking
    const allRankingTexts = rankingArea.querySelectorAll("*"); 
    allRankingTexts.forEach(el => {
      el.style.color = theme.textColor;
      
      // Se quiser manter aquela bordinha sutil nos itens da lista:
      if (el.classList.contains("ranking-item")) {
        el.style.borderBottom = `1px solid ${theme.textColor}33`;
      }
    });
  }

  // 2. Ajuste Direto dos Textos via JS
  // Selecionamos todos os elementos que precisam mudar de cor
  const textElements = [
    document.querySelector(".timer"),
    document.querySelector(".moves"),
    document.querySelector(".errors-count"), // Caso você tenha essa classe
    document.getElementById("progress-text"),
    document.querySelector(".container h2")   // O título do jogo
  ];

  textElements.forEach(el => {
    if (el) {
      // No tema padrão (amarelo), texto preto fica melhor. No espaço, branco.
      el.style.color = theme.textColor;
      el.style.textShadow = theme.textColor === "#000" 
        ? "1px 1px 1px rgba(255,255,255,0.5)" 
        : "1px 1px 3px rgba(0,0,0,0.5)";
      el.style.fontWeight = "bold";
    }
  });

  // 3. Atualiza as variáveis CSS para os Cards 
  const root = document.documentElement;
  root.style.setProperty('--card-front', theme.cardFront);
  root.style.setProperty('--card-back', theme.cardBack);
  root.style.setProperty('--card-image', theme.cardImage || "none");
  root.style.setProperty('--text-color', theme.textColor);

  currentTheme = themeName;
  emojis = theme.emojis;
  
  // Pinta os textos das missões e o progresso
  const missionElements = document.querySelectorAll("#missions-list li");
  missionElements.forEach(li => {
    // Aplica a cor do texto do tema
    li.style.color = theme.textColor;

    // 🎨 AJUSTE DINÂMICO DO FUNDO DA BARRINHA
    if (theme.textColor === "#fff") {
      // Se o tema for escuro (Espaço), a barra fica grafite/preta transparente
      li.style.background = "rgba(0, 0, 0, 0.6)"; 
      li.style.border = "1px solid rgba(255, 255, 255, 0.2)";
    } else {
      // Se o tema for claro, a barra fica branca ou clarinha
      li.style.background = "rgba(255, 255, 255, 0.9)";
      li.style.border = "1px solid rgba(0, 0, 0, 0.1)";
    }
  });

missionElements.forEach(li => {
  // Aplica a cor do texto do tema
  li.style.color = theme.textColor;
  
  // 🎨 AJUSTE DINÂMICO DO FUNDO DA BARRINHA
  if (theme.textColor === "#fff") {
    // Se o tema for escuro (Espaço), a barra fica grafite/preta transparente
    li.style.background = "rgba(0, 0, 0, 0.6)";
    li.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  } else {
    // Se o tema for claro, a barra fica branca ou clarinha
    li.style.background = "rgba(255, 255, 255, 0.9)";
    li.style.border = "1px solid rgba(0, 0, 0, 0.1)";
  }
});
  // Ajusta o fundo da caixa de missões para dar contraste
  // 3. Ajusta o fundo da caixa de missões (o container grande)
  const missionsBox = document.querySelector(".missions");
  if (missionsBox) {
    missionsBox.style.backgroundColor = "transparent"; // Deixa o fundo principal limpo
    missionsBox.style.border = "none";
  }
}


function getEmojisForGame(themeName, difficulty) {
  const theme = themes[themeName] || themes["default"];
  const totalPairs = emojiSets[difficulty] || 4;
  const selected = theme.emojis.slice(0, totalPairs);
  const pairs = selected.flatMap(e => [e, e]);

  // Fisher-Yates Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
}

// --- LÓGICA DO JOGO ---



function loadThemes() {
  const savedTheme = localStorage.getItem("selectedTheme");
  currentTheme = savedTheme || "default";

  const select = document.getElementById("themes");
  if (!select) return; // Segurança contra erros de DOM

  select.innerHTML = "";
  Object.keys(themes).forEach(themeName => {
    const option = document.createElement("option");
    option.value = themeName;
    // Formata o nome (ex: "espaço" -> "Espaço")
    option.textContent = themeName.charAt(0).toUpperCase() + themeName.slice(1);
    option.selected = (themeName === currentTheme);
    select.appendChild(option);
  });

  applyTheme(currentTheme);

  select.addEventListener("change", e => {
    currentTheme = e.target.value;
    localStorage.setItem("selectedTheme", currentTheme);
    // IMPORTANTE: Aqui você decide se quer reiniciar o jogo 
    // imediatamente ou esperar o próximo "Start".
    startGame(); 
  });
}


function setTheme(themeName) {
  currentTheme = themeName;
  localStorage.setItem("selectedTheme", themeName); // salva no navegador
  applyTheme(themeName);
}

  fetch("/victorymessages.json")
  .then(response => response.json())
  .then(data => {
    victoryMessages = data;
  })
  .catch(err => console.error("Erro ao carregar mensagens de vitória:", err));
  
  function getVictoryMessage(level) {
  if (!victoryMessages) return "🎉 Você venceu!"; // fallback

  let set = victoryMessages[level] || victoryMessages["default"];
  let groups = set.groups;
  let randomGroup = groups[Math.floor(Math.random() * groups.length)];
  let randomMessage = randomGroup[Math.floor(Math.random() * randomGroup.length)];
  return randomMessage;
}

  fetch("/defeatmessages.json")
  .then(response => response.json())
  .then(data => {
    defeatMessages = data;
  })
  .catch(err => console.error("Erro ao carregar mensagens de derrota:", err));
  
function getDefeatMessage(level) {
  if (!defeatMessages) return "⏱️Tempo acabou!"; // fallback
  let set = defeatMessages[level] || defeatMessages["default"];
  let groups = set.groups;
  let randomGroup = groups[Math.floor(Math.random() * groups.length)];
  let randomMessage = randomGroup[Math.floor(Math.random() * randomGroup.length)];
  return randomMessage;
}

// --- SISTEMA DE DICAS ---

function updateHintStatus() {
  const status = document.getElementById("hint-status");
  const hintButton = document.getElementById("use-hint");
  if (!status || !hintButton) return;

  status.innerText = hintsAvailable;
  
  // Adiciona animação de pulso se o valor for maior que antes
  status.classList.add("bonus-anim");
  setTimeout(() => status.classList.remove("bonus-anim"), 800);
  
  // Limpa classes anteriores para evitar conflito
  status.classList.remove("low", "zero", "easy", "medium", "hard");
  hintButton.classList.remove("glow", "easy", "medium", "hard");

  if (hintsAvailable === 0) {
    status.classList.add("zero");
    hintButton.disabled = true;
    hintButton.classList.remove("glow");
  } else {
    hintButton.disabled = false;
    hintButton.classList.add("glow");

    // Aplica classe de dificuldade (útil para cores no CSS)
    const diffClass = currentDifficulty.toLowerCase();
    status.classList.add(diffClass);
    hintButton.classList.add(diffClass);

    if (hintsAvailable === 1) {
    status.classList.add("low");
    
    // Chamamos pelo ID que está no  arquivo index.html
    if (somUltimaDica) {
    somUltimaDica.pause();
    somUltimaDica.currentTime = 0;
    somUltimaDica.play().catch(e => console.log("Áudio bloqueado"));
}
 
}
   }
    }
  
function usarDicaExtra() {
  // Impede usar dica se o tabuleiro estiver bloqueado ou sem dicas
  if (hintsAvailable <= 0 || lockBoard) return;

  const hiddenCards = [...document.querySelectorAll(".card:not(.is-flipped):not(.boxMatch)")];
  
  if (hiddenCards.length > 0) {
    const randomCard = hiddenCards[Math.floor(Math.random() * hiddenCards.length)];
    
    // Bloqueia cliques na carta e no tabuleiro durante a dica
    randomCard.style.pointerEvents = "none";
    
    randomCard.classList.add("is-flipped");
    
    setTimeout(() => {
      // Só desvira se a carta ainda não foi "combinada" (boxMatch) por coincidência
      if (!randomCard.classList.contains("boxMatch")) {
        randomCard.classList.remove("is-flipped");
      }
      randomCard.style.pointerEvents = "auto";
    }, 1500);
    
    hintsAvailable--;
    hintsUsed++; // Contador para estatísticas/conquistas
    updateHintStatus();
  }
}

// --- ALERTAS DE PROGRESSÃO ---

function showLevelUpAlert(level) {
  
  
  const alertBox = document.getElementById("level-up-alert");
  
  const message = document.querySelector("#level-up-alert .alert-message");
  
  if (somAplausos) {
  somAplausos.pause();
  somAplausos.currentTime = 0;
  somAplausos.play().catch(e => console.log("Áudio bloqueado"));
}
  
  if (somLevelUp) {
  somLevelUp.pause();
  somLevelUp.currentTime = 0;
  somLevelUp.play().catch(e => console.log("Áudio bloqueado"));
}
  
  if (alertBox && message) {
    // Definimos uma recompensa (ex: 2 dicas por nível)
    const recompensaDicas = 1;
     // 1. Pega o que já tinha de bônus acumulado e soma o novo
  let bonusAcumulado = parseInt(localStorage.getItem("bonusHints")) || 0;
  bonusAcumulado += recompensaDicas;
  localStorage.setItem("bonusHints", bonusAcumulado);

    // Atualiza o texto do alerta
    message.innerHTML = `
      <h3>Parabéns! 🎉</h3>
      <p>Você alcançou o <strong>Nível ${level}</strong></p>
      <p style="color: #4caf50; font-weight: bold;">+${recompensaDicas} Dicas de Bônus! 💡</p>
    `;
    
    alertBox.classList.remove("hidden");
    alertBox.classList.add("show");

    // Adiciona as dicas ao saldo do jogador
    hintsAvailable += recompensaDicas;
    
    // Atualiza o visual do botão e contador de dicas
    updateHintStatus();
  }
}


function closeLevelUpAlert() {
  const alertBox = document.getElementById("level-up-alert");
  if (alertBox) {
    alertBox.classList.remove("show");
    alertBox.classList.add("hidden");
  }
}



const missionDescriptions = [
  "Complete uma partida sem cometer nenhum erro de combinação.",
  "Finalize o jogo em menos de 60 segundos.",
  "Utilize no máximo uma dica para vencer.",
  "Ganhe pelo menos 200 pontos de XP em uma única partida.",
  "Conclua três partidas consecutivas sem sair do jogo.",
  "Vença uma partida jogando na dificuldade DIFÍCIL.",
  "Suba de nível durante o dia atual."
];

function getDailyMissions() {
  const todayKey = getTodayKey();
  const saved = JSON.parse(localStorage.getItem("dailyMissions"));

  // Se já temos missões de hoje, carrega e retorna
  if (saved && saved.date === todayKey) {
    todayMissions = saved.missions;
    return todayMissions;
  }

  // NOVO DIA: Limpa tudo do dia anterior
  localStorage.removeItem("completedMissions");
  localStorage.removeItem("congratsShown");

  // Sorteia 3 novas missões
  const indices = Array.from({length: allMissions.length}, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  todayMissions = indices.slice(0, 3);
  
  // Salva o novo conjunto do dia
  localStorage.setItem("dailyMissions", JSON.stringify({ 
    date: todayKey, 
    missions: todayMissions 
  }));
  
  return todayMissions;
}

function checkMissions() {
  if (!todayMissions || todayMissions.length === 0) return;

  // Recupera o que já foi feito para não processar de novo
  const completed = JSON.parse(localStorage.getItem("completedMissions") || "[]");

  todayMissions.forEach((globalIndex) => {
    if (completed.includes(globalIndex)) return; // Pula se já estiver pronta

    const missionText = allMissions[globalIndex].toLowerCase();
    let metCriteria = false;

    // --- REGRAS DE VALIDAÇÃO (Ajuste os textos conforme seu array allMissions) ---
    
    // 1. Ganhar sem erros
    if (missionText.includes("sem erros") && errors === 0) {
      metCriteria = true;
    }
    
    // 2. Ganhar a partida (qualquer vitória)
    if (missionText.includes("ganhe") || missionText.includes("conclua")) {
      metCriteria = true;
    }

    // 3. Dificuldade específica
    if (missionText.includes(currentDifficulty)) {
      metCriteria = true;
    }

    // Se cumpriu, chama sua função de completar
    if (metCriteria) {
      completeMission(globalIndex);
    }
  });
}


function completeMission(globalIndex) {
  // 1. Garante que as missões de hoje estão carregadas
  if (!todayMissions || todayMissions.length === 0) {
    getDailyMissions();
  }

  // 2. Verifica se a missão faz parte do sorteio de hoje
  if (!todayMissions.includes(globalIndex)) return;

  // 3. Atualiza o LocalStorage
  let completed = JSON.parse(localStorage.getItem("completedMissions") || "[]");
  if (!completed.includes(globalIndex)) {
    completed.push(globalIndex);
    localStorage.setItem("completedMissions", JSON.stringify(completed));
    
    // 4. Feedback Visual imediato
    renderMissions(); // Recarrega a lista para mostrar o ✅
    updateMissionProgress();
  }
}

function renderMissions() {
  const list = document.getElementById("missions-list");
  const missionsTitle = document.querySelector(".missions h3");
  if (!list || !missionsTitle) return;

// SEGURANÇA: Se todayMissions estiver vazio, tenta carregar
  if (!window.todayMissions || todayMissions.length === 0) {
    todayMissions = getDailyMissions();
  }

  list.innerHTML = "";
  
  // Recupera o que já foi feito
  const completed = JSON.parse(localStorage.getItem("completedMissions") || "[]");

  todayMissions.forEach((index) => {
     // Verifica se o índice existe no array de textos para evitar o "undefined"
    const missionText = allMissions[index] || "Missão Misteriosa";
    
    const isDone = completed.includes(index);
    const li = document.createElement("li");
    
    li.className = isDone ? "completed" : "locked";
    
     // Aplicando a cor do tema diretamente via JS para garantir
    const theme = themes[currentTheme] || themes["default"];
    li.style.color = theme.textColor;
    
    li.innerHTML = `<span>${isDone ? "✅" : "🔒"}</span> ${allMissions[index]}`;

    li.addEventListener("click", () => {
      const detail = document.getElementById("mission-detail");
      if (detail) {
        detail.innerHTML = `<strong>${allMissions[index]}</strong><p>${missionDescriptions[index]}</p>`;
        detail.style.display = "block";
      }
    });

    list.appendChild(li);
  });

 // Atualiza a data e o progresso
  const dateParts = getTodayKey().split("-");
  missionsTitle.innerText = `🎯 Missões Diárias — ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
  
  applyTheme(currentTheme);
  updateMissionProgress();
}


function getTodayKey() {
  const today = new Date();
  return today.toISOString().split("T")[0]; 
  // Exemplo: "2026-04-01"
}



function updateMissionProgress() {
  const completed = JSON.parse(localStorage.getItem("completedMissions") || "[]");
  const total = todayMissions.length;
  const done = todayMissions.filter(m => completed.includes(m)).length;

  const progress = document.getElementById("mission-progress");
  if (progress) {
    progress.textContent = `Progresso: ${done} de ${total} missões concluídas hoje`;
  }

  const bar = document.getElementById("missions-progress-bar");
  if (bar) {
    const percent = total > 0 ? (done / total) * 100 : 0;
    bar.style.width = percent + "%";

    if (percent === 0) {
      bar.style.backgroundColor = "#f44336"; // vermelho
    } else if (percent < 100) {
      bar.style.backgroundColor = "#ff9800"; // laranja
    } else {
      bar.style.backgroundColor = "#4caf50"; // verde
    }
  }

  const congrats = document.getElementById("congrats-message");
  if (congrats) {
    if (done === total && total > 0) {
      // ✅ verifica se já mostramos hoje
      const todayKey = getTodayKey();
      const alreadyShown = localStorage.getItem("congratsShown") === todayKey;

      if (!alreadyShown) {
        congrats.classList.add("show");
        launchFireworks();

        const sound = document.getElementById("congrats-sound");
        if (sound) {
          sound.currentTime = 0;
          sound.play();
        }

        // marca que já mostramos hoje
        localStorage.setItem("congratsShown", todayKey);

        // remove depois de 5 segundos
        setTimeout(() => {
          congrats.classList.remove("show");
          stopFireworks();
        }, 5000);
      }
    } else {
      congrats.classList.remove("show");
      stopFireworks();
    }
  }
}





function updateProgressBar(currentXP, maxXP, level) {
  const bar = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");
  
  if (!bar || !text) return; // Segurança caso os elementos não existam na página

  // Garante que maxXP não seja zero para evitar erro de divisão (NaN)
  const safeMaxXP = maxXP > 0 ? maxXP : 100;
  const percent = Math.min((currentXP / safeMaxXP) * 100, 100);

  // Atualiza a largura com transição (suavidade definida no CSS)
  bar.style.width = `${percent}%`;

  // Gerencia as classes de cores de forma limpa
  bar.classList.remove("low", "medium", "high", "full");

  if (percent <= 30) {
    bar.classList.add("low");
  } else if (percent <= 70) {
    bar.classList.add("medium");
  } else if (percent < 100) {
    bar.classList.add("high");
  } else {
    bar.classList.add("full"); // Classe para o efeito de brilho/animação de Level Up
  }

  // Atualiza o texto de progresso
  text.innerText = `Nível: ${level} | XP: ${Math.floor(currentXP)}/${safeMaxXP}`;
}


function setDifficulty(level) {
  // 1. Atualiza a dificuldade técnica (usada nos IDs e lógica)
  currentDifficulty = level;

  // 2. Mapeamento para evitar múltiplos 'if'
  const difficultyMap = {
    easy: "FÁCIL",
    medium: "MÉDIO",
    hard: "DIFÍCIL"
  };

  // 3. Atualiza o nome de exibição (se não encontrar o level, assume FÁCIL)
  difficulty = difficultyMap[level] || "FÁCIL";

  // 4. Sincroniza o tempo limite com base na dificuldade escolhida
  // Garante que timeLimits exista para não travar o código
  if (typeof timeLimits !== "undefined" && timeLimits[level]) {
    totalTime = timeLimits[level];
    timeLeft = totalTime; 
  }

  // 5. Salva a preferência do usuário no navegador
  localStorage.setItem("difficulty", currentDifficulty);

  // 6. Reinicia o jogo com as novas configurações
  // Como a startGame() já faz o reset completo, não precisa da resetGame() aqui
  startGame();
}

// Função para desbloquear todos os áudios no primeiro clique
function unlockAudioContext() {
  if (audioUnlocked) return;

  const allAudios = document.querySelectorAll('audio');
  allAudios.forEach(audio => {
    // Toca um silêncio rápido ou apenas carrega
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(() => { /* ignora erros iniciais */ });
  });

  audioUnlocked = true;
  console.log("Sistema de áudio desbloqueado!");
  
  // Remove o evento após o primeiro uso
  window.removeEventListener('click', unlockAudioContext);
  window.removeEventListener('touchstart', unlockAudioContext);
}

// Escuta o primeiro clique ou toque na tela
window.addEventListener('click', unlockAudioContext);
window.addEventListener('touchstart', unlockAudioContext);





function showErrorEffect(cards) {
  if (!cards || !Array.isArray(cards)) return;

  cards.forEach(card => {
    // 1. Garante que a classe de erro seja aplicada
    card.classList.add("error-flash");

    // 2. Opcional: Adiciona uma pequena vibração no celular (haptic feedback)
    if (navigator.vibrate) {
      navigator.vibrate(50); 
    }

    // 3. Remove a classe após a animação terminar
    setTimeout(() => {
      card.classList.remove("error-flash");
    }, 500);
  });
}


function startGame() {
  audioUnlocked = false;
  // 1. Reset de Interface e Sistema
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  openCards = [];
  lockBoard = false;
  moves = 0;
  errors = 0;
  
  const movesDisplay = document.querySelector(".moves");
  if (movesDisplay) movesDisplay.innerText = `Jogadas: 0 | Erros: 0`;

if (somVitoria) {
      // Forçamos o recarregamento silencioso
      somVitoria.load(); 
  }
if (somDerrota) somDerrota.load();

const todosSons = [somVitoria, somDerrota, somAcerto, somErro, somAlertaTimer, somAplausos];
  todosSons.forEach(som => {
    if (som) {
      som.pause();
      som.currentTime = 0;
      // Truque para o navegador não "esquecer" o som no segundo jogo
      som.load(); 
    }
  });
  
 // Missões e Progresso (Usando  função getTodayKey)
  const todayKey = getTodayKey(); // "2026-04-05"
  const savedMissions = localStorage.getItem("dailyMissions");
  const lastSavedKey = localStorage.getItem("lastMissionDate");

  // Se a chave do dia for a mesma, não gera novas!
  if (savedMissions && lastSavedKey === todayKey) {
    todayMissions = JSON.parse(savedMissions);
  } else {
    // Se mudou o dia ou não tem nada salvo, gera do zero
    todayMissions = getDailyMissions(); 
    localStorage.setItem("dailyMissions", JSON.stringify(todayMissions));
    localStorage.setItem("lastMissionDate", todayKey);
  }
  
  renderMissions();


  // 3. Cálculo de Nível
  totalXP = parseInt(localStorage.getItem("totalXP")) || 0;
  let xpNeeded = 100, xpRemaining = totalXP, level = 1;
  while (xpRemaining >= xpNeeded) {
    xpRemaining -= xpNeeded;
    level++;
    xpNeeded += 50;
  }
  playerLevel = level;
  updateProgressBar(xpRemaining, xpNeeded, playerLevel);

  // 4. Dicas e Tema
  hintsUsed = 0;
   // 1. Define a base pela dificuldade (Garante que funcione em todas)
  let baseHints = 1; // Padrão para Hard
  if (currentDifficulty === "easy") {
    baseHints = 3;
  } else if (currentDifficulty === "medium") {
    baseHints = 2;
  }

  // 2. Recupera o bônus de nível que salvamos no localStorage
  const bonusHints = parseInt(localStorage.getItem("bonusHints")) || 0;

  // 3. A soma final: Base da dificuldade + Bônus de Level Up
  hintsAvailable = baseHints + bonusHints;
  
  updateHintStatus();
  
  applyTheme(currentTheme);
  
  

  // 5. Construção do Tabuleiro
  const board = document.querySelector(".board");
  if (!board) return;
  board.innerHTML = "";

  const shuffled = getEmojisForGame(currentTheme, currentDifficulty);
  
  shuffled.forEach(emoji => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.value = emoji;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front"></div>
        <div class="card-back">${emoji}</div>
      </div>
    `;
    card.onclick = () => flipCard(card);
    board.appendChild(card);
  });
}

function flipCard(card) {
// Isso avisa ao navegador que este áudio tem permissão para tocar depois.
  if (moves === 0 && openCards.length === 0) {
    const audios = [somVitoria, somAcerto, somErro, somAlertaTimer];
    audios.forEach(audio => {
      if (audio) {
        // O segredo: tocar e pausar imediatamente
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(e => console.log("Áudio aguardando interação..."));
      }
    });
  }

if (typeof audioUnlocked !== 'undefined' && !audioUnlocked) {
    if (typeof unlockAudioContext === "function") unlockAudioContext();
    audioUnlocked = true;
  }
  // Inicia o timer apenas se ele ainda não estiver rodando
  if (typeof startTimer === "function" && !timerInterval) {
    startTimer();
  }

  if (lockBoard || card.classList.contains("is-flipped") || openCards.length === 2) return;

  card.classList.add("is-flipped");
  openCards.push(card);

  if (openCards.length === 2) {
    moves++;
    const movesDisplay = document.querySelector(".moves");
    if (movesDisplay) movesDisplay.innerText = `Jogadas: ${moves} | Erros: ${errors}`;
    
    // Bloqueia o tabuleiro para o usuário não clicar em mais nada durante a checagem
    lockBoard = true;
    checkMatch();
  }
}

function checkMatch() {
  // Pegamos as cartas diretamente do array global para evitar erros de passagem de parâmetro
  const [card1, card2] = openCards;
  lockBoard = true; // Bloqueia tudo enquanto processa

  if (card1.dataset.value === card2.dataset.value) {
    
    if (somAcerto) {
    somAcerto.pause();
    somAcerto.currentTime = 0;
    somAcerto.play().catch(e => console.log("Áudio bloqueado"));
}

    
    // --- LÓGICA DE ACERTO ---
    card1.classList.add("boxMatch");
    card2.classList.add("boxMatch");

    if (navigator.vibrate) navigator.vibrate(150);

    openCards.forEach(card => {
      card.classList.add("success-flash");
      // Criação das partículas
      for (let i = 0; i < 10; i++) {
        const particle = document.createElement("span");
        particle.classList.add("confetti");
        card.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
      }
      setTimeout(() => card.classList.remove("success-flash"), 1000);
    });

    // Pequeno delay antes de liberar o tabuleiro para o próximo par
    setTimeout(() => {
      openCards = [];
      lockBoard = false;
      checkVictory(); // Verifica vitória após limpar o par atual
    }, 500);

  } else {
    if (somErro) {
    somErro.pause();
    somErro.currentTime = 0;
    somErro.play().catch(e => console.log("Áudio bloqueado"));
}
    // --- LÓGICA DE ERRO ---
    errors++;
    const movesDisplay = document.querySelector(".moves");
    if (movesDisplay) movesDisplay.innerText = `Jogadas: ${moves} | Erros: ${errors}`;

    openCards.forEach(card => {
      card.classList.add("error-flash", "shake");
      setTimeout(() => card.classList.remove("error-flash", "shake"), 600);
    });

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    // Tempo para o jogador memorizar antes de desvirar
    setTimeout(() => {
      card1.classList.remove("is-flipped");
      card2.classList.remove("is-flipped");
      openCards = [];
      lockBoard = false;
    }, 1200);
  }
}

function launchFireworks() {
  const container = document.getElementById("fireworks-container");
  if (!container) return;

  const interval = setInterval(() => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;

    // cria várias partículas por explosão
    for (let i = 0; i < 8; i++) {
      const firework = document.createElement("div");
      firework.className = "firework";
      firework.style.left = x + "px";
      firework.style.top = y + "px";

      // tamanho aleatório
      const size = 8 + Math.random() * 12;
      firework.style.width = size + "px";
      firework.style.height = size + "px";

      // cor aleatória bem vibrante
      firework.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;

      container.appendChild(firework);

      // remove após animação
      setTimeout(() => firework.remove(), 1000);
    }
  }, 400);

  container.dataset.intervalId = interval;
}

function stopFireworks() {
  const container = document.getElementById("fireworks-container");
  if (!container) return;

  if (container.dataset.intervalId) {
    clearInterval(container.dataset.intervalId);
    delete container.dataset.intervalId;
  }
  container.innerHTML = "";
}

function launchConfetti() {
  const duration = 3 * 1000;
  const end = Date.now() + duration;

  const alertBox = document.getElementById("level-up-alert");
  if (!alertBox) return; // Segurança caso o elemento não exista

  const rect = alertBox.getBoundingClientRect();
  const centerX = (rect.left + rect.right) / 2 / window.innerWidth;
  const centerY = (rect.top + rect.bottom) / 2 / window.innerHeight;

  // Lógica de Cores conforme nível
  let colors;
  if (playerLevel < 5) {
    colors = ["#2196f3", "#4caf50", "#ffeb3b"];
  } else if (playerLevel < 10) {
    colors = ["#9c27b0", "#f44336", "#ff9800"];
  } else {
    colors = ["#FFD700", "#C0C0C0", "#FFD700"]; // Ouro e Prata
  }

  (function frame() {
    // Disparo sincronizado com a biblioteca externa
    confetti({
      particleCount: 3, // Menos partículas por frame para não travar
      angle: 60,
      spread: 55,
      origin: { x: centerX - 0.1, y: centerY },
      colors: colors // Aplica suas cores aqui!
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: centerX + 0.1, y: centerY },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

function checkVictory() {
  const matched = document.querySelectorAll(".boxMatch").length;
  const cards = document.querySelectorAll(".card");
  
  // Só verifica se houver cartas no tabuleiro
  if (cards.length > 0 && matched === cards.length) {
    
     //  Para o timer primeiro para liberar processamento
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    if (somAlertaTimer) {
        somAlertaTimer.pause();
        somAlertaTimer.currentTime = 0;
    }
    
// 3. EXECUÇÃO DO SOM DE VITÓRIA
    if (somVitoria) {
    // 1. PARAR o som de acerto imediatamente para limpar o canal de áudio
    if (somAcerto) {
        somAcerto.pause();
        somAcerto.currentTime = 0;
    }

    // 2. Preparar a vitória
    somVitoria.pause();
    somVitoria.currentTime = 0;
    somVitoria.load();

    // 3. O delay estratégico (aumente para 600ms para garantir)
    setTimeout(() => {
        somVitoria.play().then(() => {
            exibirMensagemVitoria();
        }).catch(e => {
            console.log("Erro ao tocar vitória, tentando de novo...");
            somVitoria.play();
        });
    }, 600);
}
  }
}


// Criamos uma função separada para a mensagem não "atropelar" o áudio
function exibirMensagemVitoria() {
  const levelKey = playerLevel >= 10 ? "hard" : (playerLevel >= 5 ? "medium" : "default");
  const theme = themes[currentTheme] || themes["default"];

  if (winnerMsg) {
    winnerMsg.style.display = "block"; 
    winnerMsg.style.color = theme.textColor;
    winnerMsg.innerText = getVictoryMessage(levelKey);
  }
  
  // Chama o fim do jogo depois da mensagem
  setTimeout(() => {
    if (typeof checkMissions === "function") checkMissions();
    if (typeof endGame === "function") endGame(true);
  }, 1000);
}

function endGame(victory) {
  // 1. Captura de dados iniciais
  const oldLevel = playerLevel;
  const xpSummary = document.getElementById("xp-summary");
  const message = document.querySelector(".winner-message");
  const playAgainBtn = document.querySelector(".play-again");
  const tempoJogado = totalTime - timeLeft;
  
  // Para o cronômetro imediatamente
  if (timerInterval) clearInterval(timerInterval);

  // 2. Cálculo de XP (Usando sua função calculateXP)
  const baseXPAmount = document.querySelectorAll(".boxMatch").length * 10;
  const xpResult = calculateXP(baseXPAmount, errors, tempoJogado, difficulty);
  
  // 3. Lógica de Level Up e Confete
  if (xpResult.level > oldLevel) {
    playerLevel = xpResult.level; // Atualiza a variável global de nível 
    
    // Salva o progresso aqui para não perder se a página atualizar
    localStorage.setItem("playerLevel", playerLevel);
    localStorage.setItem("hintCount", hintsAvailable); // hintsAvailable é atualizado dentro do showLevelUpAlert
    
    
    
    showLevelUpAlert(xpResult.level);
    launchConfetti();
  }
 // 4. Atualização da Interface (Com adaptação de cor via JS)
  const theme = themes[currentTheme] || themes["default"]; // Pega o tema atual

  // 4. Atualização da Interface (Barra de Progresso)
  updateProgressBar(xpResult.currentXP, xpResult.nextLevelXP, xpResult.level);
  
  const progressText = document.getElementById("progress-text");
  if (progressText) {
    progressText.style.color = theme.textColor; // Garante a cor do tema
    progressText.innerHTML = `Nível: ${xpResult.level} | XP: ${xpResult.currentXP}/${xpResult.nextLevelXP}`;
  }

  // 5. Mapeamento de Dificuldade para Mensagens
  const difficultyMap = { "fácil": "easy", "médio": "medium", "difícil": "hard", "easy": "easy", "medium": "medium", "hard": "hard" };
  const levelKey = difficultyMap[difficulty.toLowerCase()] || "easy";

// 6. Tratamento de Vitória
  if (victory) {
    // Aplicando a cor do tema no resumo de XP
    xpSummary.style.color = theme.textColor; 
    xpSummary.innerHTML = `
      <p style="border-bottom: 1px solid ${theme.textColor}; padding-bottom: 5px; margin-bottom: 10px;">
        <strong>Resumo da Vitória:</strong>
      </p>
      <ul style="list-style: none; padding: 0; font-size: 0.9em; line-height: 1.6;">
        ${xpResult.breakdown}
      </ul>
      <hr style="border: 0; border-top: 1px dashed ${theme.textColor}44; margin: 10px 0;">
      <p>XP da Partida: <strong>+${xpResult.gainedXP}</strong></p>
      <p style="font-size: 0.8em; opacity: 0.8;">Total acumulado: ${xpResult.totalXP}</p>
    `;
        
    message.style.color = theme.textColor; // Garante que a mensagem de vitória combine
    message.innerText = getVictoryMessage(levelKey);
    
    // Só lança confete uma vez se não tiver subido de nível (evita duplicidade)
    if (xpResult.level <= oldLevel) {
      launchConfetti();
    }

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    // Lógica de Ranking e Conquistas
askPlayerName().then(name => {
  saveRanking(name, xpResult, tempoJogado, moves, difficulty);
  checkAchievements(errors, tempoJogado, difficulty, xpResult, hintsUsed, oldLevel);
  
  playerLevel = xpResult.level;
  localStorage.setItem("playerLevel", playerLevel);
  localStorage.setItem("totalXP", xpResult.totalXP);
});


  } else {
    // DERROTA
    xpSummary.innerHTML = `<p>Tempo esgotado!</p><p>Tempo jogado: ${tempoJogado}s</p>`;
    message.innerText = getDefeatMessage(levelKey);
    
    const defeatSound = document.getElementById("defeat-sound");
    if (defeatSound) {
      defeatSound.currentTime = 0;
      defeatSound.play().catch(() => {});
    }

    document.body.classList.add("defeat-flash");
    setTimeout(() => document.body.classList.remove("defeat-flash"), 3000);

    if (navigator.vibrate) navigator.vibrate([300, 200, 300]);
    
    // Na derrota também salvamos o XP ganho (se houver)
    localStorage.setItem("totalXP", xpResult.totalXP);
  }

  // 7. Exibe botões finais
  message.style.display = "block";
  if (playAgainBtn) {
    playAgainBtn.style.display = "inline-block";
 // Usamos o 'onclick' de forma limpa, garantindo que ele não se acumule
    playAgainBtn.onclick = null; // Limpa o clique anterior
    playAgainBtn.onclick = function() {

      // 3. Reinicia o jogo
      resetGame(); 
    }; 
  }
}

// Sugestão de melhoria:
function askPlayerName() {
  return new Promise((resolve) => {
    // Ajustado para os IDs que você já tem no seu HTML
    const modal = document.getElementById("name-modal");
    const input = document.getElementById("player-name");
    const saveBtn = document.getElementById("save-name");

    // Se algum elemento faltar, resolve como "Jogador" para não travar o jogo
    if (!saveBtn || !input || !modal) return resolve("Jogador");

    modal.style.display = "flex"; 
    input.focus(); 

    function handleSave() {
      const playerName = input.value.trim() || "Jogador";
      input.value = ""; 
      modal.style.display = "none";
      
      // Limpa os eventos para a próxima partida
      saveBtn.onclick = null;
      input.onkeydown = null;
      
      resolve(playerName);
    }

    // Salva ao clicar no botão
    saveBtn.onclick = handleSave;

    // Salva ao apertar Enter
    input.onkeydown = (e) => { 
      if (e.key === "Enter") handleSave(); 
    };
  });
}

function calculateXP(baseXP, errors, timeTaken, difficulty) {
  // 1. Identifica quantos pares foram feitos
  const totalAcertos = document.querySelectorAll(".boxMatch").length / 2;
  
  // 2. Define o valor por acerto (ex: 20 pontos por par)
  const pontosPorAcerto = 10; 
  const ganhoAcertos = totalAcertos * pontosPorAcerto;
  
  let points = ganhoAcertos; // Começamos os pontos com o que ele ganhou acertando
  let breakdown = [];

  // 3. Multiplicador de Dificuldade
  const diff = difficulty.toLowerCase();
  let multiplier = (diff === "médio" || diff === "medium") ? 2 : 
                   (diff === "difícil" || diff === "hard") ? 3 : 1;
  
  points *= multiplier;

  // Montando o resumo visual
  breakdown.push(`<li>🎯 Acertos: ${totalAcertos} pares (+${ganhoAcertos})</li>`);
  breakdown.push(`<li>🌍 Bônus Dificuldade: x${multiplier}</li>`);

  // 4. Penalidade por Erros (Exatamente como você queria, em contraste com os acertos)
  if (errors > 0) {
    const penalty = errors * 5;
    points -= penalty;
    breakdown.push(`<li>❌ Erros: ${errors} (-${penalty})</li>`);
  } else {
    points *= 2; // Bônus por partida perfeita
    breakdown.push(`<li>✨ Bônus: Perfeito! (x2)</li>`);
  }

  // 5. Bônus de Velocidade
  if (timeTaken < 60) {
    points += 20;
    breakdown.push(`<li>⚡ Rapidez: +20</li>`);
  }

  // Garante que o XP não seja negativo
  if (points < 0) points = 0;

  // Lógica de Próximo Nível (Nível e XP acumulado)
  let totalXPPosPartida = (totalXP || 0) + points;
  let xpNeeded = 100;
  let xpRemaining = totalXPPosPartida;
  let newLevel = 1;

  while (xpRemaining >= xpNeeded) {
    xpRemaining -= xpNeeded;
    newLevel++;
    xpNeeded += 50;
  }

  return { 
    gainedXP: points,
    totalXP: totalXPPosPartida,
    level: newLevel,
    currentXP: xpRemaining,
    nextLevelXP: xpNeeded,
    breakdown: breakdown.join("")
  };
}


function checkAchievements(errors, tempoJogado, difficulty, xpResult, hintsUsed, previousLevel) {
  const list = document.getElementById("achievements-list");
  if (!list) return;
  list.innerHTML = "";

  const addAchievement = (text, missionId) => {
    list.innerHTML += `<li>${text}</li>`;
    if (typeof completeMission === "function") completeMission(missionId);
  };

  if (errors === 0) addAchievement("✅ Sem erros", missionMap.noErrors);
  if (tempoJogado < 60) addAchievement("⚡ Rápido (menos de 1 min)", missionMap.fastWin);
  if (hintsUsed <= 1) addAchievement("🧩 Econômico nas dicas", missionMap.oneHint);
  
  if (xpResult?.gainedXP >= 200) addAchievement("💎 Mestre do XP (+200)", missionMap.highXP);

  // Lógica de Streak (Partidas seguidas)
  let streak = parseInt(localStorage.getItem("dailyStreak") || "0") + 1;
  localStorage.setItem("dailyStreak", streak);
  if (streak >= 3) addAchievement("🔥 Combo: 3 partidas!", missionMap.streak3);

  const diff = difficulty.toLowerCase();
  if (diff === "difícil" || diff === "hard") {
    addAchievement("🏋️ Desafio Hardcore", missionMap.hardMode);
  }

  if (xpResult && xpResult.level > previousLevel) {
    addAchievement("🌟 Subiu de Nível!", missionMap.newLevel);
  }
}

function startTimer() {
  if (timerInterval) return; // Segurança: nunca inicia dois timers ao mesmo tempo

  // Garante que os limites de tempo existam
  totalTime = timeLimits[currentDifficulty] || 60;
  timeLeft = totalTime;
  
  const bar = document.getElementById("timer-bar");
  
  const timerDisplay = document.querySelector(".timer");

  timerInterval = setInterval(() => {
    timeLeft--;
    
    if (timerDisplay) {
      timerDisplay.innerText = `Tempo: ${timeLeft}s`;
    }

    const percent = (timeLeft / totalTime) * 100;
    
    if (bar) {
      bar.style.width = percent + "%";
      
      // Lógica de cores simplificada
      if (percent > 60) {
        bar.style.backgroundColor = "limegreen";
      } else if (percent > 30) {
        bar.style.backgroundColor = "gold";
      } else {
        bar.style.backgroundColor = "red";
      }
    }

    // Feedback Intensivo nos últimos 10 segundos
    if (timeLeft <= 10 && timeLeft > 0) {
  if (bar) bar.style.animation = "pulse 0.8s infinite";
  
if (somAlertaTimer) {
    // Definimos o volume
    somAlertaTimer.volume = timeLeft <= 3 ? 1.0 : timeLeft <= 6 ? 0.8 : 0.6;
    
    // Reset e Play direto na variável
    somAlertaTimer.pause();
    somAlertaTimer.currentTime = 0;
    somAlertaTimer.play().catch(() => {});
  }

}

    // Efeito de Pânico aos 5 segundos
    if (timeLeft === 5) {
      if (timerDisplay) {
        timerDisplay.style.color = "#ff512f";
        timerDisplay.style.fontWeight = "bold";
      }
      document.body.classList.add("defeat-flash");
      setTimeout(() => document.body.classList.remove("defeat-flash"), 2000);

      if (navigator.vibrate) navigator.vibrate([300, 200, 300]);
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null; // Libera para o próximo jogo
      
      // Limpa animações antes de terminar
      if (bar) bar.style.animation = "none";
      
      // Chama o fim do jogo (Garanta que endGame trate as missões)
      if (typeof endGame === "function") {
        endGame(false);
    }
    }
  }, 1000); 
}

function resetGame() {
// 3. LIMPEZA DE INTERFACE (Evita o erro de alertBox)
const alertBox = document.getElementById("level-up-alert");
if (alertBox) {
  alertBox.classList.remove("show");
  alertBox.classList.add("hidden");
}
 
 if (winnerMsg) {
   winnerMsg.innerHTML = ""; // Apaga o texto de vitória/derrota
   winnerMsg.style.display = "none"; // Esconde a div completamente
 }
  
  // 1. Para qualquer contagem ativa imediatamente
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // 2. Limpa estilos de "pânico" do timer
  const timerDisplay = document.querySelector(".timer");
  if (timerDisplay) {
    timerDisplay.style.color = ""; 
    timerDisplay.style.textShadow = "";
  }

  const bar = document.getElementById("timer-bar");
  if (bar) {
    bar.style.animation = "";
  }
    // Recarrega os sons para o navegador "lembrar" deles na nova partida
    document.getElementById("correct-sound").load();
    document.getElementById("wrong-sound").load();
    document.getElementById("victory-sound").load();
    document.getElementById("congrats-sound").load();

  startGame();
}

let ranking = [];

fetch("/ranking.json")
  .then(response => response.json())
  .then(data => {
    // só usa se existir players
    if (data && data.players) {
    externalRanking.players = data.players;
    } else {
      console.warn("ranking.json não tem 'players'");
      externalRanking.players = [];
    }
    showRanking();
  })
  .catch(err => console.error("Erro ao carregar ranking:", err));

  
function importRanking(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);

      if (importedData.players && Array.isArray(importedData.players)) {
        // Mescla com o ranking atual
        let currentRanking = externalRanking ? externalRanking.players : [];
        externalRanking.players = mergeRankings(currentRanking, importedData.players);

        // Atualiza localStorage também
        localStorage.setItem("ranking", JSON.stringify(externalRanking.players));

        showRanking();
        alert("✅ Ranking importado com sucesso!");
      } else {
        alert("❌ Arquivo inválido. Certifique-se de que seja um ranking.json válido.");
      }
    } catch (err) {
      alert("❌ Erro ao ler o arquivo: " + err.message);
    }
  };
  reader.readAsText(file);
}
function loadRanking() {
  fetch("/ranking.json")
    .then(response => response.json())
    .then(data => {
      if (data && Array.isArray(data.players)) {
        externalRanking.players = data.players;
      } else {
        externalRanking.players = [];
      }

      // Mescla com localStorage
      let localData = JSON.parse(localStorage.getItem("ranking")) || [];
      externalRanking.players = mergeRankings(externalRanking.players, localData);

      localStorage.setItem("ranking", JSON.stringify(externalRanking.players));
      showRanking();
    })
    .catch(err => console.error("Erro ao carregar ranking:", err));
}
// Função para mesclar rankings sem duplicar
function mergeRankings(current, imported) {
  let combined = [...current];

  imported.forEach(player => {
    // Evita duplicar: compara nome + data
    let exists = combined.some(p => p.name === player.name && p.date === player.date);
    if (!exists) {
      combined.push(player);
    }
  });

  return combined;
}
function clearRanking() {
  if (confirm("Tem certeza que deseja apagar todos os recordes permanentemente?")) {
    externalRanking.players = []; // Limpa a variável na memória
    localStorage.removeItem("ranking"); // Remove do navegador
    showRanking(); // Atualiza a tela para mostrar "Ainda não há recordes"
  }
}




function showRanking() {
  const rankingDiv = document.querySelector(".ranking");
  if (!rankingDiv) return;

  // Filtra quem tem nome e ORDENA por pontuação (maior para menor)
  let players = externalRanking.players
    .filter(p => p.name && p.name.trim() !== "")
    .sort((a, b) => b.score - a.score) // O pulo do gato para o ranking funcionar!
    .slice(0, 10); // Mostra apenas os 10 melhores

  if (players.length === 0) {
    rankingDiv.innerHTML = "<h3>🏆 Ranking</h3><p>Ainda não há recordes. Seja o primeiro!</p>";
    return;
  }

  // Criando uma estrutura mais limpa (Tabela ou Lista estilizada)
  let html = "<h3>🏆 Top 10 Ranking</h3><ul>";
  players.forEach((r, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}º`;
    html += `
      <li class="ranking-item">
        <strong>${medal} ${r.name}</strong> — ${r.score} pts
        <br><small>${r.difficulty} | ${r.time}s | ${r.date}</small>
      </li>`;
  });
  html += "</ul>";
  
  rankingDiv.innerHTML = html;
  
   if (typeof applyTheme === "function") {
    applyTheme(currentTheme);
  }
}
function saveRanking(playerName, xpResult, tempoJogado, moves, difficulty) {
  const now = new Date();
  const dateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

  const playerData = {
    name: playerName.trim() || "Anônimo",
    score: xpResult.totalXP,
    difficulty: difficulty,
    time: tempoJogado,
    moves: moves,
    date: dateTime,
    achievements: [] // Você pode preencher isso antes de salvar se desejar
  };

  externalRanking.players.push(playerData);

  // Salva no LocalStorage (essencial para não perder os dados ao fechar a aba)
  localStorage.setItem("ranking", JSON.stringify(externalRanking.players));

  showRanking();
}

function exportRanking() {
  if (externalRanking.players.length === 0) {
    alert("O ranking está vazio!");
    return;
  }

  const dataStr = JSON.stringify({ players: externalRanking.players }, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "meu_ranking_memoria.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Vincula o evento de importação (certifique-se que o HTML tem um <input type="file" id="import-input">)
const importInput = document.getElementById("import-ranking-input");
if (importInput) {
  importInput.addEventListener("change", importRanking);
}




window.setDifficulty = setDifficulty;
window.closeLevelUpAlert = closeLevelUpAlert;
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("export-ranking")
    .addEventListener("click", exportRanking);
    
    // botão de dica extra
  document.getElementById("use-hint")
    .addEventListener("click", usarDicaExtra);
    
    // botão de jogar novamente
  const playAgainBtn = document.querySelector(".play-again");
  playAgainBtn.addEventListener("click", () => {
    resetGame(); // reinicia tempo, pontos etc.
    playAgainBtn.style.display = "none"; // esconde o botão
  });

  loadRanking(); // também carrega o ranking aqui
  loadThemes();

  // recupera preferências salvas
  const savedTheme = localStorage.getItem("theme");
  const savedDifficulty = localStorage.getItem("difficulty");

  if (savedTheme) {
    currentTheme = savedTheme;
    document.getElementById("themes").value = savedTheme;
  }
  if (savedDifficulty) {
    currentDifficulty = savedDifficulty;
  }

  startGame();
});

//  missões atualizam sozinhas na virada do dia
setInterval(() => {
  const todayKey = getTodayKey();
  const saved = JSON.parse(localStorage.getItem("dailyMissions"));

  if (!saved || saved.date !== todayKey) {
    // Usa a sua função oficial para não quebrar o formato dos dados
    todayMissions = getDailyMissions(); 
    renderMissions();
    console.log("Missões diárias atualizadas automaticamente.");
  }
}, 60000);
// Função simplificada para desbloquear
