let v = 0;
const urlParams = new URLSearchParams(location.search);

function getParam(paramName, defaultValue) {
    return urlParams.has(paramName) ? parseFloat(urlParams.get(paramName)) : defaultValue
}

const numberOfFields = 10
const numberOfBalls = getParam("balls", 100),
    memoryForBalls = numberOfBalls * numberOfFields * Float32Array.BYTES_PER_ELEMENT,
    minRadius = getParam("min_radius", 2),
    maxRadius = getParam("max_radius", 10),
    toRender = getParam("render", 1),
    plusProbability = getParam("plus_probability", 0.5),
    canvas = document.querySelector("canvas").getContext("2d");
canvas.canvas.width = getParam("width", 500);
canvas.canvas.height = getParam("height", 500);

class Vector2 {
    constructor(x, y) {
        this.x = x
        this.y = y
    };

    add(b) {
        return new Vector2(this.x + b.x, this.y + b.y)
    }

    mul(s) {
        return new Vector2(this.x * s, this.y * s)
    }

    sub(b) {
        return new Vector2(this.x - b.x, this.y - b.y)
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class Ball {

    constructor(radius, charge, position, velocity, mass, acceleration) {
        this.radius = radius
        this.charge = charge
        this.position = position
        this.velocity = velocity
        if (mass < 0) {
            this.mass = Math.pow(this.radius, 2) * Math.PI
        } else {
            this.mass = mass
        }
        this.acceleration = acceleration
    }
}

let ballsArrayInput = Array.apply(null, Array(numberOfBalls)).map(function () {
})
ballsArrayInput[0] = new Ball(
    maxRadius,
    0,
    new Vector2(canvas.canvas.width / 2, canvas.canvas.height / 2),
    new Vector2(0, 0),
    0,
    new Vector2(0, 0)
) // center ball to see the center (do some cool simulations??)

for (let e = 1; e < numberOfBalls; e++) {
    ballsArrayInput[e] = new Ball(
        randFloat(minRadius, maxRadius), // particle radius
        randSign(plusProbability), // randInt(-1, 1) // charge
        new Vector2(randFloat(0, canvas.canvas.width), randFloat(0, canvas.canvas.height)), // paricle pos
        new Vector2(0, 0), // velocity
        -1, // mass
        new Vector2(0, 0) // acceleration
    )
}

let ballsArrayOutput = ballsArrayInput.map((x) => null)

const TIME_STEP = 0.016;
const G = 1;
const K = 10000;
const EPS = 1;
const SPEED_LIMIT = 700;
const WALLS = true;

function sign(x) {
    if (x > 0) {
        return 1;
    } else if (x < 0) {
        return -1;
    }
    return 0;
}


function cropVelocity(v) {
    if (Math.abs(v) > SPEED_LIMIT) {
        v = sign(v) * SPEED_LIMIT;
    }
    return v;
}

function processBall(idx) {
    let x = ballsArrayInput[idx]
    ballsArrayOutput[idx] = new Ball(
        x.radius,
        x.charge,
        x.position,
        x.velocity,
        x.mass,
        x.acceleration
    )
    if (idx === 0) {
        return;
    }
    let src_ball = ballsArrayInput[idx]

    // Ball/Ball collision
    for (var i = 0; i < numberOfBalls; i = i + 1) {
        if (i === idx) {
            continue;
        }
        var other_ball = ballsArrayInput[i];
        let n = src_ball.position.sub(other_ball.position);
        var distance = n.length();


        if (distance < EPS) {
            distance = EPS;
        }

        let src_mass = src_ball.mass;
        let other_mass = other_ball.mass;

        let force = n.mul(((other_mass * G + -src_ball.charge * other_ball.charge * K / src_mass) / Math.pow(distance, 2)));
        ballsArrayOutput[idx].acceleration = ballsArrayOutput[idx].acceleration.sub(force);
    }

    // Apply acceleration
    ballsArrayOutput[idx].velocity = ballsArrayOutput[idx].velocity.add(ballsArrayOutput[idx].acceleration.mul(TIME_STEP));
    ballsArrayOutput[idx].velocity.x = cropVelocity((ballsArrayOutput[idx]).velocity.x);
    ballsArrayOutput[idx].velocity.y = cropVelocity((ballsArrayOutput[idx]).velocity.y);

    // Apply velocity
    ballsArrayOutput[idx].position = ballsArrayOutput[idx].position.add(ballsArrayOutput[idx].velocity.mul(TIME_STEP));
    ballsArrayOutput[idx].acceleration.x = 0;
    ballsArrayOutput[idx].acceleration.y = 0;
    // console.log("\n\n\n")

    // Ball/Wall collision
    if (WALLS) {
        if ((ballsArrayOutput[idx]).position.x - (ballsArrayOutput[idx]).radius < 0.) {
            (ballsArrayOutput[idx]).position.x = (ballsArrayOutput[idx]).radius;
            (ballsArrayOutput[idx]).velocity.x = -(ballsArrayOutput[idx]).velocity.x;
        }
        if ((ballsArrayOutput[idx]).position.y - (ballsArrayOutput[idx]).radius < 0.) {
            (ballsArrayOutput[idx]).position.y = (ballsArrayOutput[idx]).radius;
            (ballsArrayOutput[idx]).velocity.y = -(ballsArrayOutput[idx]).velocity.y;
        }
        if ((ballsArrayOutput[idx]).position.x + (ballsArrayOutput[idx]).radius >= canvas.canvas.width) {
            (ballsArrayOutput[idx]).position.x = canvas.canvas.width - (ballsArrayOutput[idx]).radius;
            (ballsArrayOutput[idx]).velocity.x = -(ballsArrayOutput[idx]).velocity.x;
        }
        if ((ballsArrayOutput[idx]).position.y + (ballsArrayOutput[idx]).radius >= canvas.canvas.height) {
            (ballsArrayOutput[idx]).position.y = canvas.canvas.height - (ballsArrayOutput[idx]).radius;
            (ballsArrayOutput[idx]).velocity.y = -(ballsArrayOutput[idx]).velocity.y;
        }
    }
}



//   --FPS-- //
function fps(){
    const currentTimestamp = performance.now();
    // delta time
    const elapsedMilliseconds = currentTimestamp - lastTimestamp;
    // for delta = 1000ms = 1sec = 1/T = Hz
    if (elapsedMilliseconds >= 1000) {  // Update every second
        const fps = frameCount / (elapsedMilliseconds / 1000); // Calculate FPS
        fpsDisplay.textContent = `FPS: ${fps.toFixed(2)}`;

        // Reset counters for every second.
        lastTimestamp = currentTimestamp;
        frameCount = 0;
    }

    // Increment frame count
    frameCount++;

}

// Everything that is defined within the scope of the FPS function will be defined as only a local variable for
// the function
//for every call to the fps function: 1) carry forward and keep the values: 1) lastTimeStamp, frameCount
let lastTimestamp = 0;
let frameCount = 0;
let fpsDisplay = document.createElement("div");
document.body.appendChild(fpsDisplay);


// --- FPS --- //
while (true) {
    fps()
    for (var idx = 0; idx < numberOfBalls; idx += 1) {
        processBall(idx)
    }
    ballsArrayInput = ballsArrayOutput.map((x) => new Ball(
        x.radius,
        x.charge,
        x.position,
        x.velocity,
        x.mass,
        x.acceleration
    ))
    drawBalls(ballsArrayInput)
    await promiseRequestAnimationFrame()
}

function promiseRequestAnimationFrame() {
    return new Promise(e => requestAnimationFrame(e))
}

function drawBall(ballsArray, index) {
    const radius = ballsArray[index].radius,
        x = ballsArray[index].position.x,
        y = ballsArray[index].position.y,
        charge = ballsArray[index].charge

    // Draw the outer ball
    if (charge === 0) {
        canvas.fillStyle = "#ffffff";
    } else if (charge < 0) {
        canvas.fillStyle = "#bea9de"
    } else {
        canvas.fillStyle = "#131862"
    }

    canvas.beginPath();
    canvas.arc(x, y, radius, 0, 2 * Math.PI, true);
    canvas.closePath();
    canvas.fill();
}

function drawBalls(ballsArray) {
    canvas.save()
    canvas.scale(1, -1)
    canvas.translate(0, -canvas.canvas.height)
    canvas.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height)
    canvas.fillStyle = "red";
    for (let i = 1; i < numberOfBalls; i += 1) {
        drawBall(ballsArray, i)
    }
    canvas.fillStyle = "blue";
    drawBall(ballsArray, 0);
    canvas.restore()
}

function randFloat(a, b) {
    return Math.random() * (b - a) + a
}

function randInt(a, b) {
    return Math.round(randFloat(a, b))
}

function randSign(plusProbability) {
    if (plusProbability < 0) {
        return 0;
    }
    if (Math.random() <= plusProbability) {
        return 1;
    } else {
        return -1;
    }
}