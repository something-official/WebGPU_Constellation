const canvas = document.querySelector('#canvas');
const gpuCanvas = document.querySelector('#gpu-canvas');
const context2d = canvas.getContext('2d');
const start = document.querySelector('#start');
const fallback = document.querySelector('#fallback');
const save = document.querySelector('#save');
const metrics = document.querySelector('#metrics');
let animation = 0;
let gpuDevice = null;
let gpuContext = null;

function resize() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  [canvas, gpuCanvas].forEach((element) => {
    element.width = Math.max(1, element.clientWidth * ratio);
    element.height = Math.max(1, element.clientHeight * ratio);
  });
  context2d.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawFallback(time = performance.now()) {
  const width = canvas.clientWidth || 640;
  const height = canvas.clientHeight || 320;
  context2d.fillStyle = '#070d1c';
  context2d.fillRect(0, 0, width, height);
  for (let index = 0; index < 36; index += 1) {
    const x = width * (0.5 + Math.sin(index * 0.71 + time / 1300) * 0.42);
    const y = height * (0.5 + Math.cos(index * 0.43 + time / 1600) * 0.34);
    context2d.fillStyle = `hsl(${185 + index * 4}, 90%, 68%)`;
    context2d.beginPath();
    context2d.arc(x, y, 2 + index % 4, 0, Math.PI * 2);
    context2d.fill();
  }
  context2d.fillStyle = '#fef08a';
  context2d.font = '800 16px system-ui';
  context2d.fillText('CANVAS FALLBACK', 18, 28);
  animation = requestAnimationFrame(drawFallback);
}

async function tryWebGPU() {
  if (!navigator.gpu) {
    metrics.textContent = 'WebGPU is unavailable here. Canvas fallback remains active.';
    return;
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter?.requestDevice();
    if (!device) throw new Error('No WebGPU device was returned');
    const gpuContextCandidate = gpuCanvas.getContext('webgpu');
    if (!gpuContextCandidate) throw new Error('WebGPU canvas context is unavailable');
    const format = navigator.gpu.getPreferredCanvasFormat();
    gpuContextCandidate.configure({ device, format, alphaMode: 'premultiplied' });
    const module = device.createShaderModule({
      code: `@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
        var p = array<vec2f, 3>(vec2f(0.0, 0.7), vec2f(-0.7, -0.7), vec2f(0.7, -0.7));
        return vec4f(p[i], 0.0, 1.0);
      }
      @fragment fn fs() -> @location(0) vec4f { return vec4f(0.56, 0.94, 1.0, 1.0); }`,
    });
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
    cancelAnimationFrame(animation);
    canvas.hidden = true;
    gpuCanvas.hidden = false;
    gpuDevice = device;
    gpuContext = gpuContextCandidate;
    const frame = () => {
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [{
          view: gpuContext.getCurrentTexture().createView(),
          clearValue: { r: 0.03, g: 0.05, b: 0.11, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        }],
      });
      pass.setPipeline(pipeline);
      pass.draw(3);
      pass.end();
      device.queue.submit([encoder.finish()]);
      animation = requestAnimationFrame(frame);
    };
    frame();
    metrics.textContent = 'WebGPU path active. The triangle is rendered by a shader pipeline.';
  } catch (error) {
    metrics.textContent = `WebGPU setup failed safely: ${error.message}. Canvas fallback remains available.`;
    useFallback();
  }
}

function useFallback() {
  cancelAnimationFrame(animation);
  gpuDevice = null;
  gpuContext = null;
  canvas.hidden = false;
  gpuCanvas.hidden = true;
  metrics.textContent = 'Canvas fallback active.';
  drawFallback();
}

start.addEventListener('click', tryWebGPU);
fallback.addEventListener('click', useFallback);
save.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'webgpu-constellation.png';
  link.href = (canvas.hidden ? gpuCanvas : canvas).toDataURL('image/png');
  link.click();
});
window.addEventListener('resize', resize);
window.addEventListener('pagehide', () => {
  cancelAnimationFrame(animation);
  gpuDevice?.destroy?.();
});
resize();
drawFallback();
