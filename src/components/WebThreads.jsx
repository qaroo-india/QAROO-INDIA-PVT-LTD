import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import './WebThreads.css';

const hexToRgb = hex => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const FAN_MODE = { center: 0, left: 1, right: 2 };

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uThreadCount;
uniform float uFrequency;
uniform float uSpread;
uniform float uTaper;
uniform float uPosition;
uniform float uFanMode;
uniform float uGlow;
uniform float uFalloff;
uniform float uThickness;
uniform float uBrightness;
uniform float uOpacity;
uniform float uMirror;
uniform float uShimmer;
uniform float uGrain;
uniform float uGrainIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uEnableMouse;
uniform float uMouseActive;
uniform float uStroke;
uniform float uStrokeAA;
uniform float uPinch;
uniform float uFreqSpread;
uniform float uDetail;
uniform float uScatter;
uniform float uFade;
uniform float uLengthFade;
out vec4 fragColor;

#define TAU 6.28318530718
#define MAX_THREADS 10

float glow(float x, float str, float dist) {
  return dist / pow(max(x, 1e-4), str);
}

// Cheap per-thread hash. Gives every thread its own phase, frequency, drift
// speed and lifetime, so the fan stops looking like one wave repeated N times.
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

// Emission ramp across a thread's cross-section, driven by local intensity:
// uColor1 in the faint tails, through uColor2, to uColor3 at the hot core.
// This is what makes a line read as light rather than as a coloured stroke.
vec3 emission(float t) {
  vec3 warm = mix(uColor1, uColor2, smoothstep(0.04, 0.5, t));
  return mix(warm, uColor3, smoothstep(0.5, 0.95, t));
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float n = max(uThreadCount, 1.0);

  float pinchX = uFanMode < 0.5 ? 0.5 : (uFanMode < 1.5 ? 0.0 : 1.0);
  // uPinch overrides the fan mode with an exact horizontal convergence point,
  // so the threads can gather on a focal point in the art rather than on an
  // edge or the centre of the canvas.
  if (uPinch >= 0.0) {
    pinchX = uPinch;
  }
  if (uEnableMouse > 0.5) {
    pinchX = mix(pinchX, uMouse.x, clamp(uMouseStrength, 0.0, 1.0) * uMouseActive);
  }

  float spreadDx = uSpread * abs(uv.x - pinchX);
  float baseT = iTime * uSpeed;
  float tauOverN = TAU / n;
  float mirror = uMirror > 0.5 ? sign(pinchX - uv.x) : 1.0;
  bool doShimmer = uShimmer > 0.5;
  float shimmerT = iTime * 1.7;
  float invThickness = 1.0 / max(uThickness, 0.01);
  float xFreq = uv.x * uFrequency;
  float yOff = uv.y - uPosition;
  float ciScale = n > 1.0 ? 1.0 / (n - 1.0) : 0.0;

  // uLengthFade tapers a thread along its own length: full strength where it
  // enters, gone by the far end, so the rays dissolve into the field instead of
  // running edge to edge at constant weight. Depends only on uv.x, so it is
  // computed once per pixel rather than once per thread. The short smoothstep
  // keeps the entry from clipping hard against the canvas edge.
  float lengthTaper = uLengthFade > 0.0
    ? mix(1.0, 1.0 - uv.x, uLengthFade) * smoothstep(0.0, 0.06, uv.x)
    : 1.0;

  vec3 col = vec3(0.0);
  float gsum = 0.0;

  for (int idx = 0; idx < MAX_THREADS; idx++) {
    float i = float(idx);
    if (i >= n) break;

    // Index is scaled before hashing: at small integer inputs this hash
    // correlates badly and neighbouring threads end up sharing a phase and an
    // arrival time, which is exactly what the scatter is meant to avoid.
    float seed = i * 13.17;
    float r1 = hash11(seed + 1.7);
    float r2 = hash11(seed + 9.1);
    float r3 = hash11(seed + 17.3);
    float r4 = hash11(seed + 27.9);

    float amplitude = spreadDx * (1.0 + i * uTaper) * mix(1.0, 0.55 + r3 * 0.9, uScatter);
    float shimmer = doShimmer ? sin(shimmerT + i * 1.3) * 0.35 : 0.0;
    float speedMul = mix(1.0, 0.6 + r4 * 0.8, uScatter);
    float phase = (baseT * speedMul + i * tauOverN + r1 * TAU * uScatter) * mirror + shimmer;

    // Each thread runs at its own frequency so the fan is not a set of
    // parallel clones, and uDetail folds in a shorter secondary wave that gives
    // the line a fibre-like weave instead of a clean sine.
    float threadFreq = xFreq * (1.0 + i * uFreqSpread) * mix(1.0, 0.7 + r2 * 0.65, uScatter);
    float path = sin(threadFreq + phase) * amplitude
      + sin(threadFreq * 3.3 + phase * 1.7) * amplitude * uDetail;

    // Distance from the thread centre, in normalised-y units.
    float d = abs(yOff + path);
    float sdf = d * invThickness;

    float g = glow(sdf, uFalloff, uGlow);

    // uStroke draws an antialiased core of an exact pixel width, so a thread
    // can match a real SVG stroke instead of relying on the glow falloff for
    // its apparent weight. uStrokeAA is one device pixel: a stroke thinner than
    // that is drawn one device pixel wide and dimmed by its coverage instead,
    // which is how a hairline stays crisp and stops shimmering as it moves.
    if (uStroke > 0.0) {
      float hw = max(uStroke, uStrokeAA * 0.5);
      float cover = uStroke / hw;
      g += cover * (1.0 - smoothstep(hw, hw + uStrokeAA, d));
    }

    // Applied before emission() so the fading end cools toward red rather than
    // just dimming.
    g *= lengthTaper;

    // uFade gives each thread its own drift-in / drift-out cycle, at its own
    // length and offset, so threads arrive and leave independently rather than
    // all being permanently lit. The lit span is ~60% of each cycle, which
    // keeps the fan as full as the reference at any given moment while still
    // turning over.
    if (uFade > 0.0) {
      float span = fract(iTime / (uFade * (0.7 + r2 * 0.85)) + r1);
      g *= smoothstep(0.0, 0.08, span) * (1.0 - smoothstep(0.56, 0.74, span));
    }
    // Outer threads run slightly cooler, so the fan has depth without
    // breaking the shared red/yellow/white character.
    float ci = i * ciScale;
    col += g * emission(min(g, 1.0) * (1.0 - ci * 0.25));
    gsum += g;
  }

  // Only where threads actually cross does the light stack to white.
  float coreAmt = smoothstep(1.0, 2.6, gsum);
  col = mix(col, uColor3 * gsum, coreAmt * 0.35);

  float bright = uBrightness;
  if (uEnableMouse > 0.5) {
    vec2 md = uv - uMouse;
    float d2 = dot(md, md);
    bright += clamp(uMouseStrength, 0.0, 1.0) * uMouseActive * exp(-d2 * 6.0) * 0.6;
  }
  col *= bright;

  float alpha = clamp(gsum, 0.0, 1.0) * uOpacity;

  vec3 outRgb = col * alpha;

  if (uGrain > 0.5) {
    float gv = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
    outRgb = clamp(outRgb + gv, 0.0, 1.0);
    alpha = clamp(alpha + gv, 0.0, 1.0);
  }

  fragColor = vec4(outRgb, alpha);
}
`;

const ctxMap = new WeakMap();

/**
 * Converts a stroke width in CSS pixels into the shader's normalised-y units.
 * Threads are measured against the canvas height, so a given width holds at any
 * element size. The second value is one device pixel, which the shader uses as
 * both the antialias band and the floor for sub-pixel strokes.
 *
 * @returns {[number, number]} half-width and one device pixel, normalised
 */
const strokeUniforms = (px, cssHeight, dpr) => {
  const h = Math.max(cssHeight || 0, 1);
  const devicePx = 1 / (h * Math.max(dpr || 1, 1));
  return px > 0 ? [px / 2 / h, devicePx] : [0, 0];
};

const WebThreads = ({
  color1 = '#5227FF',
  color2 = '#FF9FFC',
  color3 = '#FFFFFF',
  speed = 0.2,
  threadCount = 6,
  frequency = 5.0,
  spread = 0.18,
  taper = 1.0,
  position = 0.5,
  fanMode = 'center',
  glow = 0.02,
  falloff = 0.6,
  thickness = 1.1,
  brightness = 0.6,
  opacity = 1.0,
  mirror = true,
  shimmer = false,
  grain = true,
  grainIntensity = 0.05,
  mouseInteraction = true,
  mouseStrength = 0.3,
  strokeWidth = 0,
  pinch = -1,
  freqSpread = 0,
  detail = 0,
  scatter = 0,
  fade = 0,
  lengthFade = 0,
  interactionRef = null,
  className = ''
}) => {
  const containerRef = useRef(null);
  const mouseRef = useRef({ enabled: true, strength: 0.3 });
  const strokeRef = useRef(0);
  const heightRef = useRef(0);
  const dprRef = useRef(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      dpr
    });

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Float32Array([1, 1]) },
        uSpeed: { value: 0.2 },
        uThreadCount: { value: 6 },
        uFrequency: { value: 5.0 },
        uSpread: { value: 0.18 },
        uTaper: { value: 1.0 },
        uPosition: { value: 0.5 },
        uFanMode: { value: 0 },
        uGlow: { value: 0.02 },
        uFalloff: { value: 0.6 },
        uThickness: { value: 1.1 },
        uBrightness: { value: 0.6 },
        uOpacity: { value: 1.0 },
        uMirror: { value: 1.0 },
        uShimmer: { value: 0.0 },
        uGrain: { value: 1.0 },
        uGrainIntensity: { value: 0.05 },
        uColor1: { value: new Float32Array([1, 1, 1]) },
        uColor2: { value: new Float32Array([1, 1, 1]) },
        uColor3: { value: new Float32Array([1, 1, 1]) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseStrength: { value: 0.3 },
        uEnableMouse: { value: 1.0 },
        uMouseActive: { value: 0 },
        uStroke: { value: 0 },
        uStrokeAA: { value: 0 },
        uPinch: { value: -1 },
        uFreqSpread: { value: 0 },
        uDetail: { value: 0 },
        uScatter: { value: 0 },
        uFade: { value: 0 },
        uLengthFade: { value: 0 }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctxMap.set(container, { renderer, program, mesh });

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w, h);
      const res = program.uniforms.iResolution.value;
      res[0] = gl.drawingBufferWidth;
      res[1] = gl.drawingBufferHeight;
      heightRef.current = h;
      const [core, aa] = strokeUniforms(strokeRef.current, h, dpr);
      program.uniforms.uStroke.value = core;
      program.uniforms.uStrokeAA.value = aa;
      renderer.render({ scene: mesh });
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(container);
    setSize();

    const currentMouse = [0.5, 0.5];
    const targetMouse = [0.5, 0.5];
    let currentActive = 0;
    let targetActive = 0;

    const onMouseMove = e => {
      const rect = canvas.getBoundingClientRect();
      targetMouse[0] = (e.clientX - rect.left) / rect.width;
      targetMouse[1] = 1.0 - (e.clientY - rect.top) / rect.height;
      targetActive = 1;
    };
    const onMouseEnter = () => {
      targetActive = 1;
    };
    const onMouseLeave = () => {
      targetActive = 0;
    };
    // Pointer tracking can be delegated to an ancestor (a hero section, say) so
    // the threads keep following the cursor while it is over content painted on
    // top of the canvas.
    const pointerZone = interactionRef?.current || canvas;
    pointerZone.addEventListener('mousemove', onMouseMove);
    pointerZone.addEventListener('mouseenter', onMouseEnter);
    pointerZone.addEventListener('mouseleave', onMouseLeave);

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const t0 = performance.now();

    const loop = t => {
      program.uniforms.iTime.value = (t - t0) * 0.001;
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      currentActive += 0.05 * (targetActive - currentActive);
      program.uniforms.uMouse.value[0] = currentMouse[0];
      program.uniforms.uMouse.value[1] = currentMouse[1];
      program.uniforms.uMouseActive.value = currentActive;
      program.uniforms.uEnableMouse.value = mouseRef.current.enabled ? 1.0 : 0.0;
      program.uniforms.uMouseStrength.value = mouseRef.current.strength;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(loop);
    };
    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        isVisible ? tryStart() : tryStop();
      },
      { threshold: 0 }
    );
    io.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      isPageVisible ? tryStart() : tryStop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    tryStart();

    return () => {
      tryStop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      pointerZone.removeEventListener('mousemove', onMouseMove);
      pointerZone.removeEventListener('mouseenter', onMouseEnter);
      pointerZone.removeEventListener('mouseleave', onMouseLeave);
      ctxMap.delete(container);
      try {
        container.removeChild(canvas);
      } catch {
        // canvas may already be detached
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // interactionRef is a stable ref object; listed only to satisfy the
    // exhaustive-deps rule - it never re-creates the WebGL context in practice.
  }, [interactionRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ctx = ctxMap.get(container);
    if (!ctx) return;
    const { program } = ctx;
    const u = program.uniforms;

    u.uSpeed.value = speed;
    u.uThreadCount.value = Math.round(threadCount);
    u.uFrequency.value = frequency;
    u.uSpread.value = spread;
    u.uTaper.value = taper;
    u.uPosition.value = position;
    u.uFanMode.value = FAN_MODE[fanMode] ?? 0;
    u.uPinch.value = pinch;
    u.uFreqSpread.value = freqSpread;
    u.uDetail.value = detail;
    u.uScatter.value = scatter;
    u.uFade.value = fade;
    u.uLengthFade.value = lengthFade;
    u.uGlow.value = glow;
    u.uFalloff.value = falloff;
    u.uThickness.value = thickness;
    u.uBrightness.value = brightness;
    u.uOpacity.value = opacity;
    u.uMirror.value = mirror ? 1.0 : 0.0;
    u.uShimmer.value = shimmer ? 1.0 : 0.0;
    u.uGrain.value = grain ? 1.0 : 0.0;
    u.uGrainIntensity.value = grainIntensity;
    const c1 = u.uColor1.value;
    const rgb1 = hexToRgb(color1);
    c1[0] = rgb1[0];
    c1[1] = rgb1[1];
    c1[2] = rgb1[2];
    const c2 = u.uColor2.value;
    const rgb2 = hexToRgb(color2);
    c2[0] = rgb2[0];
    c2[1] = rgb2[1];
    c2[2] = rgb2[2];
    const c3 = u.uColor3.value;
    const rgb3 = hexToRgb(color3);
    c3[0] = rgb3[0];
    c3[1] = rgb3[1];
    c3[2] = rgb3[2];
    strokeRef.current = strokeWidth;
    const [core, aa] = strokeUniforms(strokeWidth, heightRef.current, dprRef.current);
    u.uStroke.value = core;
    u.uStrokeAA.value = aa;
    u.uMouseStrength.value = mouseStrength;
    u.uEnableMouse.value = mouseInteraction ? 1.0 : 0.0;
    mouseRef.current.enabled = mouseInteraction;
    mouseRef.current.strength = mouseStrength;
  }, [
    color1,
    color2,
    color3,
    speed,
    threadCount,
    frequency,
    spread,
    taper,
    position,
    fanMode,
    glow,
    falloff,
    thickness,
    brightness,
    opacity,
    mirror,
    shimmer,
    grain,
    grainIntensity,
    mouseInteraction,
    mouseStrength,
    strokeWidth,
    pinch,
    freqSpread,
    detail,
    scatter,
    fade,
    lengthFade
  ]);

  return <div ref={containerRef} className={`web-threads-container ${className}`.trim()} />;
};

export default WebThreads;
