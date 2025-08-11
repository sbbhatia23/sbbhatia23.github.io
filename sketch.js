// fairy_forest_sketch.js
// A single-file p5.js sketch that draws an animated fairy in a forest.
// Drop this entire file into the p5.js web editor (or include it as sketch.js)

// prompts: make a p5js sketch that draws a fairy in a forest, just give me the javascript file

// can you slow down the mushrooms/background?

let stars = [];
let trees = [];
let fairy;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  noStroke();

  // Create starfield
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: random(width),
      y: random(height * 0.5),
      r: random(0.5, 2.2),
      twinkle: random(0.01, 0.08)
    });
  }

  // Create stylized trees
  for (let i = 0; i < 14; i++) {
    const xpos = i / 13 * width;
    trees.push({
      x: xpos + random(-100, 100),
      baseY: height * 0.75 + random(-40, 40),
      trunkW: random(20, 50),
      height: random(220, 420),
      hue: random(90, 140),
      detail: random() > 0.6
    });
  }

  // Fairy initializes in center
  fairy = new Fairy(width * 0.55, height * 0.55, 1.0);
}

function draw() {
  backgroundGradient();
  drawStars();
  drawMist();
  drawTrees();

  // gentle ground
  drawGround();

  // fairy updates and displays
  fairy.update();
  fairy.display();

  // subtle UI hint
  drawHint();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// -----------------------
// Background & Elements
// -----------------------

function backgroundGradient() {
  // vertical gradient sky
  for (let y = 0; y < height; y++) {
    const t = map(y, 0, height, 0, 1);
    const r = lerp(20, 50, t);
    const g = lerp(20, 60, t);
    const b = lerp(40, 80, t);
    stroke(r, g, b);
    line(0, y, width, y);
  }
  noStroke();
}

function drawStars() {
  push();
  for (let s of stars) {
    s.r += sin(frameCount * s.twinkle) * 0.02;
    fill(255, 255, 255, map(s.r, 0.5, 2.2, 80, 255));
    circle(s.x, s.y, s.r);
  }
  pop();
}

function drawMist() {
  // layered mist near the ground
  for (let i = 0; i < 6; i++) {
    const h = height * (0.55 + i * 0.06);
    fill(200, 230, 255, 18 + i * 8);
    ellipse(width * 0.5, h + sin(frameCount * 0.6 + i * 30) * 8, width * (0.9 - i * 0.08), 120 + i * 30);
  }
}

function drawTrees() {
  push();
  translate(0, 0);

  // Draw distant trees first (smaller, faded)
  for (let i = 0; i < trees.length; i++) {
    const t = trees[i];
    const depth = map(i, 0, trees.length - 1, 0.6, 1);
    drawTree(t.x, t.baseY, t.trunkW * depth * 0.9, t.height * depth, t.hue, t.detail, depth);
  }

  pop();
}

function drawTree(x, baseY, trunkW, h, hueVal, detail, depth) {
  push();
  translate(x, baseY);

  // trunk
  fill(60, 30, 20, 220);
  rectMode(CENTER);
  rect(0, h * 0.22, trunkW, h * 0.6, 12);

  // leafy layers - stylized triangular canopies
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const ly = -i * (h / (layers + 1)) - 20;
    const w = map(i, 0, layers - 1, h * 0.9, h * 0.35) * (0.8 + depth * 0.2);
    fill(hueVal - i * 6, 150 - i * 10, 80 - i * 4, 200 - i * 30);
    triangle(-w * 0.5, ly + 40, w * 0.5, ly + 40, 0, ly - (30 - i * 6));
  }

  // subtle leaves dots
  if (detail) {
    for (let i = 0; i < 12; i++) {
      fill(100, 200, 150, 40);
      const lx = random(-h * 0.35, h * 0.35);
      const ly = random(-h * 0.6, -20);
      ellipse(lx, ly, random(8, 18));
    }
  }

  pop();
}

function drawGround() {
  push();
  const groundY = height * 0.82;
  fill(18, 45, 30);
  rect(0, groundY, width, height - groundY + 100);

  // mushrooms and small plants
  for (let i = 0; i < 28; i++) {
    const x = (i / 27) * width + sin((i + frameCount * 0.3) * 0.4) * 12;
    const base = groundY + random(6, 18);
    fill(40, 80, 60, 230);
    ellipse(x, base, random(6, 18), random(4, 10));
    if (random() > 0.87) {
      drawMushroom(x + random(-10, 10), base - 10, 6 + random(2, 12));
    }
  }

  pop();
}

function drawMushroom(x, y, size) {
  push();
  translate(x, y);
  fill(255, 70, 110, 240);
  arc(0, 0, size * 2, size, 180, 360, CHORD);
  fill(255);
  rect(-size * 0.12, -size * 0.05, size * 0.25, size * 0.9, 4);
  pop();
}

function drawHint() {
  push();
  fill(255, 240);
  textSize(12);
  textAlign(RIGHT, BOTTOM);
  text('move mouse to guide the fairy • click to make her sparkle', width - 12, height - 12);
  pop();
}

// -----------------------
// Fairy Class
// -----------------------

class Fairy {
  constructor(x, y, scaleFactor = 1) {
    this.pos = createVector(x, y);
    this.baseY = y;
    this.vel = createVector(0, 0);
    this.size = 54 * scaleFactor;
    this.wingAngle = 0;
    this.color = { r: 240, g: 220, b: 255 };
    this.glow = 0;
    this.sparkTimer = 0;
  }

