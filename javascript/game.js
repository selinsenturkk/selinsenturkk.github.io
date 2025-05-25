const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//dinazor karakteri görseli
const dinoSprite = new Image();
dinoSprite.src = "images/DinoSprites - doux.png"; 
let dinoFrame = 0;
const totalFrames = 24;
const frameWidth = 24;
const frameHeight = 48;
let frameTimer = 0;
const frameDelay = 100;

//uçan engel görseli
const flyingEnemyImage = new Image();
flyingEnemyImage.src = "images/flying_enemy.png";
const flyingEnemyFrameWidth = 64;   // Her bir kare genişliği
const flyingEnemyFrameHeight = 64;  // Her bir kare yüksekliği
const flyingEnemyFrameCount = 4;    // 4 kare var
let flyingEnemyFrame = 0;           // Animasyon için kare sayacı

//gölge engeli görseli
const shadowEnemyImage = new Image();
shadowEnemyImage.src = "images/Bubble Pine Tree - NIGHT - Spritesheet.png";
const shadowEnemyFrameWidth = 51;
const shadowEnemyFrameHeight = 91;
const shadowEnemyFrameCount = 30;

//zemin engeli görseli
const EnemyImage = new Image();
EnemyImage.src = "images/Bubble Pine Tree - GREEN - Spritesheet.png";
const EnemyFrameWidth = 51;
const EnemyFrameHeight = 91;
const EnemyFrameCount = 30;

let gameStarted = false;
let baseObstacleInterval = 100;
let currentObstacleInterval = baseObstacleInterval;

const SHADOW_AREA_HEIGHT = 200;
const gameAreaHeight = canvas.height - SHADOW_AREA_HEIGHT;

//Oyun içi ses tanımlamaları
const jumpSound = new Audio('sound/jump.mp3');
const bonusSound = new Audio('sound/game_bonus.mp3');
const loseSound = new Audio('sound/lose_sound.mp3');
const backgroundSound = new Audio('sound/background_music.mp3');
backgroundSound.loop = true;

const shadowBg = new Image();
shadowBg.src = "images/bg1.gif";
let shadowBgX = 0;
const shadowBgSpeed = 1.5; // ne kadar hızlı kayacağı

const gameBg = new Image();
gameBg.src = "images/deneme2.webp";
let gameBgX = 0;
let gameBgSpeed = 1.5;

const lanes = [
  SHADOW_AREA_HEIGHT + 30,
  SHADOW_AREA_HEIGHT + 110,
  SHADOW_AREA_HEIGHT + 190,
  SHADOW_AREA_HEIGHT + 270,
];
let currentLaneIndex = 1;

const player = {
  x: 100,
  y: lanes[currentLaneIndex],
  width: 40,
  height: 50,
  velocityY: 0,
  gravity: 0.4,
  jumpPower: -13,
  isJumping: false,
  targetY: lanes[currentLaneIndex],
};

let shadowJumpOffset = 0;
let isGameOver = false;
let score = 0;
let gameSpeed = 3.6; //oyun hızı

const obstacles = [];
const flyingObstacles = [];
const shadowObstacles = [];

let obstacleTimer = 0;
const obstacleCycle = ["ground", "ground", "flying", "ground", "ground", "shadow"]; //engellerin geliş sırası
let obstacleCycleIndex = 0;

let highScore = localStorage.getItem("highScore") || 0; //en yüksek skorun tutulması

