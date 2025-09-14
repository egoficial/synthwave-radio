(() => {
  "use strict";

  const radios = [
    {
      title: "Nightride FM",
      genre: "Synthwave",
      description: "O melhor synthwave 24/7 para você curtir a noite.",
      url: "https://stream.nightride.fm/nightride.mp3",
      icon: "disc",
    },
    {
      title: "Chillsynth FM",
      genre: "Chill Synth",
      description: "Relax synth beats para momentos tranquilos.",
      url: "https://stream.nightride.fm/chillsynth.mp3",
      icon: "cloud-drizzle",
    },
    {
      title: "Datawave FM",
      genre: "Data Synth",
      description: "Sintetizadores futurísticos e sons digitais.",
      url: "https://stream.nightride.fm/datawave.mp3",
      icon: "cpu",
    },
    {
      title: "Spacesynth FM",
      genre: "Space Synth",
      description: "Viagem espacial em forma de som synthwave.",
      url: "https://stream.nightride.fm/spacesynth.mp3",
      icon: "globe",
    },
    {
      title: "Darksynth FM",
      genre: "Dark Synth",
      description: "Synthwave sombrio para almas rebeldes.",
      url: "https://stream.nightride.fm/darksynth.mp3",
      icon: "moon",
    },
    {
      title: "Horrorsynth FM",
      genre: "Horror Synth",
      description: "Synthwave com toque sombrio e aterrorizante.",
      url: "https://stream.nightride.fm/horrorsynth.mp3",
      icon: "zap",
    },
    {
      title: "EBSM FM",
      genre: "EBM",
      description: "Eletrônica industrial com batidas fortes.",
      url: "https://stream.nightride.fm/ebsm.mp3",
      icon: "zap-off",
    },
  ];

  // DOM Elements
  const stationsList = document.getElementById("stationsList");
  const stationName = document.getElementById("stationName");
  const stationGenre = document.getElementById("stationGenre");
  const stationDescription = document.getElementById("stationDescription");
  const stationIcon = document.getElementById("stationIcon");
  const audioPlayer = document.getElementById("audioPlayer");
  const btnPlayPause = document.getElementById("btnPlayPause");
  const volumeControl = document.getElementById("volumeControl");
  const audioCanvas = document.getElementById("audioVisualizer");

  // State
  let currentStationIndex = null;
  let isPlaying = false;

  // Audio Context and Visualizer variables
  let audioCtx;
  let analyser;
  let source;
  let dataArray;
  let bufferLength;
  let animationId;

  /**
   * Initialize Feather icons in document
   */
  function initializeIcons() {
    if ("feather" in window) {
      feather.replace();
    } else {
      console.error("Feather icons not loaded");
    }
  }

  /**
   * Create station list buttons dynamically
   */
  function createStationButtons() {
    radios.forEach((radio, index) => {
      const btn = document.createElement("button");
      btn.className = "station-button";
      btn.type = "button";
      btn.setAttribute("role", "listitem");
      btn.setAttribute("aria-selected", "false");
      btn.setAttribute("aria-label", `${radio.title} - ${radio.genre}`);

      // Icon span
      const iconWrapper = document.createElement("span");
      iconWrapper.className = "station-icon";
      iconWrapper.innerHTML = feather.icons[radio.icon].toSvg();

      const titleSpan = document.createElement("span");
      titleSpan.textContent = radio.title;

      btn.appendChild(iconWrapper);
      btn.appendChild(titleSpan);

      btn.addEventListener("click", () => {
        selectStation(index);
      });

      stationsList.appendChild(btn);
    });
  }

  /**
   * Updates play/pause button icons and aria attributes
   * @param {boolean} playing
   */
  function updatePlayPauseButton(playing) {
    const playIcon = btnPlayPause.querySelector("i[data-feather='play']");
    const pauseIcon = btnPlayPause.querySelector("i[data-feather='pause']");
    if (!playIcon || !pauseIcon) return;

    if (playing) {
      playIcon.style.display = "none";
      pauseIcon.style.display = "inline";
      btnPlayPause.setAttribute("aria-pressed", "true");
    } else {
      playIcon.style.display = "inline";
      pauseIcon.style.display = "none";
      btnPlayPause.setAttribute("aria-pressed", "false");
    }
  }

  /**
   * Select a radio station, load and play it
   * @param {number} index
   */
  function selectStation(index) {
    if (index === currentStationIndex) return;

    const station = radios[index];
    if (!station) return;

    // Update aria-selected on buttons
    Array.from(stationsList.children).forEach((btn, i) => {
      btn.setAttribute("aria-selected", i === index ? "true" : "false");
    });

    // Update UI info
    stationName.textContent = station.title;
    /* stationGenre.textContent = station.genre; */
    stationDescription.textContent = station.description;

    // Update station icon
    stationIcon.innerHTML = "";
    if (feather.icons[station.icon]) {
      stationIcon.innerHTML = feather.icons[station.icon].toSvg();
    }

    // Load and play audio
    try {
      audioPlayer.src = station.url;
      audioPlayer.load();
      audioPlayer.volume = parseFloat(volumeControl.value);
      audioPlayer.play().then(() => {
        isPlaying = true;
        updatePlayPauseButton(true);
        startVisualizer();
      }).catch(err => {
        console.error("Erro ao reproduzir áudio:", err);
        isPlaying = false;
        updatePlayPauseButton(false);
        stopVisualizer();
      });
    } catch (error) {
      console.error("Erro ao carregar estação:", error);
    }

    currentStationIndex = index;
  }

  /**
   * Toggle play/pause state
   */
  function togglePlayPause() {
    if (!audioPlayer.src) return;

    if (audioPlayer.paused) {
      audioPlayer.play().then(() => {
        isPlaying = true;
        updatePlayPauseButton(true);
        startVisualizer();
      }).catch(err => {
        console.error("Erro ao tocar:", err);
      });
    } else {
      audioPlayer.pause();
      isPlaying = false;
      updatePlayPauseButton(false);
      stopVisualizer();
    }
  }

  /**
   * Handle volume changes
   * @param {Event} e
   */
  function handleVolumeChange(e) {
    const vol = parseFloat(e.target.value);
    audioPlayer.volume = vol;
    volumeControl.setAttribute("aria-valuenow", vol.toFixed(2));
  }

  /**
   * Initialize AudioContext and analyser
   */
  function initAudioContext() {
    if (audioCtx) return;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      source = audioCtx.createMediaElementSource(audioPlayer);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 128;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    } catch (error) {
      console.error("Erro ao iniciar AudioContext:", error);
    }
  }

  /**
   * Visualize audio frequency data on canvas
   */
  function drawVisualizer() {
    if (!analyser || !ctx) return;

    const width = audioCanvas.width / window.devicePixelRatio;
    const height = audioCanvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, width, height);

    analyser.getByteFrequencyData(dataArray);

    const barWidth = (width / bufferLength) * 1.5;
    let x = 0;

    ctx.fillStyle = "cornflowerblue";
    ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
    ctx.shadowBlur = 4;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * height * 0.6;
      ctx.fillRect(x, height - barHeight, barWidth * 0.8, barHeight);
      x += barWidth + 1;
    }

    animationId = requestAnimationFrame(drawVisualizer);
  }

  /**
   * Starts the audio visualizer animation
   */
  function startVisualizer() {
    if (!audioCtx) initAudioContext();

    if (!ctx) ctx = audioCanvas.getContext("2d");

    if (!animationId) animationId = requestAnimationFrame(drawVisualizer);
  }

  /**
   * Stops the audio visualizer animation and clears canvas
   */
  function stopVisualizer() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (ctx) {
      const width = audioCanvas.width / window.devicePixelRatio;
      const height = audioCanvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, width, height);
    }
  }

  /**
   * Resize canvas for high DPI screens
   */
  function resizeCanvas() {
    if (!audioCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    audioCanvas.width = audioCanvas.clientWidth * dpr;
    audioCanvas.height = audioCanvas.clientHeight * dpr;

    if (!ctx) ctx = audioCanvas.getContext("2d");

    // Scale context for sharp rendering
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    ctx.scale(dpr, dpr);
  }

  /**
   * Keyboard support: play/pause with space or enter on play button
   * @param {KeyboardEvent} e
   */
  function handleKeyDown(e) {
    if (e.target === btnPlayPause && (e.key === " " || e.key === "Enter")) {
      e.preventDefault();
      togglePlayPause();
    }
  }

  // Initialize variables
  let ctx;

  // Event listeners
/*   btnPlayPause.addEventListener("click", togglePlayPause);
  btnPlayPause.addEventListener("keydown", handleKeyDown); */
  volumeControl.addEventListener("input", handleVolumeChange);

  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  window.addEventListener("load", () => {
    initializeIcons();
    createStationButtons();
    resizeCanvas();
    audioPlayer.volume = parseFloat(volumeControl.value);
  });
})();
