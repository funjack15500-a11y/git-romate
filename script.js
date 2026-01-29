const themeToggle = document.getElementById("themeToggle");
const nowTime = document.getElementById("nowTime");
const gradCountdownLine = document.getElementById("gradCountdownLine");
const particleCanvas = document.getElementById("particleCanvas");
const particleCtx = particleCanvas ? particleCanvas.getContext("2d") : null;
const modeSelect = document.getElementById("modeSelect");
const pauseToggle = document.getElementById("pauseToggle");
const bgAudio = document.getElementById("bgAudio");
const audioToggle = document.getElementById("audioToggle");

const startDate = new Date("2024-01-01T00:00:00");

const updateTime = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  if (nowTime) {
    nowTime.textContent = `${hh}:${mm}`;
  }
};

const getGraduationTarget = (baseDate) => {
  const year = baseDate.getFullYear();
  const targetThisYear = new Date(year, 5, 23, 0, 0, 0);
  if (baseDate > targetThisYear) {
    return new Date(year + 1, 5, 23, 0, 0, 0);
  }
  return targetThisYear;
};

const updateGraduationCountdown = () => {
  if (!gradCountdownLine) {
    return;
  }
  const now = new Date();
  const target = getGraduationTarget(now);
  const diffMs = Math.max(0, target - now);
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);
  if (gradCountdownLine) {
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    gradCountdownLine.textContent = `${daysLeft}天 ${hh}:${mm}:${ss}`;
  }
};

const revealItems = () => {
  const cards = document.querySelectorAll(
    ".about-card, .post-card, .project-card, .note-card, .contact-card"
  );
  const trigger = window.innerHeight * 0.86;
  cards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    if (rect.top < trigger) {
      card.classList.add("visible");
    }
  });
};

const particleState = {
  width: 0,
  height: 0,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  floaters: [],
  sparks: [],
  orbiters: [],
  stars: [],
  horses: [],
  palette: ["#7f7bff", "#24d2ff", "#ff7bdc"],
  mouse: { x: 0, y: 0, vx: 0, vy: 0, active: false },
  mode: "newyear",
  paused: false,
  ripple: { active: false, x: 0, y: 0, radius: 0 },
  tick: 0
};

const syncPalette = () => {
  if (!particleCtx) {
    return;
  }
  if (particleState.mode === "newyear") {
    particleState.palette = ["#ff0000", "#ffaa00", "#ffeb3b", "#d60000"];
    return;
  }
  const styles = getComputedStyle(document.body);
  const colors = [
    styles.getPropertyValue("--accent"),
    styles.getPropertyValue("--accent-2"),
    styles.getPropertyValue("--accent-3")
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  particleState.palette = colors.length ? colors : particleState.palette;
};

const randomPalette = () =>
  particleState.palette[Math.floor(Math.random() * particleState.palette.length)];

const initFloaters = () => {
  if (!particleCtx) {
    return;
  }
  const target = Math.max(
    60,
    Math.min(160, Math.floor((particleState.width * particleState.height) / 18000))
  );
  particleState.floaters = Array.from({ length: target }, () => ({
    x: Math.random() * particleState.width,
    y: Math.random() * particleState.height,
    vx: (Math.random() - 0.5) * 0.4,
    vy: particleState.mode === "newyear" ? 0.2 + Math.random() * 0.5 : (Math.random() - 0.5) * 0.4,
    radius: 1 + Math.random() * 2.4,
    alpha: 0.15 + Math.random() * 0.4,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.004 + Math.random() * 0.01,
    color: randomPalette()
  }));
};

const initStars = () => {
  if (!particleCtx) {
    return;
  }
  const count = Math.max(
    90,
    Math.min(200, Math.floor((particleState.width * particleState.height) / 12000))
  );
  particleState.stars = Array.from({ length: count }, () => ({
    x: Math.random() * particleState.width,
    y: Math.random() * particleState.height,
    size: 0.6 + Math.random() * 1.6,
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.004 + Math.random() * 0.012,
    alpha: 0.2 + Math.random() * 0.6,
    color: randomPalette()
  }));
};

const initOrbiters = () => {
  if (!particleCtx) {
    return;
  }
  const count = Math.max(5, Math.min(10, Math.floor(particleState.width / 220)));
  particleState.orbiters = Array.from({ length: count }, (_, index) => ({
    angle: (Math.PI * 2 * index) / count,
    radius: 50 + Math.random() * 180,
    speed: 0.002 + Math.random() * 0.004,
    size: 1.8 + Math.random() * 2.6,
    alpha: 0.5 + Math.random() * 0.4,
    color: randomPalette()
  }));
};

const resizeParticles = () => {
  if (!particleCtx) {
    return;
  }
  const rect = particleCanvas.getBoundingClientRect();
  particleState.width = rect.width;
  particleState.height = rect.height;
  particleState.dpr = Math.min(window.devicePixelRatio || 1, 2);
  particleCanvas.width = Math.round(rect.width * particleState.dpr);
  particleCanvas.height = Math.round(rect.height * particleState.dpr);
  particleCtx.setTransform(particleState.dpr, 0, 0, particleState.dpr, 0, 0);
  if (!particleState.mouse.x && !particleState.mouse.y) {
    particleState.mouse.x = particleState.width * 0.5;
    particleState.mouse.y = particleState.height * 0.4;
  }
  initFloaters();
  initOrbiters();
  initStars();
};

const spawnSparks = (x, y, energy) => {
  if (!particleCtx) {
    return;
  }
  const count = Math.min(12, 4 + Math.floor(energy / 6));
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 2.2 + energy * 0.02;
    particleState.sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed + particleState.mouse.vx * 0.05,
      vy: Math.sin(angle) * speed + particleState.mouse.vy * 0.05,
      radius: 1 + Math.random() * 2.4,
      life: 40 + Math.floor(Math.random() * 30),
      age: 0,
      color: randomPalette()
    });
  }
};

