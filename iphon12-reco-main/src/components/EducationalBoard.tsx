// =========================================================================
// Science Whiteboard & Interactive Educational Lab Board
// File: src/components/EducationalBoard.tsx
// =========================================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Play, 
  Pause, 
  Check, 
  Sliders, 
  FileDown, 
  Beaker, 
  Undo2, 
  Redo2, 
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  EduElementType, 
  DEFAULT_PROPS, 
  ForceVectorProps, 
  ConvexLensProps, 
  BallProps,
  renderForceVectorSVG, 
  renderConvexLensSVG, 
  renderBallSVG,
  runEducationalIntegrationTests 
} from '../utils/eduElements';
import { 
  savePageState, 
  loadPageState, 
  EduElementState 
} from '../utils/indexedDB';

interface LocalElement {
  id: string;
  type: EduElementType;
  props: string; // JSON string
  style: {
    left: number; // in pixels relative to whiteboard
    top: number; // in pixels relative to whiteboard
    width: number;
    height: number;
    transform: string; // rotation etc.
  };
}

export const EducationalBoard: React.FC<{ lang: 'en' | 'ar' }> = ({ lang }) => {
  const isAr = lang === 'ar';
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Element states
  const [elements, setElements] = useState<LocalElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Physics simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const physicsTimerRef = useRef<number | null>(null);

  // Undo / Redo stacks
  const [undoStack, setUndoStack] = useState<LocalElement[][]>([]);
  const [redoStack, setRedoStack] = useState<LocalElement[][]>([]);

  // Testing console
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');

  // Dragging states
  const [dragState, setDragState] = useState<{
    elemId: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  // Load from IndexedDB on startup
  useEffect(() => {
    const initLoad = async () => {
      const saved = await loadPageState('primary-science-board');
      if (saved && saved.elements) {
        // Map saved IndexedDB elements (which have string styles) back to local numeric-style formats
        const mapped: LocalElement[] = saved.elements.map(el => {
          const left = parseFloat(el.style.left) || 100;
          const top = parseFloat(el.style.top) || 100;
          const width = parseFloat(el.style.width) || 200;
          const height = parseFloat(el.style.height) || 200;
          return {
            id: el.id,
            type: el.type as EduElementType,
            props: el.props,
            style: {
              left,
              top,
              width,
              height,
              transform: el.style.transform || '',
            }
          };
        });
        setElements(mapped);
      }
    };
    initLoad();
  }, []);

  // Save current state to IndexedDB helper
  const persistToDB = async (currentElems: LocalElement[]) => {
    const dbElems: EduElementState[] = currentElems.map(el => ({
      id: el.id,
      type: el.type,
      props: el.props,
      schemaVersion: '1.0.0',
      style: {
        left: `${el.style.left}px`,
        top: `${el.style.top}px`,
        width: `${el.style.width}px`,
        height: `${el.style.height}px`,
        transform: el.style.transform,
      }
    }));
    await savePageState({
      pageId: 'primary-science-board',
      elements: dbElems,
      updatedAt: Date.now()
    });
  };

  // saveH(): Saves current layout state onto undo stack
  const saveH = (stateToSave: LocalElement[]) => {
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(elements))]);
    setRedoStack([]); // Clear redo stack on new action
    persistToDB(stateToSave);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(elements))]);
    setElements(previous);
    persistToDB(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(elements))]);
    setElements(next);
    persistToDB(next);
  };

  // Add Element to whiteboard
  const handleAddElement = (type: EduElementType) => {
    const newId = `edu-elem-${Date.now()}`;
    const defaultProps = JSON.stringify(DEFAULT_PROPS[type]);
    
    // Default sizes per type
    let w = 200;
    let h = 200;
    if (type === 'physics.convex-lens') {
      w = 400;
      h = 240;
    } else if (type === 'physics.ball') {
      w = 120;
      h = 120;
    }

    const newElement: LocalElement = {
      id: newId,
      type,
      props: defaultProps,
      style: {
        left: 80 + (elements.length * 30) % 200,
        top: 80 + (elements.length * 20) % 150,
        width: w,
        height: h,
        transform: '',
      }
    };

    const nextElems = [...elements, newElement];
    saveH(nextElems);
    setElements(nextElems);
    setSelectedId(newId);
  };

  // Delete Element
  const handleDeleteElement = (id: string) => {
    const nextElems = elements.filter(el => el.id !== id);
    saveH(nextElems);
    setElements(nextElems);
    if (selectedId === id) setSelectedId(null);
  };

  // Update properties of selected element
  const handleUpdateProps = (id: string, updatedPropsObj: any) => {
    const nextElems = elements.map(el => {
      if (el.id === id) {
        const parsed = JSON.parse(el.props);
        const merged = { ...parsed, ...updatedPropsObj };
        return {
          ...el,
          props: JSON.stringify(merged)
        };
      }
      return el;
    });
    setElements(nextElems);
    persistToDB(nextElems);
  };

  // Handle Dragging / Movement Mouse Events
  const handleElementMouseDown = (e: React.MouseEvent, elem: LocalElement) => {
    e.stopPropagation();
    setSelectedId(elem.id);
    
    setDragState({
      elemId: elem.id,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: elem.style.left,
      startTop: elem.style.top,
    });
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!dragState) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    // Apply move bounds
    const container = containerRef.current;
    const containerW = container ? container.clientWidth : 800;
    const containerH = container ? container.clientHeight : 500;

    const el = elements.find(item => item.id === dragState.elemId);
    if (!el) return;

    const targetLeft = Math.max(0, Math.min(containerW - el.style.width, dragState.startLeft + dx));
    const targetTop = Math.max(0, Math.min(containerH - el.style.height, dragState.startTop + dy));

    setElements(prev => prev.map(item => {
      if (item.id === dragState.elemId) {
        return {
          ...item,
          style: {
            ...item.style,
            left: targetLeft,
            top: targetTop
          }
        };
      }
      return item;
    }));
  };

  const handleGlobalMouseUp = () => {
    if (dragState) {
      saveH(elements);
      setDragState(null);
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [dragState, elements]);

  // Run Real Kinematics Physics Loop
  useEffect(() => {
    if (isSimulating) {
      const container = containerRef.current;
      const cW = container ? container.clientWidth : 750;
      const cH = container ? container.clientHeight : 450;

      const runTick = () => {
        setElements(prev => prev.map(el => {
          if (el.type === 'physics.ball') {
            const propsObj: BallProps = JSON.parse(el.props);
            
            let x = el.style.left;
            let y = el.style.top;
            let vx = propsObj.vx;
            let vy = propsObj.vy;
            const r = propsObj.radius;
            const gravity = propsObj.gravity;
            const restitution = propsObj.restitution;

            // Apply equations
            x += vx;
            y += vy;
            vy += gravity;

            // Wall collisions
            if (x < 0) {
              x = 0;
              vx = -vx * restitution;
            } else if (x + el.style.width > cW) {
              x = cW - el.style.width;
              vx = -vx * restitution;
            }

            if (y < 0) {
              y = 0;
              vy = -vy * restitution;
            } else if (y + el.style.height > cH) {
              y = cH - el.style.height;
              vy = -vy * restitution;
              // Friction on floor contact
              vx *= 0.98;
            }

            // Sync updated velocity back inside props
            const updatedProps = { ...propsObj, vx, vy };
            
            return {
              ...el,
              props: JSON.stringify(updatedProps),
              style: {
                ...el.style,
                left: x,
                top: y
              }
            };
          }
          return el;
        }));

        physicsTimerRef.current = requestAnimationFrame(runTick);
      };

      physicsTimerRef.current = requestAnimationFrame(runTick);
    } else {
      if (physicsTimerRef.current) {
        cancelAnimationFrame(physicsTimerRef.current);
      }
    }

    return () => {
      if (physicsTimerRef.current) cancelAnimationFrame(physicsTimerRef.current);
    };
  }, [isSimulating]);

  // SVG Export combining background and overlays
  const handleExportCanvas = () => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // Construct a giant combined SVG representing the entire whiteboard
    let compositeSvg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="background:#020617;">`;
    
    // Add grid lines
    compositeSvg += `<path d="M 0 0 L 0 0" stroke="#334155" stroke-opacity="0.1" />`;
    for (let x = 40; x < w; x += 40) {
      compositeSvg += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#1e293b" stroke-width="1" />`;
    }
    for (let y = 40; y < h; y += 40) {
      compositeSvg += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="#1e293b" stroke-width="1" />`;
    }

    // Add elements
    elements.forEach(el => {
      let elementSvgContent = '';
      const parsedProps = JSON.parse(el.props);

      if (el.type === 'physics.force-vector') {
        elementSvgContent = renderForceVectorSVG(parsedProps);
      } else if (el.type === 'physics.convex-lens') {
        elementSvgContent = renderConvexLensSVG(parsedProps);
      } else if (el.type === 'physics.ball') {
        elementSvgContent = renderBallSVG(parsedProps);
      }

      // Strip potential redundant XML declarations and wrap with translation coordinates
      const cleanSvg = elementSvgContent
        .replace(/<\?xml.*\?>/i, '')
        .replace(/<!DOCTYPE.*?>/i, '');

      compositeSvg += `<g transform="translate(${el.style.left}, ${el.style.top})">${cleanSvg}</g>`;
    });

    compositeSvg += `</svg>`;

    // Download combined SVG file offline
    const blob = new Blob([compositeSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whiteboard-lab-export-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Run unit tests
  const handleRunTests = () => {
    setTestStatus('running');
    setTestLogs(['Initialising suite...']);
    
    setTimeout(() => {
      const result = runEducationalIntegrationTests();
      setTestLogs(result.logs);
      setTestStatus(result.passed ? 'passed' : 'failed');
    }, 800);
  };

  // Render element SVG procedurally
  const getRenderedElementMarkup = (el: LocalElement) => {
    const parsedProps = JSON.parse(el.props);
    if (el.type === 'physics.force-vector') {
      return renderForceVectorSVG(parsedProps);
    } else if (el.type === 'physics.convex-lens') {
      return renderConvexLensSVG(parsedProps);
    } else if (el.type === 'physics.ball') {
      return renderBallSVG(parsedProps);
    }
    return '';
  };

  // Selected element properties definition
  const selectedElem = elements.find(el => el.id === selectedId);
  const selectedProps = selectedElem ? JSON.parse(selectedElem.props) : null;

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 animate-fade-in text-gray-100">
      
      {/* LEFT AREA: Lab Controls & Science Whiteboard Stage */}
      <div className="flex-1 flex flex-col space-y-4">
        
        {/* Whiteboard Toolbar Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Beaker className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {isAr ? 'مختبر الفيزياء والرموز التعليمية' : 'Whiteboard Physics & Education Lab'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'إدراج متجهات القوى، والعدسات البصرية، وكرات ميكانيكية ذات خصائص فيزيائية واقعية' : 'Create force arrows, optical lens arrays, and mechanical balls with real kinematics'}
              </p>
            </div>
          </div>

          {/* Quick Creator buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAddElement('physics.force-vector')}
              className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center space-x-1 rtl:space-x-reverse transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'متجه قوة (Force)' : 'Force Vector'}</span>
            </button>

            <button
              onClick={() => handleAddElement('physics.convex-lens')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center space-x-1 rtl:space-x-reverse transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'عدسة محدبة (Lens)' : 'Convex Lens'}</span>
            </button>

            <button
              onClick={() => handleAddElement('physics.ball')}
              className="px-3 py-1.5 rounded-lg bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-1 rtl:space-x-reverse transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'كرة ميكانيكية (Ball)' : 'Physics Ball'}</span>
            </button>
          </div>
        </div>

        {/* The Whiteboard Canvas Board Screen */}
        <div 
          ref={containerRef}
          id="whiteboard-canvas"
          className="relative w-full h-[480px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
          style={{
            backgroundImage: 'radial-gradient(#1e293b 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px'
          }}
          onClick={() => setSelectedId(null)}
        >
          {/* Overlays Container as required by user (#overlays) */}
          <div id="overlays" className="absolute inset-0 pointer-events-none">
            {elements.map((el) => (
              <div
                key={el.id}
                data-edu-type={el.type}
                data-edu-props={el.props}
                data-edu-id={el.id}
                schemaVersion="1.0.0"
                onMouseDown={(e) => handleElementMouseDown(e, el)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                className={`absolute pointer-events-auto cursor-grab active:cursor-grabbing select-none rounded-xl transition-shadow ${
                  selectedId === el.id 
                    ? 'ring-2 ring-indigo-500 bg-slate-900/20 shadow-lg shadow-indigo-500/10' 
                    : 'hover:ring-1 hover:ring-slate-700 hover:bg-slate-900/5'
                }`}
                style={{
                  left: el.style.left,
                  top: el.style.top,
                  width: el.style.width,
                  height: el.style.height,
                  transform: el.style.transform,
                }}
                dangerouslySetInnerHTML={{ __html: getRenderedElementMarkup(el) }}
              />
            ))}
          </div>

          {/* Empty state overlay inside board */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <Beaker className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-300">
                {isAr ? 'لوحة المختبر فارغة' : 'Physics whiteboard empty'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {isAr ? 'انقر فوق الأزرار الموجودة أعلاه لإدراج كائنات تعليمية وتجربتها في الوقت الفعلي' : 'Select force vector, optical lens, or a ball to place interactive elements on the board'}
              </p>
            </div>
          )}

          {/* Bottom Indicators & Toolbar */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); setIsSimulating(!isSimulating); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md ${
                  isSimulating 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isSimulating ? (isAr ? 'إيقاف الحركة' : 'Pause Physics') : (isAr ? 'تشغيل الحركة' : 'Simulate Physics')}</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                disabled={undoStack.length === 0}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 transition-all shadow-md"
                title={isAr ? 'تراجع' : 'Undo'}
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleRedo(); }}
                disabled={redoStack.length === 0}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 transition-all shadow-md"
                title={isAr ? 'إعادة' : 'Redo'}
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); handleExportCanvas(); }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md"
              >
                <FileDown className="w-4 h-4 text-blue-400" />
                <span>{isAr ? 'تصدير كـ SVG' : 'Export SVG'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Live Properties Editor & Testing Console */}
      <div className="w-full xl:w-80 shrink-0 flex flex-col space-y-6">
        
        {/* Section 1: Property Editor Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isAr ? 'محرر الخصائص الفيزيائية' : 'Property Editor'}
            </h5>
          </div>

          {selectedElem && selectedProps ? (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest">{selectedElem.type}</div>
                <div className="font-bold text-white truncate">{selectedElem.id}</div>
              </div>

              {/* 1. Force Vector Properties */}
              {selectedElem.type === 'physics.force-vector' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Force Magnitude (N)</label>
                    <input 
                      type="range" min="10" max="250" value={selectedProps.magnitude}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { magnitude: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-right text-blue-400 font-bold font-mono mt-0.5">{selectedProps.magnitude} N</div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Angle (Degrees)</label>
                    <input 
                      type="range" min="-180" max="180" value={selectedProps.angle}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { angle: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-right text-blue-400 font-bold font-mono mt-0.5">{selectedProps.angle}°</div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Label Text</label>
                    <input 
                      type="text" value={selectedProps.label}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { label: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-blue-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Vector Color</label>
                    <select 
                      value={selectedProps.color}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { color: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    >
                      <option value="#3b82f6">Ocean Blue</option>
                      <option value="#eab308">Warning Yellow</option>
                      <option value="#22c55e">Signal Green</option>
                      <option value="#ec4899">Premium Magenta</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 2. Convex Lens Properties */}
              {selectedElem.type === 'physics.convex-lens' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Focal Length (f)</label>
                    <input 
                      type="range" min="40" max="150" value={selectedProps.focalLength}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { focalLength: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-right text-blue-400 font-bold font-mono mt-0.5">{selectedProps.focalLength} px</div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Object Distance (u)</label>
                    <input 
                      type="range" min="50" max="300" value={selectedProps.objectDistance}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { objectDistance: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-right text-blue-400 font-bold font-mono mt-0.5">{selectedProps.objectDistance} px</div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Object Height (ho)</label>
                    <input 
                      type="range" min="10" max="90" value={selectedProps.objectHeight}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { objectHeight: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-right text-blue-400 font-bold font-mono mt-0.5">{selectedProps.objectHeight} px</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-slate-400">Render Optical Rays</label>
                    <input 
                      type="checkbox" checked={selectedProps.showRays}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { showRays: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {/* 3. Ball Properties */}
              {selectedElem.type === 'physics.ball' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Radius (px)</label>
                    <input 
                      type="range" min="20" max="50" value={selectedProps.radius}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { radius: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-right text-blue-400 font-bold font-mono mt-0.5">{selectedProps.radius} px</div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Mass (kg)</label>
                    <input 
                      type="range" min="1" max="25" value={selectedProps.mass}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { mass: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-right text-blue-400 font-bold font-mono mt-0.5">{selectedProps.mass} kg</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Velocity X</label>
                      <input 
                        type="number" step="0.5" value={selectedProps.vx}
                        onChange={(e) => handleUpdateProps(selectedElem.id, { vx: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">Velocity Y</label>
                      <input 
                        type="number" step="0.5" value={selectedProps.vy}
                        onChange={(e) => handleUpdateProps(selectedElem.id, { vy: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-800 text-white font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bounciness (Restitution)</label>
                    <input 
                      type="range" min="0" max="1" step="0.05" value={selectedProps.restitution}
                      onChange={(e) => handleUpdateProps(selectedElem.id, { restitution: Number(e.target.value) })}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-right text-blue-400 font-bold font-mono mt-0.5">{selectedProps.restitution}</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleDeleteElement(selectedElem.id)}
                className="w-full py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 font-semibold flex items-center justify-center space-x-1.5 transition-all mt-4"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? 'حذف العنصر' : 'Remove Object'}</span>
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              {isAr ? 'حدد أي عنصر باللوحة لتعديله' : 'Click any whiteboard object to load properties editor'}
            </div>
          )}
        </div>

        {/* Section 2: Automated Integration Testing Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Beaker className="w-4 h-4 text-emerald-400" />
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {isAr ? 'منصة الاختبار الذاتي' : 'Self-Test Console'}
              </h5>
            </div>

            <button
              onClick={handleRunTests}
              className="p-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 transition-all"
              title="Run Suite"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400">Suite Health:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                testStatus === 'passed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                testStatus === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                testStatus === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {testStatus === 'passed' ? 'PASSED ✅' :
                 testStatus === 'failed' ? 'FAILED ❌' :
                 testStatus === 'running' ? 'RUNNING...' : 'IDLE'}
              </span>
            </div>

            <div className="h-28 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[9px] text-slate-400 space-y-1 scrollbar-thin">
              {testLogs.length > 0 ? (
                testLogs.map((log, idx) => (
                  <div key={idx} className={log.includes('FAILED') ? 'text-rose-400' : log.includes('PASSED') ? 'text-emerald-400' : ''}>
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-center py-4">Click run to start integration test suite.</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
