import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

import './FloatingLines.css';

/**
 * Animated ink-line waves, drawn as one full-screen fragment shader.
 *
 * Runs on ogl rather than three. The fragment shader below is unchanged - it is
 * the look, and it is GLSL ES 1.00, so the context is forced to WebGL 1 to keep
 * gl_FragColor valid. What changed is everything around it: three pulled in a
 * 25MB package and shipped ~500KB of renderer, scene graph and camera code to
 * draw a single quad, and this component is the only thing in the app that used
 * it. ogl was already a dependency here, drawing the home hero's threads and
 * the carousel, and gives the same result from a Triangle and a Program.
 *
 * The loop stops when the layer scrolls out of view or the tab is hidden, and
 * `prefers-reduced-motion` gets one static frame, matching AtomField - these
 * waves sit behind most of the site now, so they should cost nothing when they
 * are not on screen.
 */

// ogl's Triangle covers clip space on its own, so there is no matrix to apply.
const vertexShader = `
precision highp float;

attribute vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;
uniform vec3 backgroundColor;
uniform bool lightMode;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

// GLSL ES 1.00 will not compare a loop index against a uniform, so the wave
// loops count to a constant and break at the real count instead. 32 is well
// above the most any caller asks for (InkLines' largest is 16).
const int MAX_LINES = 32;

/* ES 1.00 also refuses to index a uniform array with a computed value - only a
   constant or a loop index is allowed - so the stop is picked by walking the
   array. Same result, and it compiles on both WebGL 1 and 2. */
vec3 gradientAt(int index) {
  for (int i = 0; i < 8; ++i) {
    if (i == index) return lineGradient[i];
  }
  return lineGradient[0];
}

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);

  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;

  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  vec3 gradientColor;
  
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    // There is no integer min() in ES 1.00, so clamp the index by hand.
    int idx2 = idx + 1;
    if (idx2 > lineGradientCount - 1) idx2 = lineGradientCount - 1;

    vec3 c1 = gradientAt(idx);
    vec3 c2 = gradientAt(idx2);

    gradientColor = mix(c1, c2, f);
  }
  
  return gradientColor * 0.5;
}

  float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;

  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius); // radial falloff around cursor
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  
  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);

  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }
  
  if (enableBottom) {
    for (int i = 0; i < MAX_LINES; ++i) {
      if (i >= bottomLineCount) break;
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < MAX_LINES; ++i) {
      if (i >= middleLineCount) break;
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < MAX_LINES; ++i) {
      if (i >= topLineCount) break;
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

if (lightMode) {
  vec3 energy = max(col, vec3(0.0));
  float peak = max(energy.r, max(energy.g, energy.b));
  float coverage = smoothstep(0.018, 0.5, peak);
  vec3 chroma = clamp(energy / max(peak, 0.0001), 0.0, 1.0);
  chroma = pow(chroma, vec3(1.35));
  float chromaPeak = max(chroma.r, max(chroma.g, chroma.b));
  chroma /= max(chromaPeak, 0.0001);
  vec3 ink = mix(chroma, clamp(chroma * 0.82, 0.0, 1.0), smoothstep(0.5, 1.0, coverage));
  fragColor = vec4(mix(vec3(1.0), ink, coverage * 0.94), 1.0);
} else {
    fragColor = vec4(col, 1.0);
  }
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

const MAX_GRADIENT_STOPS = 8;

/** `#abc` or `#aabbcc` to the 0..1 triple the shader wants. */
function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '');
  let r = 255;
  let g = 255;
  let b = 255;

  if (value.length === 3) {
    r = parseInt(value[0] + value[0], 16);
    g = parseInt(value[1] + value[1], 16);
    b = parseInt(value[2] + value[2], 16);
  } else if (value.length === 6) {
    r = parseInt(value.slice(0, 2), 16);
    g = parseInt(value.slice(2, 4), 16);
    b = parseInt(value.slice(4, 6), 16);
  }

  return [r / 255, g / 255, b / 255];
}

