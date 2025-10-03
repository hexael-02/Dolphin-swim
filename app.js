// ======================================================================
// 1. CLASE DOLPHIN (Delfín - Animación por Código: Subir/Bajar y Rotar)
// ======================================================================
class Dolphin {
    constructor(game) {
        this.game = game;
        
        // Dimensiones del delfín (ajustadas para tu imagen)
        this.width = 140;
        this.height = 90;

        // Cargar tu imagen original
        this.image = new Image();
        this.image.src = 'delfin100x70.png'; // <--- Usamos TU IMAGEN VISIBLE
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };

        // Posicionamiento de carril
        this.lanePositions = [
            game.canvas.height * 0.25, 
            game.canvas.height * 0.5,  
            game.canvas.height * 0.75  
        ];
        
        this.currentLane = 1; 
        this.x = 50; 
        this.y = this.lanePositions[this.currentLane]; 
        this.maxSpeed = 10; 
        this.isMoving = false;

        // Propiedades para la animación de nado por código
        this.swimTimer = 0;
        this.swimSpeed = 0.01; // Velocidad de nado
        this.swimAmplitude = 5; // Altura de la ola
        this.maxRotation = 5; // Grados máximos de rotación
        this.offsetY = 0;
        this.rotation = 0;
    }

    // Método para cambiar de carril
    changeLane(direction) {
        if (this.isMoving) return;
        const newLane = this.currentLane + direction;
        if (newLane >= 0 && newLane < this.lanePositions.length) {
            this.currentLane = newLane;
            this.isMoving = true;
        }
    }

    // Método update: incluye la animación de nado
    update(deltaTime) {
        // 1. Actualización del movimiento de carril
        if (this.isMoving) {
            const targetY = this.lanePositions[this.currentLane];
            const distance = targetY - this.y;
            if (Math.abs(distance) < this.maxSpeed) {
                this.y = targetY;
                this.isMoving = false;
            } else {
                this.y += Math.sign(distance) * this.maxSpeed;
            }
        }

        // 2. Animación de nado por código (movimiento y rotación)
        this.swimTimer += deltaTime * this.swimSpeed;
        
        // Movimiento vertical sinusoidal (simula la ola)
        this.offsetY = Math.sin(this.swimTimer) * this.swimAmplitude;

        // Rotación leve (simula el movimiento de la cabeza al nadar)
        // Se convierte la amplitud del seno a radianes
        this.rotation = Math.sin(this.swimTimer) * (this.maxRotation * Math.PI / 180);
    }

    // Método para dibujar: aplica las transformaciones
    draw(ctx) {
        if (this.imageLoaded) {
            // Guardar el estado actual del contexto del canvas
            ctx.save();
            
            // 1. Trasladar el punto de origen al centro del delfín (incluyendo el offset de nado)
            ctx.translate(
                this.x + this.width / 2, 
                this.y + this.offsetY
            );
            
            // 2. Aplicar la rotación
            ctx.rotate(this.rotation);
            
            // 3. Dibujar la imagen completa (5 argumentos), centrada en el nuevo origen (0, 0)
            ctx.drawImage(
                this.image, 
                -this.width / 2,    // x: Mover a la izquierda por la mitad del ancho
                -this.height / 2,   // y: Mover hacia arriba por la mitad del alto
                this.width, 
                this.height
            );
            
            // Restaurar el contexto del canvas a su estado anterior
            ctx.restore();
        }
    }
}

// ----------------------------------------------------------------------

// ======================================================================
// 2. CLASE OBSTACLE (Basura/Desechos)
// ======================================================================
class Obstacle {
    constructor(game, lane) {
        this.game = game;
        this.width = Math.random() * 50 + 40; 
        this.height = Math.random() * 50 + 40;
        this.x = game.canvas.width; 
        // Calcular la posición Y del obstáculo en el carril, usando el centro del carril
        this.y = game.dolphin.lanePositions[lane]; 
        this.speed = 5 + Math.random() * 3; 

        const colors = ['#6B8E23', '#8B4513', '#708090', '#556B2F', '#4682B4'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.markedForDeletion = false; 
    }

    update() {
        this.x -= this.speed;
        // Eliminar si está fuera de la pantalla
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
            this.game.score++;
            document.getElementById('score').textContent = this.game.score;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;

        // Dibuja una forma irregular (simulando basura flotante)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2); 
        ctx.lineTo(this.x + this.width, this.y - this.height * 0.1); 
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height / 2); 
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.3); 
        ctx.closePath();
        
        ctx.fill();
        ctx.stroke();

        // Sombra de agua para dar profundidad
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(this.x, this.y - this.height/2, this.width, this.height);
    }
}