  update() {
    // gently float
    this.pos.y = this.baseY + sin(frameCount * 1.2) * 8;

    // follow mouse softly
    const target = createVector(constrain(mouseX, 40, width - 40), constrain(mouseY, 40, height - 40));
    const dir = p5.Vector.sub(target, this.pos).mult(0.05);
    this.pos.add(dir);

    // wing flap
    this.wingAngle = sin(frameCount * 8) * 25;

    // glow pulses
    this.glow = 120 + 110 * (0.5 + 0.5 * sin(frameCount * 2));

    // sparkles lifecycle
    if (mouseIsPressed) {
      this.sparkTimer = 30;
    }
    if (this.sparkTimer > 0) this.sparkTimer--;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    // soft halo glow
    for (let i = 12; i > 0; i--) {
      fill(this.color.r, this.color.g, this.color.b, this.glow / (i * 1.2));
      ellipse(0, -6, this.size * (1 + i * 0.35));
    }

    // wings (behind)
    this.drawWing(-1, -8, -1);
    this.drawWing(1, -8, 1);

    // body
    push();
    translate(0, 2);
    this.drawBody();
    pop();

    // wings (front with highlights)
    this.drawWing(-1, -8, -1, true);
    this.drawWing(1, -8, 1, true);

    // face and hair
    this.drawFace();

    // sparkles
    if (this.sparkTimer > 0) this.drawSparkles();

    pop();
  }

  drawWing(side, yOffset, dir = 1, highlight = false) {
    push();
    rotate(side * this.wingAngle * dir);
    translate(side * this.size * 0.24, yOffset);

    const wingW = this.size * 0.9;
    const wingH = this.size * 1.1;

    beginShape();
    if (!highlight) fill(150, 220, 255, 120); else fill(255, 255, 255, 50);
    noStroke();
    vertex(0, 0);
    bezierVertex(wingW * 0.15 * side, -wingH * 0.25, wingW * 0.6 * side, -wingH * 0.6, wingW * 0.4 * side, -wingH * 1.04);
    bezierVertex(wingW * 0.05 * side, -wingH * 0.86, -wingW * 0.5 * side, -wingH * 0.38, 0, 0);
    endShape(CLOSE);

    // subtle veins
    stroke(255, 255, 255, 40);
    strokeWeight(1);
    for (let i = 0; i < 4; i++) {
      noFill();
      beginShape();
      vertex(0, 0);
      const t = map(i, 0, 3, 0.2, 0.8);
      bezierVertex(wingW * 0.12 * side * t, -wingH * 0.18 * t, wingW * 0.45 * side * t, -wingH * 0.45 * t, wingW * 0.35 * side * t, -wingH * 0.8 * t);
      endShape();
    }

    noStroke();
    pop();
  }

  drawBody() {
    // torso
    fill(220, 255, 230);
    ellipse(0, -6, this.size * 0.8, this.size);

    // dress
    push();
    translate(0, this.size * 0.25);
    rotate(sin(frameCount * 1.5) * 2);
    beginShape();
    fill(170, 210, 255, 220);
    vertex(-this.size * 0.55, 0);
    bezierVertex(-this.size * 0.2, this.size * 0.8, this.size * 0.2, this.size * 0.8, this.size * 0.55, 0);
    bezierVertex(this.size * 0.2, this.size * 0.9, -this.size * 0.2, this.size * 0.9, -this.size * 0.55, 0);
    endShape(CLOSE);
    pop();

    // arms
    push();
    stroke(240, 200, 200, 220);
    strokeWeight(4);
    noFill();
    line(-this.size * 0.22, -6, -this.size * 0.5, 6 + sin(frameCount * 2) * 2);
    line(this.size * 0.22, -6, this.size * 0.5, 6 - sin(frameCount * 2) * 2);
    noStroke();
    pop();
  }

  drawFace() {
    // head
    fill(255, 240, 230);
    ellipse(0, -26, this.size * 0.42, this.size * 0.52);

    // hair
    push();
    translate(-6, -34);
    fill(120, 60, 140);
    arc(0, 0, this.size * 0.55, this.size * 0.65, 180, 360, CHORD);
    pop();

    // eyes
    fill(20, 30, 40);
    ellipse(-6, -28, 4, 4);
    ellipse(6, -28, 4, 4);

    // smile
    noFill();
    stroke(20, 30, 40);
    strokeWeight(1.2);
    arc(0, -22, 10, 6, 200, 340);
    noStroke();
  }

  drawSparkles() {
    for (let i = 0; i < 12; i++) {
      const ang = random(360);
      const rad = random(6, this.size * 0.9);
      const x = cos(ang) * rad * 0.6;
      const y = sin(ang) * rad * 0.4 - 10;
      const s = random(2, 8);
      fill(255, 250, random(200, 255), 220 * (this.sparkTimer / 30));
      ellipse(x, y, s);

      // little star spikes
      push();
      translate(x, y);
      stroke(255, 250, 180, 200 * (this.sparkTimer / 30));
      strokeWeight(1);
      line(-s * 0.6, 0, s * 0.6, 0);
      line(0, -s * 0.6, 0, s * 0.6);
      noStroke();
      pop();
    }
  }
}

// -----------------------
// Utility: colorMode and defaults
// -----------------------
colorMode(RGB, 255);

// make sure p5 doesn't error if loaded in strict mode environment
try { window.p5 && window.p5.prototype && (window.p5.prototype._setup = window.p5.prototype.setup); } catch (e) {}

// End of file
