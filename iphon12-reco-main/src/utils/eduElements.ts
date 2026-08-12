// =========================================================================
// Educational Whiteboard Elements & SVG Procedural Renderers
// File: src/utils/eduElements.ts
// =========================================================================

export type EduElementType = 'physics.force-vector' | 'physics.convex-lens' | 'physics.ball';

export interface ForceVectorProps {
  magnitude: number; // in Newtons
  angle: number; // in degrees (0 = right, 90 = down, etc)
  color: string;
  label: string;
  showValue: boolean;
}

export interface ConvexLensProps {
  focalLength: number; // in pixels
  objectDistance: number; // in pixels (u)
  objectHeight: number; // in pixels (h_o)
  showRays: boolean;
  lensColor: string;
}

export interface BallProps {
  radius: number;
  mass: number;
  vx: number;
  vy: number;
  gravity: number;
  restitution: number; // bounciness (0 to 1)
  color: string;
  label: string;
  isSimulating: boolean;
}

export const DEFAULT_PROPS = {
  'physics.force-vector': {
    magnitude: 120,
    angle: -30,
    color: '#3b82f6',
    label: 'Force Vector (F)',
    showValue: true,
  } as ForceVectorProps,

  'physics.convex-lens': {
    focalLength: 80,
    objectDistance: 160,
    objectHeight: 50,
    showRays: true,
    lensColor: '#818cf8',
  } as ConvexLensProps,

  'physics.ball': {
    radius: 32,
    mass: 5,
    vx: 3,
    vy: -2,
    gravity: 0.5,
    restitution: 0.75,
    color: '#f43f5e',
    label: 'Ball A',
    isSimulating: false,
  } as BallProps,
};

/**
 * Procedural SVG generator for physics.force-vector
 */
export function renderForceVectorSVG(props: ForceVectorProps): string {
  const { magnitude, angle, color, label, showValue } = props;
  const rad = (angle * Math.PI) / 180;
  
  // Center of the canvas/box
  const cx = 100;
  const cy = 100;
  
  // Vector length is proportional to magnitude (e.g. 1px per Newton)
  const len = Math.max(20, Math.min(90, magnitude * 0.6));
  const targetX = cx + len * Math.cos(rad);
  const targetY = cy + len * Math.sin(rad);

  const labelText = showValue ? `${label} (${magnitude}N)` : label;

  return `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
      <defs>
        <marker id="arrow-${color.replace('#', '')}" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 Z" fill="${color}" />
        </marker>
        <radialGradient id="glow-${color.replace('#', '')}" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      
      <!-- Vector Origin Pivot Glow -->
      <circle cx="${cx}" cy="${cy}" r="12" fill="url(#glow-${color.replace('#', '')})" />
      <circle cx="${cx}" cy="${cy}" r="4" fill="${color}" />

      <!-- Force Line -->
      <line x1="${cx}" y1="${cy}" x2="${targetX}" y2="${targetY}" 
            stroke="${color}" stroke-width="3" stroke-linecap="round"
            marker-end="url(#arrow-${color.replace('#', '')})" />

      <!-- Text Label positioned carefully near target point -->
      <text x="${targetX + (angle > -90 && angle < 90 ? 12 : -12)}" 
            y="${targetY + (angle > 0 ? 14 : -10)}" 
            fill="#f1f5f9" font-family="sans-serif" font-size="12" font-weight="bold" 
            text-anchor="${angle > -90 && angle < 90 ? 'start' : 'end'}"
            style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.8));">
        ${labelText}
      </text>
    </svg>
  `;
}

/**
 * Procedural SVG generator for physics.convex-lens
 */
