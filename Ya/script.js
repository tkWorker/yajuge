const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 500;

// --- 効果音 ---
function playSound(path) {
    const s = new Audio(path);
    s.play();
}

// --- 落下回数 ---
let failCount = 0;
let gameStopped = false;

// --- プレイヤー（青を消して白に変更） ---
const paddle = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 30,
    width: 80,
    height: 15,
    speed: 7,
    color: "#fff"
};

// --- ボール ---
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    size: 10,
    dx: 4,
    dy: -4
};

// --- ブロック ---
const blockRows = 5;
const blockCols = 8;
const blockWidth = 60;
const blockHeight = 20;
let blocks = [];

function createBlocks() {
    blocks = [];
    for (let r = 0; r < blockRows; r++) {
        for (let c = 0; c < blockCols; c++) {
            blocks.push({
                x: 20 + c * (blockWidth + 10),
                y: 20 + r * (blockHeight + 10),
                w: blockWidth,
                h: blockHeight,
                visible: true
            });
        }
    }
}
createBlocks();

// --- Y.png 敵 ---
const enemyImg = new Image();
enemyImg.src = "Y.png";

const enemy = {
    x: 100,
    y: 100,
    size: 40,
    dx: 3,
    dy: 3
};

// --- 障害物（Jama） ---
const jamaImg = new Image();
jamaImg.src = "Jama.png";

const jama = {
    x: 350,
    y: 50,
    size: 50
};

// --- ★ Ket.mp4（動画）2.5倍サイズ ---
const ket = {
    x: 200,
    y: 200,
    w: 250,   // 2.5倍
    h: 175,   // 2.5倍
    dx: 2,
    dy: 2,
    video: document.getElementById("ketVideo")
};

// --- キー操作 ---
let leftPressed = false;
let rightPressed = false;

document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") leftPressed = true;
    if (e.key === "ArrowRight") rightPressed = true;
});
document.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft") leftPressed = false;
    if (e.key === "ArrowRight") rightPressed = false;
});

// --- 描画 ---
function drawPaddle() {
    ctx.fillStyle = paddle.color;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
}

function drawBlocks() {
    blocks.forEach(b => {
        if (b.visible) {
            ctx.fillStyle = "orange";
            ctx.fillRect(b.x, b.y, b.w, b.h);
        }
    });
}

function drawEnemy() {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.size, enemy.size);
}

function drawJama() {
    ctx.drawImage(jamaImg, jama.x, jama.y, jama.size, jama.size);
}

// ★ Ket 動画描画
function drawKet() {
    ctx.drawImage(ket.video, ket.x, ket.y, ket.w, ket.h);
}

// --- 衝突判定 ---
function rectHit(a, b) {
    return (
        a.x < b.x + b.size &&
        a.x + a.size > b.x &&
        a.y < b.y + b.size &&
        a.y + a.size > b.y
    );
}

// パドル衝突
function hitPaddle() {
    return (
        ball.x + ball.size > paddle.x &&
        ball.x - ball.size < paddle.x + paddle.width &&
        ball.y + ball.size > paddle.y &&
        ball.y - ball.size < paddle.y + paddle.height
    );
}

// --- 更新 ---
function update() {

    // 停止中は更新しない
    if (gameStopped) return;

    // プレイヤー移動
    if (leftPressed && paddle.x > 0) paddle.x -= paddle.speed;
    if (rightPressed && paddle.x + paddle.width < canvas.width) paddle.x += paddle.speed;

    // ボール移動
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 壁反射
    if (ball.x - ball.size < 0 || ball.x + ball.size > canvas.width)
        ball.dx *= -1;

    if (ball.y - ball.size < 0)
        ball.dy *= -1;

    // パドル衝突
    if (hitPaddle()) {
        ball.dy = -Math.abs(ball.dy);
        ball.y = paddle.y - ball.size;
        playSound("AA.mp3");
    }

    // --- 落下 ---
    if (ball.y - ball.size > canvas.height) {

        playSound("Fail.mp3");
        failCount++;

        // 10回落ちたら広告
        if (failCount % 10 === 0) {
            gameStopped = true;
            document.getElementById("interstitial").style.display = "block";
            return;
        }

        // 通常リセット
        createBlocks();
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 50;
        ball.dy = -4;
    }

    // ブロック衝突（Ketは貫通）
    blocks.forEach(b => {
        if (b.visible) {
            if (
                ball.x > b.x &&
                ball.x < b.x + b.w &&
                ball.y - ball.size < b.y + b.h &&
                ball.y + ball.size > b.y
            ) {
                ball.dy *= -1;
                b.visible = false;
                playSound("Pinpon.mp3");
            }
        }
    });

    // Y敵
    enemy.x += enemy.dx;
    enemy.y += enemy.dy;

    if (enemy.x < 0 || enemy.x + enemy.size > canvas.width) enemy.dx *= -1;
    if (enemy.y < 0 || enemy.y + enemy.size > canvas.height) enemy.dy *= -1;

    // ボールと敵衝突
    if (rectHit(
        { x: ball.x - ball.size, y: ball.y - ball.size, size: ball.size * 2 },
        enemy
    )) {
        playSound("Pinpon.mp3");
        ball.dy *= -1;
    }

    // Jama
    if (rectHit(
        { x: ball.x - ball.size, y: ball.y - ball.size, size: ball.size * 2 },
        jama
    )) {
        playSound("Pinpon.mp3");
        ball.dy *= -1;
    }

    // --- Ket.mp4 移動（壁反射のみ） ---
    ket.x += ket.dx;
    ket.y += ket.dy;

    if (ket.x < 0 || ket.x + ket.w > canvas.width) ket.dx *= -1;
    if (ket.y < 0 || ket.y + ket.h > canvas.height) ket.dy *= -1;
}

// --- メインループ ---
function loop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameStopped) {
        drawBlocks();
        drawPaddle();
        drawBall();
        drawEnemy();
        drawJama();
        drawKet();
        update();
    }

    requestAnimationFrame(loop);
}
loop();

// --- 再挑戦ボタン ---
document.getElementById("retryBtn").addEventListener("click", () => {
    document.getElementById("interstitial").style.display = "none";
    gameStopped = false;

    // ゲームリセット
    createBlocks();
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dy = -4;
});
