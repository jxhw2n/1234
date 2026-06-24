const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let gameStarted = false;
let gameOver = false;

let stamina = 100;
let staminaCooldown = false;
let sprinting = false;

// ===================== PLAYER =====================
const player = {
    x: 150,
    y: 150,
    size: 50,
    speed: 5
};

// ===================== ONI =====================
const oni = {
    x: 1300,
    y: 900,
    size: 80,
    speed: 4,
    chasing: false
};

// ===================== KEY & EXIT (핵심 수정) =====================
const key = {
    x: 1400,
    y: 150,
    size: 40,
    collected: false
};

const exitDoor = {
    x: 1450,
    y: 950,
    w: 60,
    h: 60
};

// ===================== INPUT =====================
const keys = {};

document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ===================== IMAGES =====================
const playerSprites = {
    up: new Image(),
    down: new Image(),
    left: new Image(),
    right: new Image()
};

playerSprites.up.src = "주인공뒤.png";
playerSprites.down.src = "주인공앞.png";
playerSprites.left.src = "주인공좌.png";
playerSprites.right.src = "주인공우.png";

let currentSprite = playerSprites.down;

const oniImg = new Image();
oniImg.src = "적일신앞.png";

// ===================== SOUND =====================
const deathSound = new Audio("jumpscare.m4a");

// ===================== WALLS =====================
const walls = [
    { x: 50, y: 50, w: 1500, h: 40 },
    { x: 50, y: 50, w: 40, h: 1000 },
    { x: 50, y: 1010, w: 1500, h: 40 },
    { x: 1510, y: 50, w: 40, h: 1000 },

    { x: 300, y: 50, w: 40, h: 80 },
    { x: 300, y: 350, w: 40, h: 700 },

    { x: 750, y: 50, w: 40, h: 150 },
    { x: 750, y: 500, w: 40, h: 550 },

    { x: 1200, y: 50, w: 40, h: 80 },
    { x: 1200, y: 350, w: 40, h: 700 },

    { x: 90, y: 600, w: 250, h: 40 },
    { x: 790, y: 600, w: 410, h: 40 }
];

// ===================== COLLISION =====================
function isColliding(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.size > b.x &&
        a.y < b.y + b.h &&
        a.y + a.size > b.y
    );
}

function move(dx, dy) {
    const future = {
        x: player.x + dx,
        y: player.y + dy,
        size: player.size
    };

    for (let wall of walls) {
        if (isColliding(future, wall)) return;
    }

    player.x += dx;
    player.y += dy;
}

// ===================== RESET =====================
function resetGame() {
    player.x = 150;
    player.y = 150;

    oni.x = 1300;
    oni.y = 900;
    oni.chasing = false;

    key.collected = false;
}

// ===================== JUMPSCARE =====================
function showJumpscare() {
    gameOver = true;

    const img = document.createElement("img");
    img.style.position = "fixed";
    img.style.top = "0";
    img.style.left = "0";
    img.style.width = "100vw";
    img.style.height = "100vh";
    img.style.zIndex = "9999";
    document.body.appendChild(img);

    deathSound.currentTime = 0;
    deathSound.play();

    let toggle = false;

    const interval = setInterval(() => {
        img.src = toggle ? oniImg.src : oniImg.src;
        toggle = !toggle;
    }, 80);

    setTimeout(() => {
        clearInterval(interval);
        img.remove();
        resetGame();
        gameOver = false;
    }, 1500);
}

// ===================== START BUTTON =====================
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", () => {
    gameStarted = true;
    startBtn.style.display = "none";
});