//klavye etkileşimlerini tanımlama
document.addEventListener("keydown", (e) => {
  if (e.code === "KeyW" && currentLaneIndex > 0) {
    currentLaneIndex--;
    player.targetY = lanes[currentLaneIndex];
  }
  if (e.code === "KeyS" && currentLaneIndex < lanes.length - 1) {
    currentLaneIndex++;
    player.targetY = lanes[currentLaneIndex];
  }

  if (e.code === "Space" && !player.isJumping) {
    player.velocityY = player.jumpPower;
    player.isJumping = true;
    jumpSound.play();
  }

  if (e.code === "KeyR") {
    window.location.reload();
  }
});
//sol clik etkileşimi
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  if (!gameStarted) {
    const buttonX = canvas.width / 2 - 60;
    const buttonY = canvas.height / 2 + 30;
    if (
      mouseX >= buttonX &&
      mouseX <= buttonX + 120 &&
      mouseY >= buttonY &&
      mouseY <= buttonY + 40
    ) {
      gameStarted = true;
      backgroundSound.play();
    }
    return;
  }

  if (isGameOver) {
    const buttonX = canvas.width / 2 ;
    const buttonY = canvas.height / 2 + 30;
    if (
      mouseX >= buttonX &&
      mouseX <= buttonX + 120 &&
      mouseY >= buttonY &&
      mouseY <= buttonY + 40
    ) {
      window.location.reload();
    }
  }
});
//zemin engeli yaratılır
function createObstacle() {
  const laneIndex = Math.floor(Math.random() * lanes.length);
  const obstacle = {
    x: canvas.width,
    y: lanes[laneIndex] + player.height -10,
    width: 51,  // frame genişliğiyle eşleşiyor
    height: 70, // görsel yüksekliğiyle eşleşiyor
    speed: gameSpeed,
    frame: 0,
    frameTimer: 0,
    frameInterval: 100, // animasyon hızı
  };
  obstacles.push(obstacle);
}

//uçan engel yaratılır
function createFlyingObstacle() {
  const size = 64; 
  const obstacle = {
    x: canvas.width,
    y: SHADOW_AREA_HEIGHT / 2 - size / 2,
    width: size,
    height: size,
    speed: gameSpeed,
    frame: 0,
    frameTimer: 0,
    frameInterval: 500, //animasyon hızı
  };
  flyingObstacles.push(obstacle);
}

