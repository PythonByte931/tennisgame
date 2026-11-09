(() => {
    "use strict";

    const canvas = document.getElementById("court");
    const context = canvas.getContext("2d");
    const playerScoreElement = document.getElementById("player-score");
    const opponentScoreElement = document.getElementById("opponent-score");
    const statusElement = document.getElementById("game-status");
    const startButton = document.getElementById("start-button");

    const width = canvas.width;
    const height = canvas.height;
    const court = { left: 76, right: width - 76, top: 36, bottom: height - 36 };
    const paddleWidth = 112;
    const paddleHeight = 15;
    const ballRadius = 9;
    const playerY = court.bottom - 42;
    const opponentY = court.top + 42;
    const winningScore = 5;

    const keys = new Set();
    const player = { x: width / 2 };
    const opponent = { x: width / 2 };
    const ball = { x: width / 2, y: playerY - 30, vx: 0, vy: 0 };
    let playerScore = 0;
    let opponentScore = 0;
    let playing = false;
    let finished = false;
    let previousTime = 0;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function setStatus(message) {
        statusElement.textContent = message;
    }

    function updateScore() {
        playerScoreElement.textContent = String(playerScore);
        opponentScoreElement.textContent = String(opponentScore);
    }

    function startPoint() {
        if (finished) {
            playerScore = 0;
            opponentScore = 0;
            updateScore();
            finished = false;
        }

        playing = true;
        ball.x = player.x;
        ball.y = playerY - 25;
        ball.vx = (Math.random() - 0.5) * 4;
        ball.vy = -5;
        startButton.hidden = true;
        setStatus("Rally on! Move your racket to return the ball.");
        canvas.focus();
    }

    function pointForPlayer() {
        playerScore += 1;
        updateScore();
        finishPoint("Point for you!");
    }

    function pointForOpponent() {
        opponentScore += 1;
        updateScore();
        finishPoint("Point for the computer.");
    }

    function finishPoint(message) {
        playing = false;
        const winner = playerScore >= winningScore || opponentScore >= winningScore;

        if (winner) {
            finished = true;
            setStatus(playerScore > opponentScore ? "You win the match!" : "The computer wins this time.");
            startButton.textContent = "Play again";
        } else {
            setStatus(`${message} Get ready for the next serve.`);
            startButton.textContent = "Next point";
        }

        startButton.hidden = false;
    }

    function movePlayerWithPointer(event) {
        const bounds = canvas.getBoundingClientRect();
        const scaleX = width / bounds.width;
        const pointerX = (event.clientX - bounds.left) * scaleX;
        player.x = clamp(pointerX, court.left + paddleWidth / 2, court.right - paddleWidth / 2);
    }

    function update(delta) {
        const step = Math.min(delta / 16.67, 2);

        if (keys.has("ArrowLeft") || keys.has("a")) {
            player.x -= 7 * step;
        }
        if (keys.has("ArrowRight") || keys.has("d")) {
            player.x += 7 * step;
        }
        player.x = clamp(player.x, court.left + paddleWidth / 2, court.right - paddleWidth / 2);

        if (!playing) {
            return;
        }

        const opponentTarget = ball.vy < 0 ? ball.x : width / 2;
        const opponentStep = 3.8 * step;
        opponent.x += clamp(opponentTarget - opponent.x, -opponentStep, opponentStep);
        opponent.x = clamp(opponent.x, court.left + paddleWidth / 2, court.right - paddleWidth / 2);

        const previousY = ball.y;
        ball.x += ball.vx * step;
        ball.y += ball.vy * step;

        if (ball.x - ballRadius < court.left || ball.x + ballRadius > court.right) {
            ball.x = clamp(ball.x, court.left + ballRadius, court.right - ballRadius);
            ball.vx *= -1;
        }

        if (
            ball.vy < 0 &&
            previousY - ballRadius >= opponentY &&
            ball.y - ballRadius <= opponentY &&
            Math.abs(ball.x - opponent.x) <= paddleWidth / 2 + ballRadius
        ) {
            ball.y = opponentY + ballRadius;
            ball.vy = Math.abs(ball.vy) * 1.04;
            ball.vx += (ball.x - opponent.x) / (paddleWidth / 2) * 2.4;
        }

        if (
            ball.vy > 0 &&
            previousY + ballRadius <= playerY &&
            ball.y + ballRadius >= playerY &&
            Math.abs(ball.x - player.x) <= paddleWidth / 2 + ballRadius
        ) {
            ball.y = playerY - ballRadius;
            ball.vy = -Math.abs(ball.vy) * 1.04;
            ball.vx += (ball.x - player.x) / (paddleWidth / 2) * 2.8;
        }

        const speed = Math.hypot(ball.vx, ball.vy);
        const maxSpeed = 9;
        if (speed > maxSpeed) {
            ball.vx = (ball.vx / speed) * maxSpeed;
            ball.vy = (ball.vy / speed) * maxSpeed;
        }

        if (ball.y < court.top - ballRadius) {
            pointForPlayer();
        } else if (ball.y > court.bottom + ballRadius) {
            pointForOpponent();
        }
    }

    function drawCourt() {
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#24644d";
        context.fillRect(0, 0, width, height);

        context.fillStyle = "rgba(12, 45, 37, 0.2)";
        context.fillRect(court.left, court.top, court.right - court.left, court.bottom - court.top);

        context.strokeStyle = "rgba(244, 249, 235, 0.85)";
        context.lineWidth = 3;
        context.strokeRect(court.left, court.top, court.right - court.left, court.bottom - court.top);
        context.beginPath();
        context.moveTo(court.left, height / 2);
        context.lineTo(court.right, height / 2);
        context.moveTo(width / 2, court.top);
        context.lineTo(width / 2, court.bottom);
        context.moveTo(court.left + 130, court.top);
        context.lineTo(court.left + 130, court.bottom);
        context.moveTo(court.right - 130, court.top);
        context.lineTo(court.right - 130, court.bottom);
        context.stroke();

        context.fillStyle = "#e7eee0";
        context.fillRect(court.left, height / 2 - 4, court.right - court.left, 8);
        context.fillStyle = "#a9b5a8";
        for (let x = court.left; x < court.right; x += 16) {
            context.fillRect(x, height / 2 - 2, 8, 4);
        }

        drawPaddle(opponent.x, opponentY, "#f1f3eb");
        drawPaddle(player.x, playerY, "#d3f36b");

        context.beginPath();
        context.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
        context.fillStyle = "#d3f36b";
        context.fill();
        context.strokeStyle = "rgba(26, 51, 35, 0.45)";
        context.lineWidth = 2;
        context.stroke();
    }

    function drawPaddle(x, y, color) {
        context.beginPath();
        context.roundRect(x - paddleWidth / 2, y - paddleHeight / 2, paddleWidth, paddleHeight, 7);
        context.fillStyle = color;
        context.fill();
        context.strokeStyle = "rgba(20, 38, 29, 0.35)";
        context.lineWidth = 2;
        context.stroke();
    }

    function frame(time) {
        const delta = previousTime === 0 ? 16.67 : time - previousTime;
        previousTime = time;
        update(delta);
        drawCourt();
        window.requestAnimationFrame(frame);
    }

    canvas.addEventListener("pointerdown", (event) => {
        canvas.setPointerCapture(event.pointerId);
        movePlayerWithPointer(event);
    });
    canvas.addEventListener("pointermove", movePlayerWithPointer);

    window.addEventListener("keydown", (event) => {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        if (["ArrowLeft", "ArrowRight", " "].includes(key)) {
            event.preventDefault();
        }
        keys.add(key);
        if (key === " " && !playing) {
            startPoint();
        }
    });
    window.addEventListener("keyup", (event) => {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        keys.delete(key);
    });
    window.addEventListener("blur", () => keys.clear());
    startButton.addEventListener("click", startPoint);

    drawCourt();
    window.requestAnimationFrame(frame);
})();
