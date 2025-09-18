const canvas = document.getElementById('gameCanvas');
const scoreDiv = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

function resizeCanvas() {
  canvas.width = Math.min(420, window.innerWidth - 32);
  canvas.height = Math.min(600, Math.floor(window.innerHeight * 0.6));
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const ctx = canvas.getContext('2d');

const GRAVITY = 0.54;
const FLAP = -8.5;
const BIRD_WIDTH = 34;
const BIRD_HEIGHT = 24;
const PIPE_WIDTH = 52;
const PIPE_GAP = Math.max(canvas.height * 0.24, 120);

let birdY, birdV, pipes, score, gameOver, started;

const images = {};
const assetsToLoad = [
  'background-day.png', 'background-night.png', 'base.png',
  'redbird-downflap.png', 'redbird-midflap.png', 'redbird-upflap.png',
  'pipe-green.png', 'pipe-red.png', 'gameover.png', 'message.png',
  '0.png', '1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png'
];

const audios = {
  die: new Audio('audio/die.wav'),
  hit: new Audio('audio/hit.wav'),
  point: new Audio('audio/point.wav'),
  swoosh: new Audio('audio/swoosh.wav'),
  wing: new Audio('audio/wing.wav')
};

function playAudio(audio) {
  audio.currentTime = 0;
  audio.play();
}

let assetsLoaded = 0;
let birdFrames = [];

function loadAssets() {
  assetsToLoad.forEach(asset => {
    const img = new Image();
    img.src = `sprites/${asset}`;
    img.onload = () => {
      assetsLoaded++;
      if (assetsLoaded === assetsToLoad.length) {
        birdFrames = [
          images['redbird-downflap'],
          images['redbird-midflap'],
          images['redbird-upflap']
        ];
        resetGame();
        loop();
      }
    };
    images[asset.split('.')[0]] = img;
  });
}

let frame = 0;
let birdIndex = 0;

function drawImage(image, x, y, width, height) {
  ctx.drawImage(image, x, y, width, height);
}

function drawBird(x, y) {
  const bird = birdFrames[birdIndex];
  if (bird) {
    drawImage(bird, x - BIRD_WIDTH / 2, y - BIRD_HEIGHT / 2, BIRD_WIDTH, BIRD_HEIGHT);
  }
}

function createPipe() {
  const top = Math.random() * (canvas.height - PIPE_GAP - images['base'].height - 60) + 20;
  return { x: canvas.width, top, bottom: top + PIPE_GAP, passed: false };
}

function resetGame() {
  birdY = canvas.height / 2;
  birdV = 0;
  pipes = [createPipe()];
  score = 0;
  gameOver = false;
  started = false;
  restartBtn.style.display = 'none';
  scoreDiv.textContent = "Score: 0";
}

function drawPipes() {
  const pipeImage = images['pipe-green'];
  if (!pipeImage) return;

  for (let pipe of pipes) {
    const pipeHeightTop = pipe.top;
    const pipeHeightBottom = canvas.height - pipe.bottom;

    ctx.save();
    ctx.translate(pipe.x + PIPE_WIDTH / 2, pipeHeightTop);
    ctx.rotate(Math.PI);
    drawImage(pipeImage, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, pipeImage.height);
    ctx.restore();

    drawImage(pipeImage, pipe.x, pipe.bottom, PIPE_WIDTH, pipeImage.height);
  }
}

function drawGround() {
  const baseImage = images['base'];
  if (!baseImage) return;

  const groundY = canvas.height - baseImage.height;
  const numTiles = Math.ceil(canvas.width / baseImage.width);

  for (let i = 0; i < numTiles; i++) {
    drawImage(baseImage, i * baseImage.width, groundY, baseImage.width, baseImage.height);
  }
}

function update() {
  if (!gameOver && started) {
    birdV += GRAVITY;
    birdY += birdV;

    frame++;
    if (frame % 5 === 0) {
      birdIndex = (birdIndex + 1) % birdFrames.length;
    }

    if (birdY + BIRD_HEIGHT / 2 > canvas.height - images['base'].height) {
      birdY = canvas.height - images['base'].height - BIRD_HEIGHT / 2;
      gameOver = true;
      playAudio(audios.hit);
      setTimeout(() => playAudio(audios.die), 500);
    }

    for (let pipe of pipes) {
      pipe.x -= 3.2;

      if (
        pipe.x < 60 + BIRD_WIDTH / 2 && pipe.x + PIPE_WIDTH > 60 - BIRD_WIDTH / 2 &&
        (birdY - BIRD_HEIGHT / 2 < pipe.top || birdY + BIRD_HEIGHT / 2 > pipe.bottom)
      ) {
        gameOver = true;
        playAudio(audios.hit);
        setTimeout(() => playAudio(audios.die), 500);
      }

      if (!pipe.passed && pipe.x + PIPE_WIDTH < 60 - BIRD_WIDTH / 2) {
        pipe.passed = true;
        score++;
        playAudio(audios.point);
        scoreDiv.textContent = "Score: " + score;
      }
    }

    if (pipes[0].x + PIPE_WIDTH < 0) pipes.shift();

    if (pipes[pipes.length - 1].x < canvas.width - 200) pipes.push(createPipe());
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const backgroundImage = images['background-day'];
  if (backgroundImage) {
    drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  }

  drawPipes();
  drawGround();
  drawBird(60, birdY);

  if (!started) {
    const messageImage = images['message'];
    if (messageImage) {
      drawImage(messageImage, canvas.width / 2 - messageImage.width / 2, canvas.height * 0.3, messageImage.width, messageImage.height);
    }
  }

  if (gameOver) {
    const gameoverImage = images['gameover'];
    if (gameoverImage) {
      drawImage(gameoverImage, canvas.width / 2 - gameoverImage.width / 2, canvas.height * 0.3, gameoverImage.width, gameoverImage.height);
    }
    restartBtn.style.display = 'block';
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function flap() {
  if (!started) {
    started = true;
    playAudio(audios.swoosh);
  }
  if (!gameOver) {
    birdV = FLAP;
    playAudio(audios.wing);
  }
}

canvas.addEventListener('mousedown', e => flap());
canvas.addEventListener('touchstart', e => {
  flap();
  e.preventDefault();
});
document.addEventListener('keydown', e => {
  if (e.code === "Space" || e.code === "ArrowUp") flap();
});

restartBtn.addEventListener('click', () => resetGame());

loadAssets();