//gölge engeli oluşturuluyor
function createShadowObstacle() {
  const sizes = [45, 55, 59];
  const size = sizes[Math.floor(Math.random() * sizes.length)];
  const obstacle = {
    x: canvas.width,
    y: SHADOW_AREA_HEIGHT - size,
    width: size,
    height: size,
    speed: gameSpeed,
    frame:0,
    frameTimer:0,
    frameInterval:100
  };
  shadowObstacles.push(obstacle);
}
//oyun arkaplanı çizilir
function drawGameBackground() {
  gameBgX -= gameBgSpeed;

  if (gameBgX <= -600) {
    gameBgX = 0;
  }
  ctx.drawImage(gameBg, 0, 0, 600, 600, gameBgX, SHADOW_AREA_HEIGHT, 600, 600);
  ctx.drawImage(gameBg, 0, 0, 600, 600, gameBgX+600, SHADOW_AREA_HEIGHT, 600, 600);
  ctx.drawImage(gameBg, 0, 0, 600, 600, gameBgX+1200, SHADOW_AREA_HEIGHT, 600, 600);
}
//perde kısmındaki arkaplan çizilir
function drawShadowArea() {
  ctx.fillStyle = "#2e2e2e";
  ctx.fillRect(0, 0, canvas.width, SHADOW_AREA_HEIGHT);
  // Arka planı kayan şekilde çiz
  shadowBgX -= shadowBgSpeed;

  //sonsuz döngü efekti uygulama
  if (shadowBgX <= -570) {
    shadowBgX = 0;
  }
  //geçişler daha yumuşak olsun diye ard arda bir kaç tane çizdirildi
  ctx.drawImage(shadowBg, 0, 0, 570, 200, shadowBgX, 0, 570, SHADOW_AREA_HEIGHT);
  ctx.drawImage(shadowBg, 0, 0, 570, 200, shadowBgX + 570, 0, 570, SHADOW_AREA_HEIGHT);
  ctx.drawImage(shadowBg, 0, 0, 570, 200, shadowBgX + 1140, 0, 570, SHADOW_AREA_HEIGHT);
}
//dinazorun gölgesini çizme fonksiyonu
function drawShadow() {
  const minHeight = lanes[0];
  const maxHeight = lanes[lanes.length - 1];
  const laneT = (player.targetY - minHeight) / (maxHeight - minHeight);

  const minSize = frameHeight * 2; // orijinal karakter yüksekliği
  const maxSize = minSize * 2;     // gölge maksimum 2 katına kadar büyüsün
  const shadowSize = minSize + (maxSize - minSize) * laneT;

  const shadowX = player.x;
  const shadowY = SHADOW_AREA_HEIGHT - shadowSize - shadowJumpOffset;

  // Sprite sheet kare bilgileri
  const sx = dinoFrame * frameWidth;
  const sy = 0;
  const characterHeight = frameHeight * (shadowSize / minSize);
  const characterY = shadowY + shadowSize - characterHeight;

  ctx.save();
  ctx.globalAlpha = 0.7; //blurlaştırarak gölge efekti verildi

 //karakterin çizimi
ctx.drawImage(
  dinoSprite,
  sx, sy,
  frameWidth, frameHeight,
  shadowX,
  characterY-10,
  shadowSize,
  characterHeight*2.5
);

  ctx.restore();
}
//dinazor karakterinin çizilimi
function drawPlayer() {
  // Çerçeve koordinatını hesapla
  const sx = dinoFrame * frameWidth;
  const sy = 0;
  // Çizim koordinatları (oyundaki pozisyonu)
  const dx = player.x;
  const dy = player.y;
  const dw = frameWidth * 2;
  const dh = frameHeight * 2;

  ctx.drawImage(
    dinoSprite,
    sx, sy, frameWidth, frameHeight,
    dx, dy, dw, dh
  );

  //Kare geçişi
  frameTimer += deltaTime;
  if (frameTimer > frameDelay) {
    dinoFrame = (dinoFrame + 1) % totalFrames;
    frameTimer = 0;
  }
}
//gölge kontrolü fonksiyonu
function checkShadowCollision(obstacle) {
  const minHeight = lanes[0];
  const maxHeight = lanes[lanes.length - 1];
  const laneT = (player.targetY - minHeight) / (maxHeight - minHeight);

  const minSize = player.height;
  const maxSize = player.height * 2;
  const shadowSize = minSize + (maxSize - minSize) * laneT;

  const shadowX = player.x + 10; 
  const shadowY = SHADOW_AREA_HEIGHT - shadowSize - shadowJumpOffset + 10; 
  const hitboxWidth = shadowSize - 20;  // Sağdan ve soldan kırp
  const hitboxHeight = shadowSize - 20; // Üstten ve alttan kırp

  return (
    shadowX < obstacle.x + obstacle.width &&
    shadowX + hitboxWidth > obstacle.x &&
    shadowY < obstacle.y + obstacle.height &&
    shadowY + hitboxHeight > obstacle.y
  );
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //giriş ekranı
  if (!gameStarted) {
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Gecko Runner", canvas.width / 2, canvas.height / 2 - 100);
  ctx.font = "20px Arial";
  ctx.fillText("W / S: Yukarı - Aşağı", canvas.width / 2, canvas.height / 2 - 50);
  ctx.fillText("Space: Zıpla", canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillStyle = "#28a745";
  ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 30, 120, 40);
  ctx.fillStyle = "white";
  ctx.fillText("Başla", canvas.width / 2, canvas.height / 2 + 58);
  ctx.fillText("En Yüksek Skor: " + highScore, canvas.width / 2, canvas.height / 2 + 20);
  //arkaplan müziği döngüsü
  if (!backgroundSound.played.length) {
  backgroundSound.play();
  }

  requestAnimationFrame(gameLoop);
  return;
}

  // Gravity
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  if (player.isJumping) {
    shadowJumpOffset = Math.max(0, player.targetY - player.y);
  } else {
    shadowJumpOffset = 0;
  }

  if (player.y >= player.targetY) {
    player.y = player.targetY;
    player.velocityY = 0;
    player.isJumping = false;
  }

  if (!player.isJumping && player.y !== player.targetY) {
    const dy = player.targetY - player.y;
    player.y += dy * 0.2;
  }

  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGameBackground();
  drawShadowArea();
  drawShadow();
  drawPlayer();

  // Engel üretimi (döngüsel)
  obstacleTimer++;
  if (obstacleTimer > currentObstacleInterval) {
    const type = obstacleCycle[obstacleCycleIndex];
    if (type === "ground") createObstacle();
    else if (type === "flying") createFlyingObstacle();
    else if (type === "shadow") createShadowObstacle();
    obstacleCycleIndex = (obstacleCycleIndex + 1) % obstacleCycle.length;
    obstacleTimer = 0;

    // Engel aralığını düşürerek oyunu zorlaştırır
    if (currentObstacleInterval > 70) {
      currentObstacleInterval -= 3;
    }
  }

  // Skor ve hız
  score++;
  if (score % 500 === 0) gameSpeed += 0.2;
  if (score % 1000 === 0) {
  bonusSound.play();
  }

  // Yerdeki engeller
  for (let i = 0; i < obstacles.length; i++) {
  const obs = obstacles[i];
  obs.x -= obs.speed;

  // Animasyon
  obs.frameTimer += deltaTime;
  if (obs.frameTimer > obs.frameInterval) {
    obs.frame = (obs.frame + 1) % EnemyFrameCount;
    obs.frameTimer = 0;
  }

  const sx = obs.frame * EnemyFrameWidth;
  const sy = 0;

  ctx.drawImage(
    EnemyImage,
    sx, sy, EnemyFrameWidth, EnemyFrameHeight,
    obs.x, obs.y-70, obs.width, obs.height
  );
  // Çarpışma (sadece player ile)
  if (
      player.x < obs.x + obs.width -5 &&
      player.x + player.width -5 > obs.x &&
      player.y < obs.y-70 + obs.height -5 &&
      player.y + player.height - 5 > obs.y-70
    ) {
      isGameOver = true;
    }

  if (obs.x + obs.width < 0) {
      obstacles.splice(i, 1);
      i--;
    }
  }

  // Gölge engelleri
  for (let i = 0; i < shadowObstacles.length; i++) {
  const obs = shadowObstacles[i];
  obs.x -= obs.speed;

  // Animasyon güncelle
  obs.frameTimer += deltaTime;
  if (obs.frameTimer > obs.frameInterval) {
    obs.frame = (obs.frame + 1) % shadowEnemyFrameCount;
    obs.frameTimer = 0;
  }

  const sx = obs.frame * shadowEnemyFrameWidth;
  const sy = 0;

  ctx.drawImage(
    shadowEnemyImage,
    sx, sy,
    shadowEnemyFrameWidth, shadowEnemyFrameHeight,
    obs.x, obs.y,
    obs.width, obs.height
  );

  // Çarpışma
  if (checkShadowCollision(obs)) {
    isGameOver = true;
  }

  // Ekran dışına çıktıysa sil
  if (obs.x + obs.width < 0) {
    shadowObstacles.splice(i, 1);
    i--;
  }
}

  // Uçan engeller
  for (let i = 0; i < flyingObstacles.length; i++) {
   const obs = flyingObstacles[i];
   obs.x -= obs.speed;

   // Animasyon
   obs.frameTimer += deltaTime;
   if (obs.frameTimer > obs.frameInterval) {
    obs.frame = (obs.frame + 1) % flyingEnemyFrameCount;
    obs.frameTimer = 0;
   }

   const sx = obs.frame * flyingEnemyFrameWidth;
   const sy = 0;

   ctx.drawImage(
     flyingEnemyImage,
     sx, sy, flyingEnemyFrameWidth, flyingEnemyFrameHeight,
     obs.x, obs.y, obs.width, obs.height
   );

   if (checkShadowCollision(obs)) {
     isGameOver = true;
   }

   if (obs.x + obs.width < 0) {
     flyingObstacles.splice(i, 1);
     i--;
   }
 }

  // Skor gösterimi
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Skor: " + score, 50, 30);

  // Oyun bitti ekranı
  if (isGameOver) {
    if (score > highScore) {
      localStorage.setItem("highScore", score);
      highScore = score;
    }
    if (!loseSound.played.length) {
    loseSound.play();
    backgroundSound.pause(); // Arka plan müziğini durdur
    }
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = "20px Arial";
    ctx.fillText("Yeniden başlamak için R'ye bas veya butona tıkla", canvas.width / 2, canvas.height / 2 + 15);

    ctx.fillStyle = "#28a745";
    ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 30, 120, 40);
    ctx.fillStyle = "white";
    ctx.fillText("Return", canvas.width / 2, canvas.height / 2 + 58);
    ctx.fillText("Skorun: " + score, canvas.width / 2, canvas.height / 2 - 10);

    return;
  }

  requestAnimationFrame(gameLoop);
}
let lastTime = 0;
let deltaTime = 0;

function gameLoopWrapper(time) {
  deltaTime = time - lastTime;
  lastTime = time;
  gameLoop();
}

requestAnimationFrame(gameLoopWrapper);

shadowBg.onload = () => {
  gameLoop();
}
