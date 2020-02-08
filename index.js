const { 
    Engine,
    Render,
    Runner,
    Composites,
    Composite,
    Common,
    World,
    Bodies,
    Body,
    Grid,
    MouseConstraint,
    Mouse,
    Events,
    Bounds,
    Vector,
    Query
} = Matter;

// Canvas / MatterJS setup
const width = document.body.offsetWidth;
const height = document.body.offsetHeight;

const engine = Engine.create();
const { world } = engine;
world.gravity.y = 0;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width,
        height,
        hasBounds: true,
        wireframes: false,
        showAngleIndicator: true
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

const Emitter = Particle.emitter;

// Collision Layers
const layerDefault = 0x0001;
const layerUI = 0x0002;
const layerPlayer = 0x0003;
const layerEnemy = 0x0004;

// World creation
let worldWalls = [];
const generateWorld = () => {
    const cellSize = 25;
    const mapWidth = 102;
    const mapHeight = 52;

    // Generate noise
    const map = Array(mapWidth).fill(null).map(() => Array(mapHeight).fill(false));
    for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
            map[x][y] = Math.random() > 0.72 ? 0 : 1;
        }
    }

    // Smooth map
    const smoothingIterations = 5;
    for (let i = 0; i < smoothingIterations; i++) {
        for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < mapHeight; y++) {
                const neighbours = getNeighbourCount(map, x, y);
                if (neighbours > 4) {
                    map[x][y] = 1;
                } else if (neighbours < 4) {
                    map[x][y] = 0;
                }
            }
        }
    }

    // Add border to map
    for (let x = 0; x < mapWidth; x++) {
        map[x][0] = 1;
        map[x][mapHeight - 1] = 1;
    }

    for (let y = 0; y < mapHeight; y++) {
        map[0][y] = 1;
        map[mapWidth - 1][y] = 1;
    }

    // Create triangles to smooth edges
    for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
            if (map[x + 1] !== undefined && x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
                // A corner with the hypotenuse facing diagonally down right
                if (map[x][y] === 1 && map[x + 1][y] === 0 && map[x + 1][y + 1] === 0 && map[x][y + 1] === 0) {
                    map[x][y] = 2;
                }
            }

            if (map[x - 1] !== undefined && x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
                // A corner with the hypotenuse facing diagonally down left
                if (map[x][y] === 1 && map[x - 1][y] === 0 && map[x - 1][y + 1] === 0 && map[x][y + 1] === 0) {
                    map[x][y] = 3;
                }
            }

            if (map[x - 1] !== undefined && x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
                // A corner with the hypotenuse facing diagonally up left
                if (map[x][y] === 1 && map[x - 1][y] === 0 && map[x - 1][y - 1] === 0 && map[x][y - 1] === 0) {
                    map[x][y] = 4;
                }
            }

            if (map[x + 1] !== undefined && x > 0 && x < mapWidth && y > 0 && y < mapHeight) {
                // A corner with the hypotenuse facing diagonally up right
                if (map[x][y] === 1 && map[x + 1][y] === 0 && map[x + 1][y - 1] === 0 && map[x][y - 1] === 0) {
                    map[x][y] = 5;
                }
            }
        }
    }
    
    let cells = []
    for (let x = 0; x < mapWidth; x++) {
        for (let y = 0; y < mapHeight; y++) {
            if (map[x][y] === 1) {
                cells.push(Bodies.rectangle(
                    (cellSize * x) - (cellSize / 2) + cellSize,
                    (cellSize * y) - (cellSize / 2) + cellSize,
                    cellSize,
                    cellSize,
                    {
                        isStatic: true,
                        label: "wall",
                        render: { fillStyle: "black" }
                    }
                ));
            } else if (map[x][y] === 2) {
                cells.push(Bodies.fromVertices(
                    (cellSize * x) - (cellSize / 2) + cellSize - (cellSize * 0.18),
                    (cellSize * y) - (cellSize / 2) + cellSize - (cellSize * 0.18),
                    [
                        { x: 0, y: 0 },
                        { x: cellSize, y: 0 },
                        { x: 0, y: cellSize }
                    ],
                    {
                        isStatic: true,
                        label: "wall",
                        render: { fillStyle: "black" }
                    }
                ));
            } else if (map[x][y] === 3) {
                cells.push(Bodies.fromVertices(
                    (cellSize * x) - (cellSize / 2) + cellSize + (cellSize * 0.18),
                    (cellSize * y) - (cellSize / 2) + cellSize - (cellSize * 0.18),
                    [
                        { x: 0, y: 0 },
                        { x: -cellSize, y: 0 },
                        { x: 0, y: cellSize }
                    ],
                    {
                        isStatic: true,
                        label: "wall",
                        render: { fillStyle: "black" }
                    }
                ));
            } else if (map[x][y] === 4) {
                cells.push(Bodies.fromVertices(
                    (cellSize * x) - (cellSize / 2) + cellSize + (cellSize * 0.18),
                    (cellSize * y) - (cellSize / 2) + cellSize + (cellSize * 0.18),
                    [
                        { x: 0, y: 0 },
                        { x: -cellSize, y: 0 },
                        { x: 0, y: -cellSize }
                    ],
                    {
                        isStatic: true,
                        label: "wall",
                        render: { fillStyle: "black" }
                    }
                ));
            } else if (map[x][y] === 5) {
                cells.push(Bodies.fromVertices(
                    (cellSize * x) - (cellSize / 2) + cellSize - (cellSize * 0.18),
                    (cellSize * y) - (cellSize / 2) + cellSize + (cellSize * 0.18),
                    [
                        { x: 0, y: 0 },
                        { x: cellSize, y: 0 },
                        { x: 0, y: -cellSize }
                    ],
                    {
                        isStatic: true,
                        label: "wall",
                        render: { fillStyle: "black" }
                    }
                ));
            }
        }
    }
    World.add(world, cells);
    worldWalls = cells;
}

