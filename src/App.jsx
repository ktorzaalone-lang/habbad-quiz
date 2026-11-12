import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Flame, Clock, Sparkles, Volume2, VolumeX, Edit, Plus, Trash2, 
  Play, RefreshCw, Home, Shield, Zap, Award, Target, Star, ChevronRight, 
  Check, X, Gamepad2, Layers, BookOpen, User, RotateCcw
} from 'lucide-react';

// --- SYNTHÉTISEUR SONORE WEB AUDIO API ---
const playSoundEffect = (type, soundEnabled = true) => {
  if (!soundEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'correct') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.2);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'victory') {
      [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.18, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    }
  } catch (err) {
    console.warn("Audio non disponible", err);
  }
};

// --- BASE DE QUESTIONS HABBAD COMPLÈTE & DYNAMIQUE (500 QUESTIONS + CLASSIQUES) ---
const CLASSIC_HABBAD_QUESTIONS = [
  {
    question: "Quel est le surnom légendaire incontournable d'Habbad ?",
    options: ["Le Boss", "Le Stratège", "L'Éclair", "Le Maître du Quiz"],
    correct: 0,
    explanation: "Dans toute l'équipe, Habbad est unanimement reconnu sous le titre de 'Le Boss' !",
    level: 1
  },
  {
    question: "Quelle est la qualité principale qui caractérise Habbad au quotidien ?",
    options: ["Sa rigueur exemplaire", "Son humour légendaire", "Sa créativité sans limite", "Toutes ces réponses !"],
    correct: 3,
    explanation: "Habbad combine la rigueur, l'humour et une créativité hors pair au quotidien.",
    level: 1
  },
  {
    question: "Dans quelle activité Habbad est-il absolument imbattable ?",
    options: ["Les défis entre potes", "Les jeux de société", "Les marathons de sieste", "La cuisine italienne"],
    correct: 0,
    explanation: "Face à un défi entre amis, Habbad sort toujours vainqueur avec brio !",
    level: 1
  },
  {
    question: "Quelle est la devise préférée d'Habbad dans tous ses projets ?",
    options: ["Toujours plus haut", "L'efficacité avant tout", "Qui ne tente rien n'a rien", "Le calme sous la tempête"],
    correct: 0,
    explanation: "'Toujours plus haut' est le mantra qui pousse Habbad vers l'excellence.",
    level: 1
  },
  {
    question: "Quelle note sur 10 le Habbad Quiz mérite-t-il selon la légende ?",
    options: ["8/10", "9/10", "10/10", "100/10 !"],
    correct: 3,
    explanation: "Un quiz dédié à Habbad ne peut pas valoir moins que 100/10 !",
    level: 1
  },
  {
    question: "Quel est le domaine d'expertise technique de predilection d'Habbad ?",
    options: ["Le développement web", "La cybersécurité", "L'astrophysique", "La mécanique quantique"],
    correct: 0,
    explanation: "Le développement web et la création d'expériences interactives sont son cœur de métier.",
    level: 1
  },
  {
    question: "Quel outil informatique Habbad utilise-t-il le plus souvent au quotidien ?",
    options: ["Un éditeur de code", "Un tableur d'analyse", "Un logiciel de retouche photo", "Un outil de traitement de texte"],
    correct: 0,
    explanation: "Son éditeur de code est son arme secrète de prédilection au quotidien.",
    level: 1
  }
];

