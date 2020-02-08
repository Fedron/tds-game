const LookAt = (a, mouse) => {
    if (a.x <= mouse.x && a.y >= mouse.y) {
        return Math.atan((a.y - mouse.y) / (mouse.x - a.x));
    } else if (a.x >= mouse.x && a.y >= mouse.y) {
        return (90 * Math.PI / 180) + Math.atan((a.x - mouse.x) / (a.y - mouse.y));
    } else if (a.x >= mouse.x && a.y <= mouse.y) {
        return Math.PI + Math.atan((mouse.y - a.y) / (a.x - mouse.x));
    } else if (a.x <= mouse.x && a.y <= mouse.y) {
        return (2 * Math.PI) - Math.atan((mouse.y - a.y) / (mouse.x - a.x));
    }

    return 0;
}

const destroyBody = ({body, t=0, additionalFunc=undefined}) => {
    setTimeout(() => {
        if (additionalFunc) { additionalFunc(); }
        World.remove(world, body);
    }, t);
}

const getDirection = (a, b) => {
    const directionVector = {x: b.x - a.x, y: b.y - a.y};
    const magnitude = Math.sqrt(directionVector.x**2 + directionVector.y**2);
    return { x: directionVector.x / magnitude, y: directionVector.y / magnitude }
}

const getNeighbourCount = (map, x, y) => {
    let neighbours = 0;

    for (let nx = x - 1; nx <= x + 1; nx++) {
        for (let ny = y - 1; ny <= y + 1; ny++) {
            if (nx >= 0 && nx < map.length && ny >= 0 && ny < map[0].length) {
                if (nx != x || ny != ny) { neighbours += map[nx][ny]; }
            } else {
                neighbours++;
            }
        }
    }

    return neighbours
}

const createBulletExplosion = (x, y) => {
    return Emitter.create(x, y, {
        colors: ["#fcdb03", "#fae55a", "#ffef85", "#e3ca27"],
        decaySpeed: 0.05,
        velocity: { x: 1, y: 1 },
        amount: 10
    });
}

const createEnemyBody = (x, y) => {
    return Bodies.polygon(
        x,
        y,
        3,
        20,
        { label: "enemy", render: {fillStyle: "#f54242"} }
    );
}

const createEnemyExplosion = (x, y) => {
    return Emitter.create(x, y, {
        colors: ["#f76d6d", "#e37f7f", "#d95757", "#c93030", "#ab3838", "#b82116", "#992e26", "#7d1a13", "#943731"],
        decaySpeed: 0.05,
        velocity: { x: 4, y: 4 },
        amount: 50
    });
}

const cameraShake = (intensity, duration) => {

}

function* cameraShakeHelper() {
    
}