generateWorld();

// Player setup
let score = 0;
let playerHealth = 100;
const maxPlayerHealth = 100;
let playerIsAlive = true;
const player = Bodies.circle(
    width / 2,
    height / 2,
    20,
    {
        label: "player",
        frictionAir: 0.05,
        collisionFilter: { category: layerPlayer, group: -1 },
        render: {fillStyle: "#4298f5"}
    }
);
World.add(world, player);

const crosshair = Bodies.circle(0, 0, 10, {isSensor: true, collisionFilter: { catergory: layerPlayer, group: -1 }, render: {sprite: {texture: "./sprites/crosshair.png"}}});
World.add(world, crosshair);

// Enemies
const spawnEnemy = () => {
    while (true) {
        const x = Math.floor(Math.random() * width) - 100;
        const y = Math.floor(Math.random() * height) - 100;
        const enemy = createEnemyBody(x, y);
        if (Query.collides(enemy, worldWalls).length == 0) {
            enemies.push(enemy);
            World.add(world, enemy);
            break;
        }
    }
}

let enemies = [];
for (let i = 0; i < 10; i++) {
    spawnEnemy();
}

setInterval(() => { spawnEnemy() }, 2000);

// Events (Inputs, Collisions, Matter Events)
const healthbar = document.querySelector("#healthbar .remaining-health");
const scoreText = document.querySelector("#score");

document.addEventListener("mousemove", (event) => {
    const mouseCoords = {x: event.pageX, y: event.pageY};
    Body.setAngle(player, -LookAt(player.position, mouseCoords));
    Body.setPosition(crosshair, {x: mouseCoords.x, y: mouseCoords.y});
});

document.addEventListener("click", (event) => {
    if (!playerIsAlive) {
        return;
    }

    const bullet = Bodies.circle(
        player.position.x,
        player.position.y,
        5,
        {
            label: "playerBullet",
            frictionAir: 0,
            collisionFilter: { category: layerPlayer, group: -1 },
            render: { fillStyle: "#fcdb03" },
        }
    );
    World.add(world, bullet);

    const direction = getDirection(player.position, crosshair.position);
    Body.setVelocity(bullet, { x: direction.x * 10, y: direction.y * 10 });
    destroyBody({body: bullet, additionalFunc: () => {
        const explosion = createBulletExplosion(bullet.position.x, bullet.position.y);
        explosion.explode();
        destroyBody({body: explosion, t: 10});
    }, t: 3000});
});