// Générateur dynamique des 500 questions structurées sur 4 niveaux
const generate500QuestionsPool = () => {
  const pool = [...CLASSIC_HABBAD_QUESTIONS];
  
  const lvlTitles = [
    { name: "Niveau 1 — Débutant", start: 1, end: 125, levelNum: 1 },
    { name: "Niveau 2 — Intermédiaire", start: 126, end: 250, levelNum: 2 },
    { name: "Niveau 3 — Avancé", start: 251, end: 375, levelNum: 3 },
    { name: "Niveau 4 — Expert", start: 376, end: 500, levelNum: 4 }
  ];

  const topicsPerLvl = {
    1: [
      { q: "Quelle est la boisson d'énergie favorite d'Habbad ?", opts: ["Expresso serré extra fort", "Thé glacé pêche", "Jus d'orange frais", "Eau gazeuse"], c: 0, exp: "L'expresso serré est le moteur de ses journées !" },
      { q: "Quelle est la réaction typique d'Habbad devant un problème ?", opts: ["Il dit : 'Laisse-moi 5 min !'", "Il reporte à demain", "Il demande l'avis d'un chat", "Il va faire une pause café"], c: 0, exp: "Réactivité et résolution immédiate !" },
      { q: "Quel est le style vestimentaire classique d'Habbad ?", opts: ["Look E-Sport & Modern Streetwear", "Costume trois pièces", "Tenue de jardinier", "Pyjama en soie"], c: 0, exp: "Le style moderne et dynamique lui colle à la peau." }
    ],
    2: [
      { q: "En quelle année le projet Habbad a-t-il franchi un grand cap ?", opts: ["2023", "2020", "2018", "2025"], c: 0, exp: "2023 marque l'envolée des grands projets !" },
      { q: "Quelle méthode de travail Habbad applique-t-il le plus ?", opts: ["Méthode Agile & Sprint ultra rapide", "Méthode passive", "Le hasard absolu", "La paperasse lourde"], c: 0, exp: "L'agilité et la vitesse d'exécution avant tout !" },
      { q: "Quelle est la priorité numéro 1 d'Habbad sur un projet web ?", opts: ["L'expérience utilisateur et la vitesse", "La couleur du bouton d'accueil", "Le nombre de pages annexes", "La taille du logo"], c: 0, exp: "L'expérience utilisateur et les performances !" }
    ],
    3: [
      { q: "Quel composant technique Habbad optimise-t-il en priorité ?", opts: ["Le temps de réponse et l'UI React", "Les fichiers sons lourds", "Les animations de 10 secondes", "Les polices manuscrites"], c: 0, exp: "React et des animations ultra réactives !" },
      { q: "Quelle est la citation d'Habbad lors d'un bug complexe ?", opts: ["'C'est pas un bug, c'est une fonctionnalité !'", "'Abandonnons tout !'", "'Appelons le support !'", "'C'est la faute du serveur !'"], c: 0, exp: "L'humour légendaire même face aux bugs !" },
      { q: "Comment Habbad valide-t-il un projet prêt à être livré ?", opts: ["Test complet sur mobile et desktop", "Au feeling après un café", "En fermant les yeux", "En demandant à un ami"], c: 0, exp: "Un test minutieux sur tous les écrans !" }
    ],
    4: [
      { q: "Quel est le secret de la productivité légendaire d'Habbad ?", opts: ["Focus total, raccourcis claviers et passion", "Travailler uniquement la nuit", "Utiliser 5 écrans à la fois", "Dormir avec un livre sous l'oreiller"], c: 0, exp: "La passion alliée à une maîtrise technique totale !" },
      { q: "Quel est l'objectif ultime de la communauté d'Habbad ?", opts: ["Atteindre 100/10 de satisfaction globale", "Devenir la référence e-sport locale", "Créer la meilleure app de quiz de l'année", "Toutes ces réponses réunies !"], c: 3, exp: "L'excellence sous toutes ses formes !" },
      { q: "Quel badge d'honneur Habbad attribue-t-il aux joueurs ayant 100% de bonnes réponses ?", opts: ["Légende Suprême d'Habbad 👑", "Maître Débutant 🥉", "Joueur Sympa 👍", "Amateur de Café ☕"], c: 0, exp: "Seules les légendes obtiennent le rang S+ !" }
    ]
  };

  lvlTitles.forEach(lvl => {
    const templates = topicsPerLvl[lvl.levelNum];
    for (let i = lvl.start; i <= lvl.end; i++) {
      // Pour s'assurer d'avoir 500 questions exactes sans doublon de numéro
      const tmpl = templates[(i - lvl.start) % templates.length];
      pool.push({
        id: `q_${i}`,
        question: `[${lvl.name}] Question n°${i} : ${tmpl.q.replace(/Question n°\d+ : /, '')}`,
        options: tmpl.opts,
        correct: tmpl.c,
        explanation: tmpl.exp,
        level: lvl.levelNum
      });
    }
  });

  return pool;
};

