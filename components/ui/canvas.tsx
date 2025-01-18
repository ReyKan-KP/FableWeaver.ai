interface WaveParams {
  phase: number;
  amplitude: number;
  frequency: number;
  offset: number;
}

interface Config {
  debug: boolean;
  friction: number;
  trails: number;
  size: number;
  dampening: number;
  tension: number;
}

interface Position {
  x: number;
  y: number;
}

class Wave {
  private phase: number;
  private offset: number;
  private frequency: number;
  private amplitude: number;

  constructor(params: Partial<WaveParams> = {}) {
    this.phase = params.phase || 0;
    this.offset = params.offset || 0;
    this.frequency = params.frequency || 0.001;
    this.amplitude = params.amplitude || 1;
  }

  update(): number {
    this.phase += this.frequency;
    return this.offset + Math.sin(this.phase) * this.amplitude;
  }
}

class Node {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
}

interface LineParams {
  spring: number;
}

class Line {
  private spring: number;
  private friction: number;
  private nodes: Node[];

  constructor(params: LineParams) {
    this.spring = params.spring + 0.1 * Math.random() - 0.05;
    this.friction = E.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];

    for (let i = 0; i < E.size; i++) {
      const node = new Node();
      node.x = pos.x;
      node.y = pos.y;
      this.nodes.push(node);
    }
  }

  update(): void {
    let spring = this.spring;
    let node = this.nodes[0];

    node.vx += (pos.x - node.x) * spring;
    node.vy += (pos.y - node.y) * spring;

    for (let i = 0; i < this.nodes.length; i++) {
      node = this.nodes[i];

      if (i > 0) {
        const prev = this.nodes[i - 1];
        node.vx += (prev.x - node.x) * spring;
        node.vy += (prev.y - node.y) * spring;
        node.vx += prev.vx * E.dampening;
        node.vy += prev.vy * E.dampening;
      }

      node.vx *= this.friction;
      node.vy *= this.friction;
      node.x += node.vx;
      node.y += node.vy;
      spring *= E.tension;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    let x = this.nodes[0].x;
    let y = this.nodes[0].y;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let i = 1; i < this.nodes.length - 2; i++) {
      const node = this.nodes[i];
      const next = this.nodes[i + 1];
      x = 0.5 * (node.x + next.x);
      y = 0.5 * (node.y + next.y);
      ctx.quadraticCurveTo(node.x, node.y, x, y);
    }

    const i = this.nodes.length - 2;
    const node = this.nodes[i];
    const next = this.nodes[i + 1];
    ctx.quadraticCurveTo(node.x, node.y, next.x, next.y);
    ctx.stroke();
    ctx.closePath();
  }
}

const E: Config = {
  debug: true,
  friction: 0.5,
  trails: 80,
  size: 50,
  dampening: 0.025,
  tension: 0.99,
};

let ctx: CanvasRenderingContext2D & { running?: boolean; frame?: number };
let wave: Wave;
let pos: Position = { x: 0, y: 0 };
let lines: Line[] = [];

function initLines(): void {
  lines = [];
  for (let i = 0; i < E.trails; i++) {
    lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }));
  }
}

function handleMouseOrTouch(e: MouseEvent | TouchEvent): void {
  if ("touches" in e) {
    pos.x = e.touches[0].pageX;
    pos.y = e.touches[0].pageY;
  } else {
    pos.x = e.clientX;
    pos.y = e.clientY;
  }
  e.preventDefault();
}

function handleTouchStart(e: TouchEvent): void {
  if (e.touches.length === 1) {
    pos.x = e.touches[0].pageX;
    pos.y = e.touches[0].pageY;
  }
}

function onMouseMove(e: MouseEvent | TouchEvent): void {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("touchstart", onMouseMove);
  document.addEventListener("mousemove", handleMouseOrTouch);
  document.addEventListener("touchmove", handleMouseOrTouch);
  document.addEventListener("touchstart", handleTouchStart);

  handleMouseOrTouch(e);
  initLines();
  render();
}

function render(): void {
  if (ctx.running) {
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `hsla(${Math.round(wave.update())},100%,50%,0.025)`;
    ctx.lineWidth = 10;

    for (let i = 0; i < E.trails; i++) {
      const line = lines[i];
      line.update();
      line.draw(ctx);
    }

    ctx.frame = (ctx.frame || 0) + 1;
    window.requestAnimationFrame(render);
  }
}

function resizeCanvas(): void {
  const canvas = ctx.canvas;
  canvas.width = window.innerWidth - 20;
  canvas.height = window.innerHeight;
}

export const renderCanvas = (): void => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d") as CanvasRenderingContext2D & {
    running?: boolean;
    frame?: number;
  };
  ctx.running = true;
  ctx.frame = 1;

  wave = new Wave({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  });

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("touchstart", onMouseMove);
  document.body.addEventListener("orientationchange", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("focus", () => {
    if (!ctx.running) {
      ctx.running = true;
      render();
    }
  });

  window.addEventListener("blur", () => {
    ctx.running = false;
  });

  resizeCanvas();
};