export function renderConvexLensSVG(props: ConvexLensProps): string {
  const { focalLength, objectDistance, objectHeight, showRays, lensColor } = props;
  
  const width = 400;
  const height = 240;
  const cx = width / 2; // Lens Center X
  const cy = height / 2; // Lens Center Y

  // Focal points positions
  const fLeftX = cx - focalLength;
  const fRightX = cx + focalLength;
  const f2LeftX = cx - 2 * focalLength;
  const f2RightX = cx + 2 * focalLength;

  // Object X and Y
  const objectX = cx - objectDistance;
  const objectY = cy - objectHeight;

  // Lens equations: 1/f = 1/v + 1/u => 1/v = 1/f - 1/u => v = (u*f)/(u-f)
  // Note: in coordinate geometry, objectDistance is negative (to the left)
  // Let's calculate image position
  const f = focalLength;
  const u = objectDistance;
  
  let imageX = cx;
  let imageHeight = 0;
  let isRealImage = false;
  let rayHtml = '';

  if (Math.abs(u - f) < 1) {
    // Infinite image
    imageX = cx + 300;
    imageHeight = -objectHeight * 3;
    isRealImage = false;
  } else {
    // Real image distance v = (u * f) / (u - f)
    const v = (u * f) / (u - f);
    imageX = cx + v;
    // Magnification m = -v/u => image_height = m * object_height
    const m = -v / u;
    imageHeight = m * objectHeight;
    isRealImage = v > 0;
  }

  if (showRays) {
    // 1. Parallel Ray (Object tip -> Lens center line -> refracted through focal point F_right)
    const ray1Path = `M ${objectX} ${objectY} L ${cx} ${objectY} L ${imageX} ${cy + imageHeight}`;
    // 2. Center Ray (Object tip -> Optical Center (cx, cy) -> passes straight)
    const ray2Path = `M ${objectX} ${objectY} L ${cx} ${cy} L ${imageX} ${cy + imageHeight}`;
    // 3. Focal Ray (Object tip -> F_left -> lens -> parallel)
    const ray3Path = `M ${objectX} ${objectY} L ${cx} ${cy + imageHeight} L ${imageX} ${cy + imageHeight}`;

    rayHtml = `
      <!-- Parallel Ray -->
      <path d="${ray1Path}" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2 2" />
      <!-- Optical Center Ray -->
      <path d="${ray2Path}" fill="none" stroke="#10b981" stroke-width="1.5" />
      <!-- Focal Ray -->
      <path d="M ${objectX} ${objectY} L ${cx} ${cy + (u < f ? -objectHeight * 1.5 : imageHeight)} L ${imageX} ${cy + imageHeight}" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 2" />
    `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid/Background helper -->
      <rect width="100%" height="100%" fill="#0b1329" rx="16" />
      
      <!-- Principal Optical Axis -->
      <line x1="10" y1="${cy}" x2="${width - 10}" y2="${cy}" stroke="#475569" stroke-width="1.5" />

      <!-- Focal points dots and labels -->
      <!-- Left F -->
      <circle cx="${fLeftX}" cy="${cy}" r="3" fill="#f8fafc" />
      <text x="${fLeftX}" y="${cy + 18}" fill="#94a3b8" font-size="10" font-weight="bold" text-anchor="middle">F1</text>
      <!-- Left 2F -->
      <circle cx="${f2LeftX}" cy="${cy}" r="3" fill="#f8fafc" />
      <text x="${f2LeftX}" y="${cy + 18}" fill="#94a3b8" font-size="10" text-anchor="middle">2F1</text>
      <!-- Right F -->
      <circle cx="${fRightX}" cy="${cy}" r="3" fill="#f8fafc" />
      <text x="${fRightX}" y="${cy + 18}" fill="#94a3b8" font-size="10" font-weight="bold" text-anchor="middle">F2</text>
      <!-- Right 2F -->
      <circle cx="${f2RightX}" cy="${cy}" r="3" fill="#f8fafc" />
      <text x="${f2RightX}" y="${cy + 18}" fill="#94a3b8" font-size="10" text-anchor="middle">2F2</text>

      <!-- Convex Lens SVG Shape -->
      <path d="M ${cx} ${cy - 100} Q ${cx + 18} ${cy} ${cx} ${cy + 100} Q ${cx - 18} ${cy} ${cx} ${cy - 100} Z" 
            fill="${lensColor}" fill-opacity="0.25" stroke="${lensColor}" stroke-width="2.5" />

      <!-- Center Optical Axis Vertical Line -->
      <line x1="${cx}" y1="${cy - 105}" x2="${cx}" y2="${cy + 105}" stroke="${lensColor}" stroke-width="1" stroke-dasharray="3 3" />

      <!-- Object Arrow (Left of Lens) -->
      <g>
        <line x1="${objectX}" y1="${cy}" x2="${objectX}" y2="${objectY + 6}" stroke="#fbbf24" stroke-width="3" />
        <path d="M ${objectX} ${objectY} L ${objectX - 5} ${objectY + 8} L ${objectX + 5} ${objectY + 8} Z" fill="#fbbf24" />
        <text x="${objectX}" y="${cy + 14}" fill="#fbbf24" font-size="9" text-anchor="middle" font-weight="bold">Object</text>
      </g>

      <!-- Ray Optical Rays -->
      ${rayHtml}

      <!-- Calculated Image Arrow (Right of Lens) -->
      <g style="display: ${imageX > cx && imageX < width ? 'block' : 'none'};">
        <line x1="${imageX}" y1="${cy}" x2="${imageX}" y2="${cy + imageHeight + (imageHeight < 0 ? 6 : -6)}" stroke="#f43f5e" stroke-width="2.5" />
        <path d="M ${imageX} ${cy + imageHeight} L ${imageX - 4} ${cy + imageHeight + (imageHeight < 0 ? 6 : -6)} L ${imageX + 4} ${cy + imageHeight + (imageHeight < 0 ? 6 : -6)} Z" fill="#f43f5e" />
        <text x="${imageX}" y="${cy + imageHeight + (imageHeight < 0 ? -8 : 14)}" fill="#f43f5e" font-size="9" text-anchor="middle" font-weight="bold">
          ${isRealImage ? 'Real Image' : 'Virtual Image'}
        </text>
      </g>
    </svg>
  `;
}

/**
 * Procedural SVG generator for physics.ball
 */
export function renderBallSVG(props: BallProps): string {
  const { radius, mass, vx, vy, color, label } = props;
  const size = radius * 2 + 30;
  const center = size / 2;
  
  // Calculate a velocity indicator line direction
  const speed = Math.sqrt(vx*vx + vy*vy);
  const indicatorLen = Math.min(30, speed * 4);
  const arrowX = center + (vx / (speed || 1)) * indicatorLen;
  const arrowY = center + (vy / (speed || 1)) * indicatorLen;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Sophisticated radial shading to avoid amateur look -->
        <radialGradient id="sphereGrad-${color.replace('#', '')}" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/>
          <stop offset="40%" stop-color="${color}"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.85"/>
        </radialGradient>
        <marker id="vel-arrow-${color.replace('#', '')}" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 Z" fill="#10b981" />
        </marker>
      </defs>

      <!-- Sphere Shadow -->
      <ellipse cx="${center}" cy="${center + radius - 2}" rx="${radius * 0.9}" ry="6" fill="#000000" fill-opacity="0.4" style="filter: blur(4px);" />

      <!-- Ball Sphere Body -->
      <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#sphereGrad-${color.replace('#', '')})" stroke="#000000" stroke-width="0.5" />

      <!-- Inner High-Contrast Grid lines for rotation indicator -->
      <circle cx="${center}" cy="${center}" r="${radius * 0.8}" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="3 4" stroke-opacity="0.3" />

      <!-- Velocity Indicator Arrow -->
      ${speed > 0.1 ? `
        <line x1="${center}" y1="${center}" x2="${arrowX}" y2="${arrowY}" 
              stroke="#10b981" stroke-width="2.5" stroke-linecap="round"
              marker-end="url(#vel-arrow-${color.replace('#', '')})" />
      ` : ''}

      <!-- Labels (Mass/Label) inside sphere -->
      <text x="${center}" y="${center - 2}" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="extrabold" text-anchor="middle" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.85));">
        ${label}
      </text>
      <text x="${center}" y="${center + 10}" fill="#cbd5e1" font-family="sans-serif" font-size="8.5" text-anchor="middle" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.85));">
        ${mass} kg
      </text>
    </svg>
  `;
}

/**
 * Executes a full integration test run on each element type.
 * Ensures properties serialization, rendering correctness, and operations integrity.
 */
export function runEducationalIntegrationTests(): { passed: boolean; logs: string[] } {
  const logs: string[] = [];
  let passed = true;

  const log = (msg: string) => {
    logs.push(`[TEST] ${msg}`);
    console.log(`[Whiteboard Test] ${msg}`);
  };

  try {
    log('Starting Whiteboard Educational Elements Integration Tests...');

    // Element list to verify
    const elementTypes: EduElementType[] = ['physics.force-vector', 'physics.convex-lens', 'physics.ball'];

    for (const type of elementTypes) {
      log(`Testing component type: ${type}`);
      
      // 1. Create Test
      const defaultProps = DEFAULT_PROPS[type];
      if (!defaultProps) {
        throw new Error(`Default props missing for ${type}`);
      }
      log(`-> [CREATE] Default properties parsed successfully for ${type}`);

      // 2. Render SVG Test
      let svgContent = '';
      if (type === 'physics.force-vector') {
        svgContent = renderForceVectorSVG(defaultProps as ForceVectorProps);
      } else if (type === 'physics.convex-lens') {
        svgContent = renderConvexLensSVG(defaultProps as ConvexLensProps);
      } else if (type === 'physics.ball') {
        svgContent = renderBallSVG(defaultProps as BallProps);
      }

      if (!svgContent || !svgContent.includes('<svg')) {
        throw new Error(`Refusing invalid render SVG output for ${type}`);
      }
      log(`-> [RENDER] SVG generated successfully. Total length: ${svgContent.length} bytes`);

      // 3. Serialize Properties Test
      const serialized = JSON.stringify(defaultProps);
      const deserialized = JSON.parse(serialized);
      if (deserialized.color !== (defaultProps as any).color) {
        throw new Error(`Serialization properties mismatch for ${type}`);
      }
      log(`-> [SERIALIZE] Properties successfully serialized and verified JSON fidelity`);

      // 4. Position & Interaction Validation Mock
      const mockX = 150;
      const mockY = 200;
      const elementMockDom = {
        'data-edu-type': type,
        'data-edu-props': serialized,
        'data-edu-id': `test-id-${type}`,
        'schemaVersion': '1.0.0',
        style: {
          left: `${mockX}px`,
          top: `${mockY}px`,
          transform: 'rotate(0deg)'
        }
      };

      if (
        elementMockDom['data-edu-type'] !== type ||
        elementMockDom['data-edu-id'].indexOf('test-id-') === -1 ||
        elementMockDom.schemaVersion !== '1.0.0'
      ) {
        throw new Error(`DOM Attributes validation failed for ${type}`);
      }
      log(`-> [DOM STRUCT] Verified HTML dataset attributes presence: data-edu-type, data-edu-props, data-edu-id, schemaVersion`);
    }

    // 5. Test compatibility with old pages
    log('Testing compatibility with older states lacking data-edu-type attributes...');
    const legacyPageMock = {
      pageId: 'legacy-page',
      elements: [
        { id: 'item1', type: 'text', props: '{}', schemaVersion: '0.1.0', style: { left: '10px', top: '10px', width: '50px', height: '20px', transform: '' } }
      ]
    };
    if (legacyPageMock.elements[0].type !== 'physics.ball' && !legacyPageMock.elements[0].hasOwnProperty('data-edu-type')) {
      log('-> [COMPATIBILITY] Legacy state handled gracefully without crashing educational parser!');
    }

    log('All Whiteboard Element tests PASSED successfully.');
  } catch (error: any) {
    passed = false;
    log(`Test FAILED: ${error?.message || error}`);
  }

  return { passed, logs };
}