// ----------------------------------------------------------------------

// ======================================================================
// 3. CLASE GAME (Motor del juego)
// ======================================================================
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.dolphin = new Dolphin(this);
        this.obstacles = [];
        this.score = 0;
        this.gameOver = false;
        this.lastTime = 0;
        this.obstacleTimer = 0;
        this.obstacleInterval = 1500; 
        
        this.isGameRunning = false;
        this.setupEventListeners();
        this.showStartMessage();
    }

    setupEventListeners() {
        window.addEventListener('keydown', e => {
            if (!this.isGameRunning && (e.key === ' ' || e.key === 'Enter')) {
                this.start();
            } else if (this.isGameRunning) {
                if (e.key === 'ArrowUp' || e.key === 'w') {
                    this.dolphin.changeLane(-1); 
                } else if (e.key === 'ArrowDown' || e.key === 's') {
                    this.dolphin.changeLane(1); 
                }
            }
        });
    }
    
    start() {
        if (this.isGameRunning) return;
        this.isGameRunning = true;
        this.gameOver = false;
        this.score = 0;
        this.obstacles = [];
        this.dolphin = new Dolphin(this);
        this.obstacleInterval = 1500; 
        document.getElementById('score').textContent = this.score;
        document.querySelector('.game-message').style.display = 'none';
        this.gameLoop(0); 
    }

    gameLoop(timeStamp) {
        const deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        this.update(deltaTime);
        this.draw();

        if (!this.gameOver) {
            requestAnimationFrame(this.gameLoop.bind(this));
        } else {
            this.showGameOverMessage();
        }
    }

    update(deltaTime) {
        this.dolphin.update(deltaTime); 

        // 1. Generar nuevos obstáculos
        this.obstacleTimer += deltaTime;
        if (this.obstacleTimer > this.obstacleInterval) {
            const randomLane = Math.floor(Math.random() * 3); 
            this.obstacles.push(new Obstacle(this, randomLane));
            
            // Dificultad incremental
            this.obstacleInterval = Math.max(800, this.obstacleInterval - 5);
            this.obstacleTimer = 0;
        }

        // 2. Actualizar, revisar colisiones y filtrar obstáculos
        this.obstacles.forEach(obstacle => {
            obstacle.update();
            this.checkCollision(obstacle);
        });
        
        this.obstacles = this.obstacles.filter(obstacle => !obstacle.markedForDeletion);
    }

    checkCollision(obstacle) {
        // Colisión entre el área del delfín y el área del obstáculo
        if (
            this.dolphin.x < obstacle.x + obstacle.width &&
            this.dolphin.x + this.dolphin.width > obstacle.x &&
            // Para la colisión, debemos usar la posición base Y (sin el offsetY de nado)
            this.dolphin.y + this.dolphin.height / 2 > obstacle.y - obstacle.height / 2 &&
            this.dolphin.y - this.dolphin.height / 2 < obstacle.y + obstacle.height / 2
        ) {
            this.gameOver = true;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawWaterEffect();
        this.dolphin.draw(this.ctx);
        this.obstacles.forEach(obstacle => {
            obstacle.draw(this.ctx);
        });
    }

    drawWaterEffect() {
        // Fondo azul para el agua
        this.ctx.fillStyle = 'rgba(70, 130, 180, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Líneas de carril
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.dolphin.lanePositions.forEach(y => {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        });
    }
    
    showStartMessage() {
        const messageDiv = document.querySelector('.game-message') || document.createElement('div');
        messageDiv.className = 'game-message';
        messageDiv.innerHTML = `
            <h2>Dolphin swim 🐬</h2>
            <p>Esquiva la basura moviéndote entre los canales de agua .</p>
            <p>Controles: **Flecha Arriba/Abajo** o **W/S**</p>
            <button onclick="game.start()">Presiona ESPACIO o haz clic para Empezar</button>
        `;
        if (!document.querySelector('.game-message')) document.getElementById('game-container').appendChild(messageDiv);
        messageDiv.style.display = 'block';
    }

    showGameOverMessage() {
        const messageDiv = document.querySelector('.game-message');
        messageDiv.innerHTML = `
            <h2>¡GAME OVER!</h2>
            <p>Tu delfín chocó con la basura.</p>
            <p>Puntuación Final: ${this.score}</p>
            <button onclick="game.start()">Volver a Jugar</button>
        `;
        messageDiv.style.display = 'block';
        this.isGameRunning = false;
    }
}

// ----------------------------------------------------------------------

// Inicializar el juego y hacerlo global para que el HTML pueda acceder a 'game.start()'
window.game = new Game('gameCanvas');