Events.on(engine, "collisionStart", (event) => {
    event.pairs.forEach((collision) => {
        const bulletAndWalls = ["playerBullet", "wall"];
        if (bulletAndWalls.includes(collision.bodyA.label) && bulletAndWalls.includes(collision.bodyB.label)) {
            if (collision.bodyA.label === "bullet") {
                destroyBody({body: collision.bodyA, additionalFunc: () => {
                    const explosion = createBulletExplosion(collision.bodyA.position.x, collision.bodyA.position.y);
                    explosion.explode();
                    destroyBody({body: explosion, t: 10});
                }});
            } else {
                destroyBody({body: collision.bodyB, additionalFunc: () => {
                    const explosion = createBulletExplosion(collision.bodyB.position.x, collision.bodyB.position.y);
                    explosion.explode();
                    destroyBody({body: explosion, t: 10});
                }});
            }
        }

        if ((collision.bodyA.label === "enemy" && collision.bodyB.label === "playerBullet") ||
            (collision.bodyA.label === "playerBullet" && collision.bodyB.label === "enemy")) {
            if (collision.bodyA.label === "enemy") {
                score += 10;
                scoreText.innerHTML = `${score} points`;
                spawnEnemy();
                destroyBody({body: collision.bodyA, additionalFunc: () => {
                    const explosion = createEnemyExplosion(collision.bodyA.position.x, collision.bodyA.position.y);
                    explosion.explode();
                    destroyBody({body: explosion, t: 10});
                }}); // Enemy
                destroyBody({body: collision.bodyB}); // Bullet
            } else {
                score += 10;
                scoreText.innerHTML = `${score} points`;
                spawnEnemy();
                destroyBody({body: collision.bodyB, additionalFunc: () => {
                    const explosion = createEnemyExplosion(collision.bodyB.position.x, collision.bodyB.position.y);
                    explosion.explode();
                    destroyBody({body: explosion, t: 10});
                }}); // Enemy
                destroyBody({body: collision.bodyA}); // Bullet
            }
        }
    });
});

Events.on(engine, "collisionActive", (event) => {
    event.pairs.forEach((collision => {
        if ((collision.bodyA.label === "player" && collision.bodyB.label === "enemy") ||
            (collision.bodyA.label === "enemy" && collision.bodyB.label === "player")) {
            playerHealth -= 0.5;
            healthbar.style.width = `${(playerHealth / maxPlayerHealth) * 100}%`;

            if (playerHealth <= 0 && playerIsAlive) {
                playerIsAlive = false;
                document.querySelector("#gameover").classList.remove("hide");
                const deathExplosion = Emitter.create(player.position.x, player.position.y, {
                    colors: ["#1d85f5", "#2472c7", "#007aff", "#005fc7"],
                    decaySpeed: 0.01,
                    velocity: { x: 10, y: 10 },
                    amount: 300
                });

                deathExplosion.explode();
                destroyBody({body: player});

                document.addEventListener("keydown", (event) => {
                    if (event.key === "r") {
                        location.reload();
                    }
                });
                // Add camera shake
                cameraShake(10, 1000);
            }
        }
    }));
});

Events.on(engine, "afterUpdate", (event) => {
    if (!playerIsAlive) {
        return;
    }
    // Enemy pathfinding
    for (let enemy of enemies) {
        Body.setAngle(enemy, -LookAt(enemy.position, player.position) + (Math.PI));
        const direction = getDirection(enemy.position, player.position);
        Body.setVelocity(enemy, { x: direction.x, y: direction.y });
    }
});

kd.run(function() {
    kd.tick();
});

kd.W.down((event) => {
    const { x, y } = player.velocity;
    Body.setVelocity(player, {x, y: Math.max(-4, Math.min(y - 1, 0))});
});

kd.A.down(() => {
    const { x, y } = player.velocity;
    Body.setVelocity(player, {x: Math.max(-4, Math.min(x - 1, 0)), y});
});

kd.S.down(() => {
    const { x, y } = player.velocity;
    Body.setVelocity(player, {x, y: Math.max(0, Math.min(y + 1, 4))});
});

kd.D.down(() => {
    const { x, y } = player.velocity;
    Body.setVelocity(player, {x: Math.max(0, Math.min(x + 1, 4)), y});
});