const handlePointerMove = (event) => {
  if (!particleCtx) {
    return;
  }
  const rect = particleCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  particleState.mouse.vx = x - particleState.mouse.x;
  particleState.mouse.vy = y - particleState.mouse.y;
  particleState.mouse.x = x;
  particleState.mouse.y = y;
  particleState.mouse.active = true;
  spawnSparks(x, y, Math.hypot(particleState.mouse.vx, particleState.mouse.vy));
  if (particleState.mode === "ripple") {
    particleState.ripple.active = true;
    particleState.ripple.x = x;
    particleState.ripple.y = y;
    particleState.ripple.radius = 0;
  }
};

const handleTouchMove = (event) => {
  if (!particleCtx) {
    return;
  }
  if (!event.touches.length) {
    return;
  }
  const touch = event.touches[0];
  handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY });
};

const renderParticles = () => {
  if (!particleCtx) {
    return;
  }
  if (particleState.paused) {
    requestAnimationFrame(renderParticles);
    return;
  }
  const { width, height, floaters, sparks, orbiters, mouse } = particleState;
  particleCtx.clearRect(0, 0, width, height);
  particleCtx.globalCompositeOperation = "lighter";
  particleState.tick++;

  const focusX = mouse.active ? mouse.x : width * 0.5;
  const focusY = mouse.active ? mouse.y : height * 0.4;

  if (particleState.mode === "newyear") {
    // Spawn horses - reduced frequency
    if (particleState.tick % 30 === 0 && particleState.horses.length < 8) {
      const size = 25 + Math.random() * 35;
      particleState.horses.push({
        x: width + 50,
        y: height * 0.1 + Math.random() * height * 0.8,
        vx: -1.5 - Math.random() * 2.5,
        vy: 0,
        size: size,
        oscillation: Math.random() * Math.PI * 2,
        oscSpeed: 0.08 + Math.random() * 0.08,
        color: Math.random() > 0.5 ? "#d60000" : "#ffaa00"
      });
    }

    // Render and update horses
    particleCtx.save();
    for (let i = particleState.horses.length - 1; i >= 0; i--) {
      const horse = particleState.horses[i];
      horse.x += horse.vx;
      horse.oscillation += horse.oscSpeed;
      horse.y += Math.sin(horse.oscillation) * 1.5;
      
      // Add dust effect - reduced frequency
      if (Math.random() > 0.85) {
        spawnSparks(horse.x + horse.size / 2, horse.y + horse.size / 2, 3);
      }

      particleCtx.font = `${horse.size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      particleCtx.textAlign = "center";
      particleCtx.textBaseline = "middle";
      // Slightly rotate to simulate running
      const rotation = Math.sin(horse.oscillation) * 0.08;
      
      particleCtx.save();
      particleCtx.translate(horse.x, horse.y);
      particleCtx.rotate(rotation);
      particleCtx.fillStyle = horse.color;
      particleCtx.fillText("🐎", 0, 0);
      particleCtx.restore();

      if (horse.x < -100) {
        particleState.horses.splice(i, 1);
      }
    }
    particleCtx.restore();

    // Random fireworks - reduced frequency and intensity
    if (particleState.tick % 120 === 0 && Math.random() > 0.6) {
      const fx = Math.random() * width;
      const fy = Math.random() * height * 0.5;
      spawnSparks(fx, fy, 30 + Math.random() * 40);
    }
  }

  if (particleState.mode === "aura") {
    // 流萤特效：快速移动的光点，轨迹明显
    particleState.floaters.forEach((particle) => {
      particle.pulse += particle.pulseSpeed * 2;
      const pulse = Math.sin(particle.pulse) * 0.6 + 0.8;
      const dx = particle.x - focusX;
      const dy = particle.y - focusY;
      const dist = Math.hypot(dx, dy);
      if (mouse.active && dist < 150) {
        const force = (1 - dist / 150) * 1.2;
        particle.vx += (dx / (dist || 1)) * force * 0.2;
        particle.vy += (dy / (dist || 1)) * force * 0.2;
      }
      particle.x += particle.vx * 1.5;
      particle.y += particle.vy * 1.5;
      particle.vx *= 0.95;
      particle.vy *= 0.95;
      
      // 添加轨迹效果
      particleCtx.globalAlpha = particle.alpha * pulse * 0.3;
      particleCtx.fillStyle = particle.color;
      particleCtx.beginPath();
      particleCtx.arc(particle.x - particle.vx * 10, particle.y - particle.vy * 10, particle.radius * 0.8, 0, Math.PI * 2);
      particleCtx.fill();
      
      // 主光点
      particleCtx.globalAlpha = particle.alpha * pulse;
      particleCtx.fillStyle = particle.color;
      particleCtx.beginPath();
      particleCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      particleCtx.fill();
      
      if (particle.x < -40) particle.x = width + 40;
      if (particle.x > width + 40) particle.x = -40;
      if (particle.y < -40) particle.y = height + 40;
      if (particle.y > height + 40) particle.y = -40;
    });
  } else if (particleState.mode === "star") {
    // 星空特效：更多星星，不同大小和闪烁模式
    particleState.stars.forEach((star) => {
      star.twinkle += star.twinkleSpeed * 1.5;
      const twinkle = Math.sin(star.twinkle) * 0.6 + 0.4;
      particleCtx.globalAlpha = star.alpha * twinkle;
      particleCtx.fillStyle = star.color;
      
      // 星星外圈光晕
      particleCtx.beginPath();
      particleCtx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
      particleCtx.fill();
      
      // 星星主体
      particleCtx.globalAlpha = star.alpha * (twinkle + 0.2);
      particleCtx.beginPath();
      particleCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      particleCtx.fill();
      
      // 随机添加流星效果
      if (Math.random() < 0.001) {
        particleState.sparks.push({
          x: Math.random() * width,
          y: 0,
          vx: (Math.random() - 0.5) * 3,
          vy: Math.random() * 2 + 3,
          radius: 2 + Math.random() * 3,
          life: 60 + Math.floor(Math.random() * 40),
          age: 0,
          color: star.color
        });
      }
    });
  } else if (particleState.mode === "ripple") {
    // 涟漪特效：多层涟漪，颜色渐变
    if (particleState.ripple.active) {
      particleState.ripple.radius += 3;
      const rippleAlpha = Math.max(0, 0.8 - particleState.ripple.radius / 200);
      
      // 多层涟漪
      for (let i = 0; i < 3; i++) {
        const layerRadius = particleState.ripple.radius - i * 30;
        if (layerRadius > 0) {
          const layerAlpha = rippleAlpha * (1 - i * 0.3);
          particleCtx.strokeStyle = particleState.palette[i % particleState.palette.length] || "#24d2ff";
          particleCtx.lineWidth = 2 - i * 0.5;
          particleCtx.globalAlpha = layerAlpha;
          particleCtx.beginPath();
          particleCtx.arc(
            particleState.ripple.x,
            particleState.ripple.y,
            layerRadius,
            0,
            Math.PI * 2
          );
          particleCtx.stroke();
        }
      }
      
      if (rippleAlpha <= 0) {
        particleState.ripple.active = false;
      }
    }
    
    // 添加水滴效果
    if (Math.random() < 0.01) {
      particleState.sparks.push({
        x: particleState.mouse.x + (Math.random() - 0.5) * 100,
        y: particleState.mouse.y + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 1 + Math.random() * 2,
        life: 30 + Math.floor(Math.random() * 20),
        age: 0,
        color: particleState.palette[1] || "#24d2ff"
      });
    }
  }

  // 只在非aura模式下执行orbiters和sparks
  if (particleState.mode !== "aura") {
    orbiters.forEach((orbiter, index) => {
      orbiter.angle += orbiter.speed;
      const swing = Math.sin(orbiter.angle * 2.2 + index) * 12;
      const x = focusX + Math.cos(orbiter.angle) * (orbiter.radius + swing);
      const y = focusY + Math.sin(orbiter.angle) * (orbiter.radius * 0.6 + swing);
      particleCtx.globalAlpha = orbiter.alpha;
      particleCtx.fillStyle = orbiter.color;
      particleCtx.beginPath();
      particleCtx.arc(x, y, orbiter.size, 0, Math.PI * 2);
      particleCtx.fill();
    });
  }

  for (let i = sparks.length - 1; i >= 0; i -= 1) {
    const spark = sparks[i];
    spark.age += 1;
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vx *= 0.96;
    spark.vy *= 0.96;
    const lifeRatio = 1 - spark.age / spark.life;
    particleCtx.globalAlpha = Math.max(0, lifeRatio);
    particleCtx.fillStyle = spark.color;
    particleCtx.beginPath();
    particleCtx.arc(spark.x, spark.y, spark.radius * lifeRatio, 0, Math.PI * 2);
    particleCtx.fill();
    if (spark.age >= spark.life) {
      sparks.splice(i, 1);
    }
  }

  orbiters.forEach((orbiter, index) => {
    orbiter.angle += orbiter.speed;
    const swing = Math.sin(orbiter.angle * 2.2 + index) * 12;
    const x = focusX + Math.cos(orbiter.angle) * (orbiter.radius + swing);
    const y = focusY + Math.sin(orbiter.angle) * (orbiter.radius * 0.6 + swing);
    particleCtx.globalAlpha = orbiter.alpha;
    particleCtx.fillStyle = orbiter.color;
    particleCtx.beginPath();
    particleCtx.arc(x, y, orbiter.size, 0, Math.PI * 2);
    particleCtx.fill();
  });

  particleCtx.globalAlpha = 1;
  particleCtx.globalCompositeOperation = "source-over";
  requestAnimationFrame(renderParticles);
};

const applyTheme = (theme) => {
  document.body.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "light" ? "暗色" : "亮色";
  localStorage.setItem("theme", theme);
  syncPalette();
};

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const nextTheme =
    document.body.getAttribute("data-theme") === "light" ? "dark" : "light";
  applyTheme(nextTheme);
});

const updateAudioToggle = () => {
  if (!audioToggle || !bgAudio) {
    return;
  }
  audioToggle.textContent = bgAudio.paused ? "音乐播放" : "音乐暂停";
};

const tryAutoPlay = () => {
  if (!bgAudio) {
    return;
  }
  const attempt = bgAudio.play();
  if (attempt && typeof attempt.then === "function") {
    attempt.then(updateAudioToggle).catch(updateAudioToggle);
  } else {
    updateAudioToggle();
  }
};

if (audioToggle) {
  audioToggle.addEventListener("click", () => {
    if (!bgAudio) {
      return;
    }
    if (bgAudio.paused) {
      bgAudio.play().then(updateAudioToggle);
    } else {
      bgAudio.pause();
      updateAudioToggle();
    }
  });
}

document.addEventListener(
  "click",
  () => {
    if (bgAudio && bgAudio.paused) {
      bgAudio.play().then(updateAudioToggle);
    }
  },
  { once: true }
);

if (modeSelect) {
  modeSelect.addEventListener("change", (event) => {
    particleState.mode = event.target.value;
    syncPalette();
    // Reset particles to apply new behavior immediately if needed
    // For now, just palette sync is enough as behavior is checked in render loop
  });
}

if (pauseToggle) {
  pauseToggle.addEventListener("click", () => {
    particleState.paused = !particleState.paused;
    pauseToggle.textContent = particleState.paused ? "继续" : "暂停";
  });
}

window.addEventListener("scroll", revealItems);
window.addEventListener("load", () => {
  updateTime();
  updateGraduationCountdown();
  revealItems();
  setInterval(updateTime, 1000);
  setInterval(updateGraduationCountdown, 1000);
  if (particleCtx) {
    if (modeSelect) {
      particleState.mode = modeSelect.value;
    }
    syncPalette();
    resizeParticles();
    renderParticles();
  }
  tryAutoPlay();
});

window.addEventListener("resize", resizeParticles);
window.addEventListener("mousemove", handlePointerMove);
window.addEventListener("touchmove", handleTouchMove, { passive: true });
window.addEventListener("mouseleave", () => {
  particleState.mouse.active = false;
});

// 句子轮播功能
const sentenceCarousel = document.getElementById("sentenceCarousel");
const sentenceTrack = sentenceCarousel?.querySelector(".sentence-track");
const sentenceItems = sentenceCarousel?.querySelectorAll(".sentence-item");

if (sentenceCarousel && sentenceTrack && sentenceItems.length > 0) {
  let currentIndex = 0;
  let isAutoPlaying = true;
  const interval = 3000; // 3秒切换一次

  const updateSentence = () => {
    // 重置所有句子状态
    sentenceItems.forEach((item, index) => {
      if (index === currentIndex) {
        item.classList.add("active");
        item.style.display = "block";
      } else {
        item.classList.remove("active");
        item.style.display = "none";
      }
    });
  };

  const nextSentence = () => {
    currentIndex = (currentIndex + 1) % sentenceItems.length;
    updateSentence();
  };

  const prevSentence = () => {
    currentIndex = (currentIndex - 1 + sentenceItems.length) % sentenceItems.length;
    updateSentence();
  };

  // 自动播放
  const startAutoPlay = () => {
    setInterval(() => {
      if (isAutoPlaying) {
        nextSentence();
      }
    }, interval);
  };

  // 鼠标交互
  sentenceCarousel.addEventListener("mouseenter", () => {
    isAutoPlaying = false;
  });

  sentenceCarousel.addEventListener("mouseleave", () => {
    isAutoPlaying = true;
  });

  // 点击切换
  sentenceCarousel.addEventListener("click", (e) => {
    if (e.clientX < sentenceCarousel.offsetWidth / 2) {
      prevSentence();
    } else {
      nextSentence();
    }
  });

  // 初始化
  updateSentence();
  startAutoPlay();

  // 窗口 resize 时重新计算
  window.addEventListener("resize", updateSentence);
}

// 网站上线天数计算
const siteLaunchDate = new Date('2026-01-26'); // 网站上线日期

function updateSiteDays() {
  const now = new Date();
  const diffTime = Math.abs(now - siteLaunchDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const siteDaysCount = document.getElementById('siteDaysCount');
  if (siteDaysCount) {
    siteDaysCount.textContent = diffDays;
  }
}

// 访问次数统计
function updateSiteViews() {
  // 从localStorage获取访问次数
  let views = localStorage.getItem('siteViews');
  if (!views) {
    views = 0;
  }
  
  // 增加访问次数
  views = parseInt(views) + 1;
  
  // 保存到localStorage
  localStorage.setItem('siteViews', views);
  
  // 更新显示
  const siteViewsCount = document.getElementById('siteViewsCount');
  if (siteViewsCount) {
    siteViewsCount.textContent = views;
  }
}

// 初始化统计数据
window.addEventListener("load", function() {
  updateSiteDays();
  updateSiteViews();
});