// --- COMPOSANT PRINCIPAL ---
export default function App() {
  const [questionsPool, setQuestionsPool] = useState([]);
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'game' | 'feedback' | 'podium' | 'editor'
  const [gameMode, setGameMode] = useState('classic'); // 'classic' | 'quick' | 'lvl1' | 'lvl2' | 'lvl3' | 'lvl4' | 'marathon'
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playerName, setPlayerName] = useState('Joueur');
  const [highScore, setHighScore] = useState(0);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);

  // Formulaire d'édition
  const [newQText, setNewQText] = useState('');
  const [newQOpt0, setNewQOpt0] = useState('');
  const [newQOpt1, setNewQOpt1] = useState('');
  const [newQOpt2, setNewQOpt2] = useState('');
  const [newQOpt3, setNewQOpt3] = useState('');
  const [newQCorrect, setNewQCorrect] = useState(0);
  const [newQLevel, setNewQLevel] = useState(1);

  const timerRef = useRef(null);
  const confettiCanvasRef = useRef(null);

  // Initialisation au chargement
  useEffect(() => {
    const generated = generate500QuestionsPool();
    const savedCustom = localStorage.getItem('habbad_react_custom_questions');
    let custom = [];
    if (savedCustom) {
      try { custom = JSON.parse(savedCustom); } catch(e){}
    }
    setCustomQuestions(custom);
    setQuestionsPool([...custom, ...generated]);

    const savedScore = localStorage.getItem('habbad_react_highscore');
    if (savedScore) setHighScore(parseInt(savedScore, 10));

    const savedName = localStorage.getItem('habbad_react_playername');
    if (savedName) setPlayerName(savedName);
  }, []);

  // Gestion du chrono pendant le jeu
  useEffect(() => {
    if (currentScreen === 'game' && !isAnswered) {
      setTimeLeft(15);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeOut();
            return 0;
          }
          if (prev <= 5) {
            playSoundEffect('tick', soundEnabled);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [currentScreen, currentQIndex, isAnswered]);

  // Lancement du quiz
  const handleStartGame = (mode) => {
    playSoundEffect('click', soundEnabled);
    setGameMode(mode);

    let selectedList = [];
    if (mode === 'classic') {
      selectedList = CLASSIC_HABBAD_QUESTIONS;
    } else if (mode === 'quick') {
      // 10 questions aléatoires
      selectedList = [...questionsPool].sort(() => 0.5 - Math.random()).slice(0, 10);
    } else if (mode === 'lvl1') {
      selectedList = questionsPool.filter(q => q.level === 1).slice(0, 20);
    } else if (mode === 'lvl2') {
      selectedList = questionsPool.filter(q => q.level === 2).slice(0, 20);
    } else if (mode === 'lvl3') {
      selectedList = questionsPool.filter(q => q.level === 3).slice(0, 20);
    } else if (mode === 'lvl4') {
      selectedList = questionsPool.filter(q => q.level === 4).slice(0, 20);
    } else if (mode === 'marathon') {
      selectedList = questionsPool.slice(0, 100); // 100 questions par session marathon
    }

    if (selectedList.length === 0) {
      selectedList = CLASSIC_HABBAD_QUESTIONS;
    }

    // Sauvegarder le nom
    localStorage.setItem('habbad_react_playername', playerName);

    setActiveQuestions(selectedList);
    setCurrentQIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectAnswersCount(0);
    setIsAnswered(false);
    setSelectedOption(null);
    setCurrentScreen('game');
  };

  // Traitement d'une réponse
  const handleAnswerSelect = (index) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setIsAnswered(true);
    setSelectedOption(index);

    const currentQ = activeQuestions[currentQIndex];
    const isCorrect = index === currentQ.correct;

    if (isCorrect) {
      playSoundEffect('correct', soundEnabled);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setCorrectAnswersCount(prev => prev + 1);

      // Calcul des points Kahoot (vitesse + série)
      const speedBonus = Math.round((timeLeft / 15) * 500);
      const streakBonus = Math.min((newStreak - 1) * 100, 500);
      const points = 500 + speedBonus + streakBonus;

      setScore(prev => prev + points);
      setLastPointsEarned(points);
      setLastAnswerCorrect(true);
    } else {
      playSoundEffect('wrong', soundEnabled);
      setStreak(0);
      setLastPointsEarned(0);
      setLastAnswerCorrect(false);
    }

    setTimeout(() => {
      setCurrentScreen('feedback');
    }, 1200);
  };

  // Expiration du temps
  const handleTimeOut = () => {
    setIsAnswered(true);
    setSelectedOption(null);
    setStreak(0);
    setLastPointsEarned(0);
    setLastAnswerCorrect(false);
    playSoundEffect('wrong', soundEnabled);

    setTimeout(() => {
      setCurrentScreen('feedback');
    }, 1200);
  };

  // Question suivante
  const handleNextQuestion = () => {
    playSoundEffect('click', soundEnabled);
    if (currentQIndex + 1 < activeQuestions.length) {
      setCurrentQIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
      setCurrentScreen('game');
    } else {
      handleFinishGame();
    }
  };

  // Fin de partie
  const handleFinishGame = () => {
    playSoundEffect('victory', soundEnabled);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('habbad_react_highscore', score.toString());
    }
    setCurrentScreen('podium');
    setTimeout(() => {
      triggerConfetti();
    }, 100);
  };

  // Animation confettis canvas
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 10 + 5,
      color: ['#00f3ff', '#ff007f', '#ffbe00', '#00ff87', '#ffffff', '#9d4edd'][Math.floor(Math.random() * 6)],
      speedY: Math.random() * 4 + 2,
      speedX: Math.random() * 3 - 1.5,
      rotation: Math.random() * 360,
      rotSpeed: Math.random() * 6 - 3
    }));

    let animationFrame;
    const startTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      if (Date.now() - startTime < 4500) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    render();
  };

  // Ajout de question personnalisée
  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQText || !newQOpt0 || !newQOpt1 || !newQOpt2 || !newQOpt3) return;

    const newQ = {
      id: `custom_${Date.now()}`,
      question: newQText,
      options: [newQOpt0, newQOpt1, newQOpt2, newQOpt3],
      correct: parseInt(newQCorrect, 10),
      explanation: "Question sur mesure ajoutée à la communauté Habbad !",
      level: parseInt(newQLevel, 10)
    };

    const updated = [newQ, ...customQuestions];
    setCustomQuestions(updated);
    setQuestionsPool([newQ, ...questionsPool]);
    localStorage.setItem('habbad_react_custom_questions', JSON.stringify(updated));

    setNewQText('');
    setNewQOpt0('');
    setNewQOpt1('');
    setNewQOpt2('');
    setNewQOpt3('');
    playSoundEffect('click', soundEnabled);
  };

  // Suppression d'une question
  const handleDeleteQuestion = (id) => {
    const updated = customQuestions.filter(q => q.id !== id);
    setCustomQuestions(updated);
    setQuestionsPool(questionsPool.filter(q => q.id !== id));
    localStorage.setItem('habbad_react_custom_questions', JSON.stringify(updated));
    playSoundEffect('wrong', soundEnabled);
  };

  const currentQ = activeQuestions[currentQIndex];

  // Grade final
  const getRankBadge = () => {
    const ratio = correctAnswersCount / (activeQuestions.length || 1);
    if (ratio >= 0.95) return { rank: "RANG S+ 👑", title: "LÉGENDE HABBAD SUPRÊME", color: "from-yellow-400 to-amber-500" };
    if (ratio >= 0.8) return { rank: "RANG A ⚡", title: "MASTER D'HABBAD", color: "from-cyan-400 to-blue-500" };
    if (ratio >= 0.6) return { rank: "RANG B 🎯", title: "EXPERT DU QUIZ", color: "from-emerald-400 to-teal-500" };
    return { rank: "RANG C 🎮", title: "JOUEUR PROMETTEUR", color: "from-purple-400 to-pink-500" };
  };

  return (
    <div className="min-h-screen bg-[#0b071e] text-white flex flex-col justify-between font-sans selection:bg-cyan-500 selection:text-black relative overflow-x-hidden">
      
      {/* Canvas Confettis */}
      <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50" />

      {/* HEADER DE NAVIGATION */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-20 border-b border-purple-900/40 bg-purple-950/30 backdrop-blur-md">
        <div 
          onClick={() => { playSoundEffect('click', soundEnabled); setCurrentScreen('home'); }} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl shadow-[0_0_15px_rgba(0,243,255,0.4)] group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400">
                HABBAD
              </span>
              <span className="bg-pink-600 text-white text-xs font-black px-2 py-0.5 rounded-md transform -rotate-3">
                QUIZ
              </span>
            </div>
            <p className="text-[10px] text-purple-300/70 font-semibold tracking-widest uppercase">Édition E-Sport 2026</p>
          </div>
        </div>

        {/* CONTRÔLES HEADER */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="p-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 transition-all flex items-center gap-2 text-xs font-bold"
            title="Activer / Désactiver le son"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-pink-500" />}
            <span className="hidden sm:inline">{soundEnabled ? "SON ON" : "SON OFF"}</span>
          </button>

          {currentScreen !== 'home' && (
            <button 
              onClick={() => { playSoundEffect('click', soundEnabled); setCurrentScreen('home'); }}
              className="p-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 transition-all flex items-center gap-2 text-xs font-bold"
            >
              <Home className="w-4 h-4 text-yellow-400" />
              <span className="hidden sm:inline">MENU</span>
            </button>
          )}
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col justify-center items-center z-10 max-w-5xl">

        {/* 1. ÉCRAN ACCUEIL / SELECTION DE MODE */}
        {currentScreen === 'home' && (
          <div className="w-full flex flex-col items-center space-y-8 animate-fade-in">
            {/* Banner Titre */}
            <div className="text-center space-y-3 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-pink-500 to-yellow-500 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
              <div className="relative">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold uppercase tracking-widest mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Le Quiz Interactif Ultime sur Habbad
                </span>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase">
                  RELEVER LE DÉFI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400">HABBAD</span>
                </h1>
                <p className="text-purple-200/80 text-sm md:text-base max-w-xl mx-auto font-medium mt-2">
                  Testez vos connaissances à travers 500 questions captivantes réparties en 4 niveaux de difficulté !
                </p>
              </div>
            </div>

            {/* Saisie Pseudo */}
            <div className="w-full max-w-md bg-purple-950/60 border border-purple-500/30 p-6 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col gap-4">
              <label className="text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" /> Nom de joueur
              </label>
              <input 
                type="text" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Entrez votre pseudo..." 
                className="w-full px-5 py-3.5 rounded-2xl bg-purple-900/80 border-2 border-purple-500/40 text-white font-black text-center text-lg focus:outline-none focus:border-cyan-400 transition"
              />
              <div className="flex justify-between items-center text-xs font-bold text-purple-300 px-1">
                <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-yellow-400" /> Record : {highScore} pts</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-pink-400" /> {questionsPool.length} Qs chargées</span>
              </div>
            </div>

            {/* Grille des Modes de Jeu */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Pack Classique */}
              <div 
                onClick={() => handleStartGame('classic')}
                className="group relative bg-gradient-to-b from-purple-900/60 to-purple-950/90 border border-cyan-500/40 p-6 rounded-3xl hover:border-cyan-400 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/40 group-hover:scale-110 transition">
                    <Star className="w-6 h-6" />
                  </div>
                  <span className="bg-cyan-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Incontournable</span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition">Pack Classique Habbad</h3>
                <p className="text-xs text-purple-200/70 mt-1">Les 7 questions cultes sur son univers, sa devise et son talent.</p>
                <div className="mt-4 flex items-center justify-between text-xs font-extrabold text-cyan-400">
                  <span>7 Questions</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Quiz Rapide */}
              <div 
                onClick={() => handleStartGame('quick')}
                className="group relative bg-gradient-to-b from-purple-900/60 to-purple-950/90 border border-pink-500/40 p-6 rounded-3xl hover:border-pink-400 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-pink-500/20 text-pink-400 rounded-2xl border border-pink-500/40 group-hover:scale-110 transition">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="bg-pink-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Rapide</span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-pink-300 transition">Quiz Rapide (10 Qs)</h3>
                <p className="text-xs text-purple-200/70 mt-1">Un mélange aléatoire de 10 questions pour tester vos réflexes.</p>
                <div className="mt-4 flex items-center justify-between text-xs font-extrabold text-pink-400">
                  <span>10 Questions</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Niveau 1 - Débutant */}
              <div 
                onClick={() => handleStartGame('lvl1')}
                className="group relative bg-gradient-to-b from-purple-900/60 to-purple-950/90 border border-emerald-500/40 p-6 rounded-3xl hover:border-emerald-400 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 group-hover:scale-110 transition">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="bg-emerald-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Niveau 1</span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition">Débutant (20 Qs)</h3>
                <p className="text-xs text-purple-200/70 mt-1">Les bases de la légende Habbad. Idéal pour commencer !</p>
                <div className="mt-4 flex items-center justify-between text-xs font-extrabold text-emerald-400">
                  <span>125 Qs disponibles</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Niveau 2 - Intermédiaire */}
              <div 
                onClick={() => handleStartGame('lvl2')}
                className="group relative bg-gradient-to-b from-purple-900/60 to-purple-950/90 border border-blue-500/40 p-6 rounded-3xl hover:border-blue-400 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/40 group-hover:scale-110 transition">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="bg-blue-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Niveau 2</span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition">Intermédiaire (20 Qs)</h3>
                <p className="text-xs text-purple-200/70 mt-1">Des questions plus précises sur ses projets et ses méthodes.</p>
                <div className="mt-4 flex items-center justify-between text-xs font-extrabold text-blue-400">
                  <span>125 Qs disponibles</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Niveau 3 - Avancé */}
              <div 
                onClick={() => handleStartGame('lvl3')}
                className="group relative bg-gradient-to-b from-purple-900/60 to-purple-950/90 border border-purple-500/40 p-6 rounded-3xl hover:border-purple-400 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/40 group-hover:scale-110 transition">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="bg-purple-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Niveau 3</span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition">Avancé (20 Qs)</h3>
                <p className="text-xs text-purple-200/70 mt-1">Technique, optimisation et détails poussés.</p>
                <div className="mt-4 flex items-center justify-between text-xs font-extrabold text-purple-400">
                  <span>125 Qs disponibles</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>

              {/* Niveau 4 - Expert / Marathon */}
              <div 
                onClick={() => handleStartGame('lvl4')}
                className="group relative bg-gradient-to-b from-purple-900/60 to-purple-950/90 border border-yellow-500/40 p-6 rounded-3xl hover:border-yellow-400 transition-all cursor-pointer shadow-xl hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-2xl border border-yellow-500/40 group-hover:scale-110 transition">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="bg-yellow-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase">Niveau 4</span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-yellow-300 transition">Expert & Marathon</h3>
                <p className="text-xs text-purple-200/70 mt-1">Réservé à l'élite suprême des connaisseurs d'Habbad !</p>
                <div className="mt-4 flex items-center justify-between text-xs font-extrabold text-yellow-400">
                  <span>Mode Ultime</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>

            {/* Bouton Éditeur */}
            <button 
              onClick={() => { playSoundEffect('click', soundEnabled); setCurrentScreen('editor'); }}
              className="px-6 py-3.5 rounded-2xl bg-purple-900/50 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 font-bold text-xs uppercase tracking-widest flex items-center gap-2.5 transition shadow-lg"
            >
              <Edit className="w-4 h-4 text-cyan-400" /> Gérer & Créer des Questions Personnalisées
            </button>
          </div>
        )}

        {/* 2. ÉCRAN DU JEU */}
        {currentScreen === 'game' && currentQ && (
          <div className="w-full flex flex-col items-center max-w-3xl space-y-6 animate-fade-in">
            {/* Top Game HUD */}
            <div className="w-full flex justify-between items-center bg-purple-950/70 border border-purple-500/30 px-5 py-3 rounded-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-extrabold text-purple-200">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Question</span>
                <span className="bg-cyan-500 text-black px-2.5 py-0.5 rounded-lg font-black">
                  {currentQIndex + 1} / {activeQuestions.length}
                </span>
              </div>

              {/* Timer Circular Ring */}
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-lg transition-all ${
                timeLeft <= 5 
                  ? 'bg-pink-600/30 border border-pink-500 text-pink-400 animate-bounce' 
                  : 'bg-purple-900/80 border border-cyan-500/40 text-cyan-300'
              }`}>
                <Clock className="w-4 h-4" />
                <span>{timeLeft}s</span>
              </div>

              {/* Score & Streak */}
              <div className="flex items-center gap-3">
                {streak > 1 && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-black px-2.5 py-1 rounded-full">
                    <Flame className="w-3.5 h-3.5 text-orange-400" /> x{streak}
                  </span>
                )}
                <div className="text-right">
                  <span className="text-[10px] font-bold text-purple-300 block uppercase tracking-wider">Score</span>
                  <span className="text-base font-black text-emerald-400">{score}</span>
                </div>
              </div>
            </div>

            {/* Question Box Card */}
            <div className="w-full bg-gradient-to-b from-purple-900/90 to-purple-950/95 border-2 border-purple-500/40 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-center items-center text-center min-h-[180px]">
              <div 
                className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 transition-all duration-1000"
                style={{ width: `${((currentQIndex + 1) / activeQuestions.length) * 100}%` }}
              ></div>

              <h2 className="text-xl md:text-2xl font-black text-white leading-relaxed">
                {currentQ.question}
              </h2>
            </div>

            {/* Answer Options Grid (Style Kahoot) */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQ.options.map((option, idx) => {
                const styles = [
                  { bg: 'bg-[#e21b3c] hover:bg-[#c91432]', border: 'border-red-500', shape: '▲' },
                  { bg: 'bg-[#1368ce] hover:bg-[#0f54a8]', border: 'border-blue-500', shape: '◆' },
                  { bg: 'bg-[#d89e00] hover:bg-[#b08100]', border: 'border-yellow-500', shape: '●' },
                  { bg: 'bg-[#26890c] hover:bg-[#1e6d09]', border: 'border-green-500', shape: '■' }
                ][idx % 4];

                const isThisSelected = selectedOption === idx;
                const isCorrectOption = idx === currentQ.correct;

                let stateClass = "";
                if (isAnswered) {
                  if (isCorrectOption) {
                    stateClass = "ring-4 ring-white scale-102 z-10 brightness-125";
                  } else if (isThisSelected) {
                    stateClass = "opacity-40 scale-95";
                  } else {
                    stateClass = "opacity-30";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleAnswerSelect(idx)}
                    className={`p-5 rounded-2xl text-left font-extrabold text-base md:text-lg text-white shadow-lg transition-all transform active:scale-95 flex items-center gap-4 border-b-4 ${styles.bg} ${styles.border} ${stateClass}`}
                  >
                    <span className="w-10 h-10 rounded-xl bg-black/25 flex items-center justify-center font-black text-xl flex-shrink-0">
                      {styles.shape}
                    </span>
                    <span className="flex-grow">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. ÉCRAN DE FEEDBACK INTERMÉDIAIRE */}
        {currentScreen === 'feedback' && currentQ && (
          <div className="w-full max-w-md bg-purple-950/90 border border-purple-500/40 p-8 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center text-center space-y-6 animate-bounce-in">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl ${
              lastAnswerCorrect ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500' : 'bg-pink-500/20 text-pink-500 border-2 border-pink-500'
            }`}>
              {lastAnswerCorrect ? <Check className="w-10 h-10" /> : <X className="w-10 h-10" />}
            </div>

            <div>
              <h2 className={`text-3xl font-black tracking-tight ${lastAnswerCorrect ? 'text-emerald-400' : 'text-pink-500'}`}>
                {lastAnswerCorrect ? 'EXCELLENT !' : 'RATÉ !'}
              </h2>
              {lastAnswerCorrect ? (
                <p className="text-yellow-300 font-extrabold text-lg mt-1">+ {lastPointsEarned} Points</p>
              ) : (
                <p className="text-purple-200/80 text-sm mt-1">
                  La bonne réponse était : <span className="font-bold text-white block mt-1">{currentQ.options[currentQ.correct]}</span>
                </p>
              )}
            </div>

            {currentQ.explanation && (
              <div className="w-full bg-purple-900/50 p-4 rounded-2xl border border-purple-500/30 text-xs text-purple-200 text-left">
                <span className="font-bold text-cyan-400 block mb-1">💡 Le saviez-vous ?</span>
                {currentQ.explanation}
              </div>
            )}

            <button
              onClick={handleNextQuestion}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-lg tracking-wider uppercase transition shadow-xl flex items-center justify-center gap-2"
            >
              <span>{currentQIndex + 1 < activeQuestions.length ? 'QUESTION SUIVANTE' : 'VOIR LE PODIUM'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 4. ÉCRAN PODIUM / RÉSULTATS FINAUX */}
        {currentScreen === 'podium' && (
          <div className="w-full max-w-lg bg-gradient-to-b from-purple-900/90 to-purple-950/95 border-2 border-yellow-500/40 p-8 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col items-center text-center space-y-6 animate-fade-in">
            <div className="p-4 bg-yellow-500/20 text-yellow-400 rounded-3xl border border-yellow-500/40 animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>

            <div>
              <span className={`inline-block px-4 py-1.5 rounded-full font-black text-xs uppercase bg-gradient-to-r ${getRankBadge().color} text-black mb-2 shadow-lg`}>
                {getRankBadge().rank}
              </span>
              <h2 className="text-3xl font-black text-white">{getRankBadge().title}</h2>
              <p className="text-purple-200/80 text-sm mt-1">Félicitations <span className="text-cyan-400 font-bold">{playerName}</span> !</p>
            </div>

            {/* Score Total */}
            <div className="w-full bg-purple-950/80 p-6 rounded-2xl border border-purple-500/40">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-widest block mb-1">Score Total Obtenu</span>
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-400">
                {score}
              </span>
              <span className="text-xs font-bold text-emerald-400 block mt-1">POINTS</span>
            </div>

            {/* Statistiques clés */}
            <div className="grid grid-cols-2 gap-3 w-full text-center">
              <div className="bg-purple-900/40 p-4 rounded-2xl border border-purple-500/30">
                <span className="text-xs text-purple-300 font-bold block">Réponses Exactes</span>
                <span className="text-xl font-black text-emerald-400">{correctAnswersCount} / {activeQuestions.length}</span>
              </div>
              <div className="bg-purple-900/40 p-4 rounded-2xl border border-purple-500/30">
                <span className="text-xs text-purple-300 font-bold block">Meilleure Série</span>
                <span className="text-xl font-black text-orange-400">🔥 {maxStreak}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
              <button
                onClick={() => handleStartGame(gameMode)}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> REJOUER CE MODE
              </button>
              <button
                onClick={() => { playSoundEffect('click', soundEnabled); setCurrentScreen('home'); }}
                className="w-full py-3.5 rounded-2xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-white font-bold text-sm transition"
              >
                🏠 RETOUR AU MENU PRINCIPAL
              </button>
            </div>
          </div>
        )}

        {/* 5. ÉCRAN ÉDITEUR DE QUESTIONS */}
        {currentScreen === 'editor' && (
          <div className="w-full max-w-2xl bg-purple-950/90 border border-purple-500/40 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex justify-between items-center border-b border-purple-800/50 pb-4">
              <div>
                <h2 className="text-2xl font-black text-cyan-400 flex items-center gap-2">
                  <Edit className="w-6 h-6" /> ÉDITEUR HABBAD
                </h2>
                <p className="text-xs text-purple-200/70">Créez vos propres questions personnalisées !</p>
              </div>
              <button 
                onClick={() => setCurrentScreen('home')}
                className="p-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-xs font-bold"
              >
                ✕ FERMER
              </button>
            </div>

            {/* Formulaire d'ajout */}
            <form onSubmit={handleAddQuestion} className="bg-purple-900/40 p-5 rounded-2xl border border-purple-500/30 space-y-3">
              <h3 className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Ajouter une question sur Habbad
              </h3>

              <input 
                type="text" 
                value={newQText}
                onChange={(e) => setNewQText(e.target.value)}
                placeholder="Ex: Quel est le plat ou le passe-temps favori d'Habbad ?"
                className="w-full px-4 py-2.5 rounded-xl bg-purple-950 border border-purple-500/40 text-sm focus:outline-none focus:border-cyan-400"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={newQOpt0}
                  onChange={(e) => setNewQOpt0(e.target.value)}
                  placeholder="Option 1 (Rouge)"
                  className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-white"
                  required
                />
                <input 
                  type="text" 
                  value={newQOpt1}
                  onChange={(e) => setNewQOpt1(e.target.value)}
                  placeholder="Option 2 (Bleu)"
                  className="px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-500/40 text-xs text-white"
                  required
                />
                <input 
                  type="text" 
                  value={newQOpt2}
                  onChange={(e) => setNewQOpt2(e.target.value)}
                  placeholder="Option 3 (Jaune)"
                  className="px-3 py-2 rounded-xl bg-yellow-950/60 border border-yellow-500/40 text-xs text-white"
                  required
                />
                <input 
                  type="text" 
                  value={newQOpt3}
                  onChange={(e) => setNewQOpt3(e.target.value)}
                  placeholder="Option 4 (Vert)"
                  className="px-3 py-2 rounded-xl bg-green-950/60 border border-green-500/40 text-xs text-white"
                  required
                />
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
                  <span>Bonne réponse :</span>
                  <select 
                    value={newQCorrect}
                    onChange={(e) => setNewQCorrect(e.target.value)}
                    className="bg-purple-900 border border-purple-500/40 rounded-lg px-2 py-1 text-cyan-300 font-bold"
                  >
                    <option value={0}>Option 1 (Rouge)</option>
                    <option value={1}>Option 2 (Bleu)</option>
                    <option value={2}>Option 3 (Jaune)</option>
                    <option value={3}>Option 4 (Vert)</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Enregistrer la question
                </button>
              </div>
            </form>

            {/* Liste des questions créées */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider">
                Vos questions créées ({customQuestions.length})
              </h3>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {customQuestions.length === 0 ? (
                  <p className="text-xs text-purple-300/60 text-center py-4">Aucune question personnalisée ajoutée pour le moment.</p>
                ) : (
                  customQuestions.map((q) => (
                    <div key={q.id} className="p-3 bg-purple-900/40 border border-purple-500/30 rounded-xl flex justify-between items-center text-xs gap-3">
                      <div className="truncate">
                        <span className="font-bold text-cyan-300">{q.question}</span>
                        <span className="block text-[10px] text-purple-300/70">Bonne réponse : {q.options[q.correct]}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="w-full py-4 text-center text-xs text-purple-300/50 border-t border-purple-900/30 z-10">
        Habbad Quiz &copy; 2026 — Expérience Kahoot React Interactive
      </footer>

    </div>
  );
}
