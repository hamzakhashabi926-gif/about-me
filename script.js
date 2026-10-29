const THREE = window.THREE;

/* =========================================
   1. إعدادات عامة
========================================= */

const $ = (selector) => document.querySelector(selector);

const intro = $("#intro");
const enterButton = $("#enterButton");
const introFlash = $("#introFlash");
const canvas = $("#threeCanvas");

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;


/* =========================================
   2. شاشة الدخول — الدخول بالنقر أو الضغط المستمر
========================================= */

let holdTimer = null;
let entered = false;
let holding = false;

// فحص ما إذا كان الزائر قد دخل مسبقاً في نفس الجلسة أو قادم من صفحة أخرى مع وسم
const urlHash = window.location.hash;
const hasSectionHash = urlHash && urlHash !== "#" && urlHash !== "#home";
const alreadyEntered = sessionStorage.getItem("hb_site_entered") === "true";

function enterSite(instant = false) {
  if (entered) return;

  entered = true;
  holding = false;
  clearTimeout(holdTimer);

  sessionStorage.setItem("hb_site_entered", "true");

  enterButton?.classList.remove("holding");

  if (instant) {
    intro?.remove();
    document.body.classList.remove("locked");
  } else {
    introFlash?.classList.add("flash");

    setTimeout(() => {
      intro?.classList.add("exiting");
      document.body.classList.remove("locked");
    }, 180);

    setTimeout(() => {
      intro?.remove();
    }, 1200);
  }

  window.__hbEnterSite = enterSite;

  // التمرير السلس إلى القسم المطلوب إن وجد وسم في الرابط
  if (hasSectionHash) {
    setTimeout(() => {
      const targetEl = document.querySelector(urlHash);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    }, instant ? 50 : 350);
  }
}

if (hasSectionHash || alreadyEntered) {
  enterSite(true);
} else {
  document.body.classList.add("locked");
}

function resetHold() {
  if (entered) return;

  holding = false;
  clearTimeout(holdTimer);

  enterButton?.classList.remove("holding");
  const label = enterButton?.querySelector(".enter-text");
  if (label) {
    label.textContent = "اضغط باستمرار للدخول";
  }
}

function startHold(event) {
  if (entered || holding) return;
  if (event?.type === "pointerdown" && event.button !== 0) return;

  holding = true;
  enterButton?.classList.add("holding");

  const label = enterButton?.querySelector(".enter-text");
  if (label) label.textContent = "جاري فتح العالم...";

  holdTimer = setTimeout(() => {
    enterSite(false);
  }, 750);
}

// دعم الضغط المستمر
enterButton?.addEventListener("pointerdown", startHold);
enterButton?.addEventListener("pointerup", (e) => {
  if (holding && !entered) {
    // إذا ضغط المستخدم وفلت بسرعة (نقرة عادية)، ندخله مباشرة بدون تعليق
    enterSite(false);
  }
  resetHold();
});
enterButton?.addEventListener("pointerleave", resetHold);
enterButton?.addEventListener("pointercancel", resetHold);

// نقرة الماوس العادية المباشرة
enterButton?.addEventListener("click", (event) => {
  event.preventDefault();
  enterSite(false);
});

/* السماح بالدخول باستخدام لوحة المفاتيح */
enterButton?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    enterSite(false);
  }
});


/* =========================================
   3. القائمة للموبايل
========================================= */

const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");

menuToggle?.addEventListener("click", () => {
  navLinks?.classList.toggle("open");
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks?.classList.remove("open");
  });
});


/* =========================================
   4. إضاءة الماوس
========================================= */

const cursorGlow = $("#cursorGlow");

window.addEventListener("pointermove", (event) => {
  if (!cursorGlow || reduceMotion) return;

  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
}, { passive: true });


/* =========================================
   5. ظهور الأقسام أثناء التمرير
========================================= */

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -35px 0px"
    }
  );

  revealElements.forEach((element) => {
    revealObserver.observe(element);
  });
} else {
  revealElements.forEach((element) => {
    element.classList.add("visible");
  });
}


/* =========================================
   6. Three.js — المجسمات ثلاثية الأبعاد
========================================= */

let scene;
let camera;
let renderer;
let shapes = [];

const pointer = new THREE.Vector2(0, 0);
const targetRotation = new THREE.Vector2(0, 0);

const clock = new THREE.Clock();

function makeMaterial(color, metalness = 0.25, roughness = 0.3) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness
  });
}


/* المثلث المجسم */
function createTriangle(material) {
  const shape = new THREE.Shape();

  shape.moveTo(0, 1.05);
  shape.lineTo(-0.95, -0.7);
  shape.lineTo(0.95, -0.7);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.28,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.07,
    curveSegments: 12
  });

  geometry.center();

  return new THREE.Mesh(geometry, material);
}


/* الإكس المجسم من قطعتين */
function createX(material) {
  const group = new THREE.Group();

  const barGeometry = new THREE.BoxGeometry(0.34, 1.65, 0.3);

  const barOne = new THREE.Mesh(barGeometry, material);
  const barTwo = new THREE.Mesh(barGeometry, material);

  barOne.rotation.z = Math.PI / 4;
  barTwo.rotation.z = -Math.PI / 4;

  group.add(barOne, barTwo);

  return group;
}