// ===================== UPDATE =====================
function update() {
    if (gameOver) return;

    // stamina
    sprinting =
        keys["shift"] &&
        stamina > 0 &&
        !staminaCooldown;

    if (sprinting) {
        player.speed = 8;
        stamina -= 0.35;

        if (stamina <= 0) {
            stamina = 0;
            staminaCooldown = true;

            setTimeout(() => {
                staminaCooldown = false;
            }, 2000);
        }
    } else {
        player.speed = 4;
        if (!staminaCooldown && stamina < 100) {
            stamina += 0.2;
        }
    }

    stamina = Math.max(0, Math.min(100, stamina));

    // movement
    if (keys["w"] || keys["arrowup"]) {
        move(0, -player.speed);
        currentSprite = playerSprites.up;
    }
    if (keys["s"] || keys["arrowdown"]) {
        move(0, player.speed);
        currentSprite = playerSprites.down;
    }
    if (keys["a"] || keys["arrowleft"]) {
        move(-player.speed, 0);
        currentSprite = playerSprites.left;
    }
    if (keys["d"] || keys["arrowright"]) {
        move(player.speed, 0);
        currentSprite = playerSprites.right;
    }

    // oni AI
    const dx = player.x - oni.x;
    const dy = player.y - oni.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 300) oni.chasing = true;
    else if (dist > 500) oni.chasing = false;

    if (oni.chasing && dist > 0) {
        oni.x += (dx / dist) * oni.speed;
        oni.y += (dy / dist) * oni.speed;
    }

    if (dist < 60) showJumpscare();

    // KEY PICKUP
    if (
        !key.collected &&
        player.x < key.x + key.size &&
        player.x + player.size > key.x &&
        player.y < key.y + key.size &&
        player.y + player.size > key.y
    ) {
        key.collected = true;
    }

    // EXIT
    if (
        key.collected &&
        player.x < exitDoor.x + exitDoor.w &&
        player.x + player.size > exitDoor.x &&
        player.y < exitDoor.y + exitDoor.h &&
        player.y + player.size > exitDoor.y
    ) {
        alert("탈출 성공!");
        resetGame();
    }
}

// ===================== DRAW =====================
function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const camX = player.x - canvas.width / 2;
    const camY = player.y - canvas.height / 2;

    // walls
    ctx.fillStyle = "#444";
    for (let w of walls) {
        ctx.fillRect(w.x - camX, w.y - camY, w.w, w.h);
    }

    // player
    ctx.drawImage(
        currentSprite,
        player.x - camX,
        player.y - camY,
        player.size,
        player.size
    );

    // key
    if (!key.collected) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(key.x - camX, key.y - camY, key.size, key.size);
    }

    // exit
    ctx.fillStyle = key.collected ? "lime" : "red";
    ctx.fillRect(
        exitDoor.x - camX,
        exitDoor.y - camY,
        exitDoor.w,
        exitDoor.h
    );

    // oni
    ctx.drawImage(
        oniImg,
        oni.x - camX,
        oni.y - camY,
        oni.size,
        oni.size
    );

    // stamina bar
    ctx.fillStyle = "black";
    ctx.fillRect(20, 20, 204, 24);

    ctx.fillStyle = "lime";
    ctx.fillRect(22, 22, stamina * 2, 20);

    ctx.strokeStyle = "white";
    ctx.strokeRect(20, 20, 204, 24);
}
function bindButton(id, keyName) {
    const btn = document.getElementById(id);

    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        keys[keyName] = true;
    });

    btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        keys[keyName] = false;
    });

    btn.addEventListener("mousedown", () => {
        keys[keyName] = true;
    });

    btn.addEventListener("mouseup", () => {
        keys[keyName] = false;
    });

    btn.addEventListener("mouseleave", () => {
        keys[keyName] = false;
    });
}

bindButton("up", "arrowup");
bindButton("down", "arrowdown");
bindButton("left", "arrowleft");
bindButton("right", "arrowright");
const runBtn = document.getElementById("runBtn");

runBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    keys["shift"] = true;
});

runBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    keys["shift"] = false;
});

runBtn.addEventListener("mousedown", () => {
    keys["shift"] = true;
});

runBtn.addEventListener("mouseup", () => {
    keys["shift"] = false;
});

runBtn.addEventListener("mouseleave", () => {
    keys["shift"] = false;
});

// ===================== LOOP =====================
function gameLoop() {
    if (gameStarted) {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();