const lerp = (from, to, t) => from + (to - from) * t;

export default function FloatingLines({
  linesGradient,
  enabledWaves = ['top', 'middle', 'bottom'],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2.0, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = 'screen',
  backgroundColor = '#000000',
  lightMode = false
}) {
  const containerRef = useRef(null);

  const getLineCount = waveType => {
    if (typeof lineCount === 'number') return lineCount;
    if (!enabledWaves.includes(waveType)) return 0;
    const index = enabledWaves.indexOf(waveType);
    return lineCount[index] ?? 6;
  };

  const getLineDistance = waveType => {
    if (typeof lineDistance === 'number') return lineDistance;
    if (!enabledWaves.includes(waveType)) return 0.1;
    const index = enabledWaves.indexOf(waveType);
    return lineDistance[index] ?? 0.1;
  };

  const topLineCount = enabledWaves.includes('top') ? getLineCount('top') : 0;
  const middleLineCount = enabledWaves.includes('middle') ? getLineCount('middle') : 0;
  const bottomLineCount = enabledWaves.includes('bottom') ? getLineCount('bottom') : 0;

  const topLineDistance = enabledWaves.includes('top') ? getLineDistance('top') * 0.01 : 0.01;
  const middleLineDistance = enabledWaves.includes('middle') ? getLineDistance('middle') * 0.01 : 0.01;
  const bottomLineDistance = enabledWaves.includes('bottom') ? getLineDistance('bottom') * 0.01 : 0.01;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let active = true;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;

    // WebGL 1: the fragment shader is GLSL ES 1.00 and writes gl_FragColor.
    const renderer = new Renderer({
      webgl: 1,
      alpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });

    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    // A plain array, not a Float32Array. GL reports this uniform as
    // `lineGradient[0]`, and ogl decides whether that trailing index means "the
    // whole array" by testing Array.isArray on the value - which a typed array
    // fails, so the gradient would be dropped with an "has not been supplied"
    // warning and every line would fall back to its base colour.
    const gradient = new Array(MAX_GRADIENT_STOPS * 3).fill(1);
    let gradientCount = 0;
    if (linesGradient && linesGradient.length > 0) {
      const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS);
      gradientCount = stops.length;
      stops.forEach((hex, i) => {
        const [r, g, b] = hexToRgb(hex);
        gradient[i * 3] = r;
        gradient[i * 3 + 1] = g;
        gradient[i * 3 + 2] = b;
      });
    }

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Float32Array([1, 1, 1]) },
      animationSpeed: { value: animationSpeed },

      enableTop: { value: enabledWaves.includes('top') },
      enableMiddle: { value: enabledWaves.includes('middle') },
      enableBottom: { value: enabledWaves.includes('bottom') },

      topLineCount: { value: topLineCount },
      middleLineCount: { value: middleLineCount },
      bottomLineCount: { value: bottomLineCount },

      topLineDistance: { value: topLineDistance },
      middleLineDistance: { value: middleLineDistance },
      bottomLineDistance: { value: bottomLineDistance },

      topWavePosition: {
        value: new Float32Array([
          topWavePosition?.x ?? 10.0,
          topWavePosition?.y ?? 0.5,
          topWavePosition?.rotate ?? -0.4
        ])
      },
      middleWavePosition: {
        value: new Float32Array([
          middleWavePosition?.x ?? 5.0,
          middleWavePosition?.y ?? 0.0,
          middleWavePosition?.rotate ?? 0.2
        ])
      },
      bottomWavePosition: {
        value: new Float32Array([
          bottomWavePosition?.x ?? 2.0,
          bottomWavePosition?.y ?? -0.7,
          bottomWavePosition?.rotate ?? 0.4
        ])
      },

      iMouse: { value: new Float32Array([-1000, -1000]) },
      interactive: { value: interactive },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },

      parallax: { value: parallax },
      parallaxStrength: { value: parallaxStrength },
      parallaxOffset: { value: new Float32Array([0, 0]) },

      lineGradient: { value: gradient },
      lineGradientCount: { value: gradientCount },
      backgroundColor: { value: new Float32Array(hexToRgb(backgroundColor)) },
      lightMode: { value: lightMode }
    };

    const program = new Program(gl, { vertex: vertexShader, fragment: fragmentShader, uniforms });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const setSize = () => {
      if (!active) return;
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height);
      uniforms.iResolution.value[0] = gl.drawingBufferWidth;
      uniforms.iResolution.value[1] = gl.drawingBufferHeight;
      uniforms.iResolution.value[2] = 1;
    };
    setSize();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(setSize) : null;
    if (ro) ro.observe(container);

    // Pointer state, eased towards its target in the loop.
    let targetMouseX = -1000;
    let targetMouseY = -1000;
    let mouseX = -1000;
    let mouseY = -1000;
    let targetInfluence = 0;
    let influence = 0;
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let parallaxX = 0;
    let parallaxY = 0;

    const handlePointerMove = event => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const dpr = renderer.dpr;

      targetMouseX = x * dpr;
      targetMouseY = (rect.height - y) * dpr;
      targetInfluence = 1.0;

      if (parallax) {
        const offsetX = (x - rect.width / 2) / rect.width;
        const offsetY = -(y - rect.height / 2) / rect.height;
        targetParallaxX = offsetX * parallaxStrength;
        targetParallaxY = offsetY * parallaxStrength;
      }
    };

    const handlePointerLeave = () => {
      targetInfluence = 0.0;
    };

    if (interactive && !still) {
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerleave', handlePointerLeave);
    }

    const draw = () => renderer.render({ scene: mesh });

    // One frame is all a reduced-motion visitor gets.
    if (still) {
      draw();
      return () => {
        active = false;
        if (ro) ro.disconnect();
        if (canvas.parentElement) canvas.parentElement.removeChild(canvas);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      };
    }

    let raf = 0;
    let elapsed = 0;
    let last = performance.now();
    let onScreen = true;

    const renderLoop = now => {
      if (!active) return;
      elapsed += (now - last) / 1000;
      last = now;
      uniforms.iTime.value = elapsed;

      if (interactive) {
        mouseX = lerp(mouseX, targetMouseX, mouseDamping);
        mouseY = lerp(mouseY, targetMouseY, mouseDamping);
        uniforms.iMouse.value[0] = mouseX;
        uniforms.iMouse.value[1] = mouseY;

        influence = lerp(influence, targetInfluence, mouseDamping);
        uniforms.bendInfluence.value = influence;
      }

      if (parallax) {
        parallaxX = lerp(parallaxX, targetParallaxX, mouseDamping);
        parallaxY = lerp(parallaxY, targetParallaxY, mouseDamping);
        uniforms.parallaxOffset.value[0] = parallaxX;
        uniforms.parallaxOffset.value[1] = parallaxY;
      }

      draw();
      raf = requestAnimationFrame(renderLoop);
    };

    const start = () => {
      if (!active || raf || !onScreen || document.hidden) return;
      // Reset the clock reference, or the layer jumps by however long it slept.
      last = performance.now();
      raf = requestAnimationFrame(renderLoop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) start(); else stop();
      }, { rootMargin: '120px' })
      : null;
    if (io) io.observe(container); else start();

    const onVisibility = () => { if (document.hidden) stop(); else start(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      stop();
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (interactive) {
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerleave', handlePointerLeave);
      }
      if (canvas.parentElement) canvas.parentElement.removeChild(canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    linesGradient,
    enabledWaves,
    lineCount,
    lineDistance,
    topWavePosition,
    middleWavePosition,
    bottomWavePosition,
    animationSpeed,
    interactive,
    bendRadius,
    bendStrength,
    mouseDamping,
    parallax,
    parallaxStrength,
    backgroundColor,
    lightMode
  ]);

  return (
    <div
      ref={containerRef}
      className="floating-lines-container"
      style={{
        mixBlendMode: lightMode ? 'normal' : mixBlendMode
      }}
    />
  );
}