/* إنشاء مجسم مع موقعه وحجمه */
function addShape(object, position, scale, speed = 1) {
  object.position.set(...position);
  object.scale.setScalar(scale);

  object.userData.baseY = position[1];
  object.userData.phase = Math.random() * Math.PI * 2;
  object.userData.speed = speed;

  scene.add(object);
  shapes.push(object);

  return object;
}


function initThree() {
  if (!THREE || !canvas) return;

  try {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );

    camera.position.set(0, 0, 10);

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.7)
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;


    /* الإضاءة */

    const ambient = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(4, 6, 7);
    scene.add(keyLight);

    const blueLight = new THREE.PointLight(0x777bea, 35, 20);
    blueLight.position.set(-4, 1, 5);
    scene.add(blueLight);

    const rimLight = new THREE.PointLight(0x9fa7ff, 24, 18);
    rimLight.position.set(4, -3, -3);
    scene.add(rimLight);


    /* مواد الهوية البصرية */

    const blue = makeMaterial(0x434671, 0.55, 0.23);
    const navy = makeMaterial(0x0e1726, 0.7, 0.22);
    const pale = makeMaterial(0xe3e4f3, 0.3, 0.2);
    const accent = makeMaterial(0x9298e0, 0.65, 0.2);


    /* المربع */

    const square = new THREE.Mesh(
      new THREE.BoxGeometry(1.65, 1.65, 0.55),
      blue
    );

    addShape(square, [2.7, 0.5, -0.5], 0.85, 0.7);


    /* الدائرة — حلقة ثلاثية الأبعاد */

    const circle = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.19, 24, 72),
      pale
    );

    addShape(circle, [1.5, -1.45, 0.4], 0.85, 1.1);


    /* الإكس */

    const cross = createX(navy);

    addShape(cross, [3.65, -1.3, 0], 0.75, 0.85);


    /* المثلث */

    const triangle = createTriangle(accent);

    addShape(triangle, [4.1, 1.25, -1.0], 0.8, 0.65);


    /* نسخة إضافية صغيرة من المربع */

    const smallSquare = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.9, 0.3),
      pale
    );

    addShape(smallSquare, [0.1, 1.6, -1.5], 0.7, 1.25);


    /* نسخة إضافية من الدائرة */

    const smallCircle = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.12, 20, 56),
      accent
    );

    addShape(smallCircle, [0.2, -1.6, -0.6], 0.8, 0.9);


    /* النقاط الصغيرة في الخلفية */

    const particleCount = 220;

    const particlePositions = new Float32Array(
      particleCount * 3
    );

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 18;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 2] = -3 - Math.random() * 8;
    }

    const particleGeometry = new THREE.BufferGeometry();

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc9ccef,
      size: 0.025,
      transparent: true,
      opacity: 0.55
    });

    const particles = new THREE.Points(
      particleGeometry,
      particleMaterial
    );

    scene.add(particles);


    /* تحريك الكاميرا والمجسمات */

    window.addEventListener("pointermove", (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });


    /* تشغيل الرسم */

    function animate() {
      requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      targetRotation.x = pointer.y * 0.14;
      targetRotation.y = pointer.x * 0.2;

      shapes.forEach((object) => {
        const phase = object.userData.phase;
        const speed = object.userData.speed;

        object.rotation.x += 0.003 * speed;
        object.rotation.y += 0.005 * speed;

        object.position.y =
          object.userData.baseY +
          Math.sin(elapsed * speed + phase) * 0.18;

        /* تأثير الماوس على اتجاه المجسمات */
        object.rotation.x +=
          (targetRotation.x - object.rotation.x) * 0.008;

        object.rotation.y +=
          (targetRotation.y - object.rotation.y) * 0.008;
      });

      particles.rotation.y = elapsed * 0.012;
      particles.rotation.x = Math.sin(elapsed * 0.15) * 0.025;

      renderer.render(scene, camera);
    }

    animate();


    /* تغيير الحجم */

    window.addEventListener("resize", () => {
      if (!renderer || !camera) return;

      camera.aspect =
        window.innerWidth / window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 1.7)
      );
    });

  } catch (error) {
    console.error("تعذر تشغيل المشهد ثلاثي الأبعاد:", error);
  }
}


/* =========================================
   7. ضبط موضع المجسمات حسب الشاشة
========================================= */

function adaptSceneToScreen() {
  if (!camera) return;

  if (window.innerWidth < 720) {
    camera.position.set(-1.5, 0, 12);

    shapes.forEach((object) => {
      object.position.x *= 0.62;
      object.position.y *= 0.85;
    });
  } else {
    camera.position.set(0, 0, 10);
  }

  camera.lookAt(0, 0, 0);
}


/* =========================================
   8. تشغيل المشهد
========================================= */

initThree();

/* تهيئة موضع المجسمات بعد إنشاء المشهد */
setTimeout(adaptSceneToScreen, 100);