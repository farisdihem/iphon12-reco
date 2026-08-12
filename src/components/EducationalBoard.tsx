// =========================================================================
// Science Whiteboard & Interactive Physics/Chemistry Educational Board
// File: src/components/EducationalBoard.tsx
// =========================================================================

import React, { useState, useRef, useEffect } from 'react';
import { 
  MoveUpRight, 
  Circle, 
  Triangle, 
  Square, 
  Type, 
  Calculator, 
  StickyNote, 
  Image as ImageIcon, 
  Atom, 
  FlaskConical, 
  Microscope, 
  Grid as GridIcon, 
  Compass, 
  Trash2, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  RotateCw, 
  Sliders, 
  Check, 
  ChevronDown, 
  Play, 
  Pause, 
  Download,
  Zap,
  Gauge,
  Activity,
  Lightbulb,
  ToggleLeft
} from 'lucide-react';

export type ElementType = 
  | 'mass-block'
  | 'velocity-car'
  | 'force-vector'
  | 'weight-vector'
  | 'dimension-line'
  | 'convex-lens'
  | 'mirror'
  | 'battery'
  | 'resistor'
  | 'switch'
  | 'lamp'
  | 'ammeter'
  | 'voltmeter'
  | 'flask'
  | 'shape-circle'
  | 'shape-triangle'
  | 'shape-rectangle'
  | 'text-label'
  | 'note';

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  value: number;
  unit: string;
  color: string;
  extraProps?: Record<string, any>;
}

const INITIAL_BOARD_ELEMENTS: BoardElement[] = [
  {
    id: 'elem-mass-1',
    type: 'mass-block',
    x: 160,
    y: 280,
    width: 140,
    height: 80,
    rotation: 0,
    label: 'm',
    value: 5,
    unit: 'kg',
    color: '#3b82f6',
  },
  {
    id: 'elem-weight-1',
    type: 'weight-vector',
    x: 205,
    y: 420,
    width: 20,
    height: 140,
    rotation: 0,
    label: 'W',
    value: 49,
    unit: 'N',
    color: '#f97316',
  },
  {
    id: 'elem-dim-1',
    type: 'dimension-line',
    x: 310,
    y: 535,
    width: 130,
    height: 30,
    rotation: 0,
    label: 'd',
    value: 10,
    unit: 'm',
    color: '#475569',
  },
  {
    id: 'elem-car-1',
    type: 'velocity-car',
    x: 410,
    y: 230,
    width: 90,
    height: 45,
    rotation: 0,
    label: 'v',
    value: 15,
    unit: 'm/s',
    color: '#22c55e',
  },
  {
    id: 'elem-force-1',
    type: 'force-vector',
    x: 460,
    y: 460,
    width: 120,
    height: 30,
    rotation: 0,
    label: 'F',
    value: 9.8,
    unit: 'N',
    color: '#ef4444',
    extraProps: { acceleration: 1.96 }
  },
  {
    id: 'elem-mass-2',
    type: 'mass-block',
    x: 530,
    y: 195,
    width: 110,
    height: 60,
    rotation: 0,
    label: 'm',
    value: 5,
    unit: 'kg',
    color: '#3b82f6',
  },
  {
    id: 'elem-lens-1',
    type: 'convex-lens',
    x: 700,
    y: 110,
    width: 80,
    height: 160,
    rotation: 0,
    label: 'عدسة',
    value: 10,
    unit: 'cm',
    color: '#2563eb',
    extraProps: { f1: 'F1', f2: 'F2' }
  },
  {
    id: 'elem-mirror-1',
    type: 'mirror',
    x: 810,
    y: 120,
    width: 10,
    height: 150,
    rotation: 0,
    label: 'مرآة',
    value: 0,
    unit: '',
    color: '#38bdf8',
  },
  {
    id: 'elem-battery-1',
    type: 'battery',
    x: 620,
    y: 295,
    width: 80,
    height: 50,
    rotation: 0,
    label: 'E',
    value: 12,
    unit: 'V',
    color: '#ef4444',
  },
  {
    id: 'elem-resistor-1',
    type: 'resistor',
    x: 620,
    y: 430,
    width: 90,
    height: 35,
    rotation: 0,
    label: 'R',
    value: 10,
    unit: 'Ω',
    color: '#f97316',
  },
  {
    id: 'elem-switch-1',
    type: 'switch',
    x: 625,
    y: 535,
    width: 90,
    height: 40,
    rotation: 0,
    label: 'K (مفتوح)',
    value: 0,
    unit: '',
    color: '#334155',
  },
  {
    id: 'elem-lamp-1',
    type: 'lamp',
    x: 635,
    y: 650,
    width: 70,
    height: 70,
    rotation: 0,
    label: 'L',
    value: 60,
    unit: 'W',
    color: '#eab308',
  },
  {
    id: 'elem-ammeter-1',
    type: 'ammeter',
    x: 755,
    y: 360,
    width: 55,
    height: 55,
    rotation: 0,
    label: 'I',
    value: 2,
    unit: 'A',
    color: '#0284c7',
  },
  {
    id: 'elem-voltmeter-1',
    type: 'voltmeter',
    x: 755,
    y: 465,
    width: 55,
    height: 55,
    rotation: 0,
    label: 'U',
    value: 12,
    unit: 'V',
    color: '#9333ea',
  },
];

export const EducationalBoard: React.FC<{ lang?: 'en' | 'ar' }> = ({ lang = 'ar' }) => {
  const isAr = lang === 'ar';
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [elements, setElements] = useState<BoardElement[]>(INITIAL_BOARD_ELEMENTS);
  const [selectedId, setSelectedId] = useState<string | null>('elem-mass-1');
  
  // Board customization settings
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dropdown menus
  const [openPhysicsMenu, setOpenPhysicsMenu] = useState(false);
  const [openChemMenu, setOpenChemMenu] = useState(false);
  const [openScienceMenu, setOpenScienceMenu] = useState(false);
  const [showAdvancedModalOptions, setShowAdvancedModalOptions] = useState(false);

  // Dragging state
  const [dragState, setDragState] = useState<{
    id: string;
    startX: number;
    startY: number;
    elemX: number;
    elemY: number;
  } | null>(null);

  const selectedElement = elements.find(el => el.id === selectedId);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const elem = elements.find(el => el.id === id);
    if (!elem) return;

    setDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      elemX: elem.x,
      elemY: elem.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    setElements(prev => prev.map(el => {
      if (el.id === dragState.id) {
        return {
          ...el,
          x: Math.max(20, dragState.elemX + dx),
          y: Math.max(20, dragState.elemY + dy)
        };
      }
      return el;
    }));
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  // Add Element Helper
  const addElement = (type: ElementType, customLabel?: string, defaultVal = 1) => {
    const newId = `elem-${Date.now()}`;
    const x = 300 + Math.random() * 100;
    const y = 200 + Math.random() * 100;

    const newElem: BoardElement = {
      id: newId,
      type,
      x,
      y,
      width: type === 'mass-block' ? 130 : type === 'convex-lens' ? 80 : 100,
      height: type === 'mass-block' ? 70 : type === 'convex-lens' ? 160 : 60,
      rotation: 0,
      label: customLabel || 'عنصر جديد',
      value: defaultVal,
      unit: type === 'mass-block' ? 'kg' : type === 'battery' ? 'V' : 'N',
      color: selectedColor,
    };

    setElements(prev => [...prev, newElem]);
    setSelectedId(newId);
    setOpenPhysicsMenu(false);
    setOpenChemMenu(false);
    setOpenScienceMenu(false);
  };

  // Delete Element
  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  // Clear Canvas
  const clearCanvas = () => {
    setElements([]);
    setSelectedId(null);
  };

  // Update selected element property
  const updateSelectedProp = (key: keyof BoardElement, val: any) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, [key]: val } : el));
  };

  return (
    <div className="relative w-full h-[85vh] min-h-[680px] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden font-sans select-none dir-rtl">
      
      {/* 1. Main Canvas Area with Subtitle Grid */}
      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full bg-[#fafbfc] overflow-auto cursor-crosshair"
        onClick={() => {
          setSelectedId(null);
          setOpenPhysicsMenu(false);
          setOpenChemMenu(false);
          setOpenScienceMenu(false);
        }}
        style={showGrid ? {
          backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px'
        } : {}}
      >
        {/* Optional X & Y Axes Overlay */}
        {showAxes && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 border-b-2 border-dashed border-blue-400/50" />
            <div className="absolute left-1/2 top-0 bottom-0 border-r-2 border-dashed border-blue-400/50" />
            <span className="absolute top-1/2 left-4 text-xs font-mono font-bold text-blue-500 -translate-y-6">X-Axis</span>
            <span className="absolute top-4 left-1/2 text-xs font-mono font-bold text-blue-500 translate-x-3">Y-Axis</span>
          </div>
        )}

        {/* Render Canvas Elements */}
        {elements.map(el => {
          const isSelected = selectedId === el.id;

          return (
            <div
              key={el.id}
              onMouseDown={(e) => handleMouseDown(e, el.id)}
              onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
              className={`absolute cursor-move transition-shadow ${
                isSelected ? 'ring-2 ring-blue-500 ring-dashed ring-offset-2 rounded-xl' : ''
              }`}
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                transform: `rotate(${el.rotation}deg)`,
              }}
            >
              {/* Selection Control Handles (Rotate & Resize & Delete) */}
              {isSelected && (
                <>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform">
                    <RotateCw className="w-3.5 h-3.5" />
                  </div>
                  <div 
                    onClick={(e) => { e.stopPropagation(); deleteSelected(); }}
                    className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform z-20"
                  >
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-md cursor-se-resize">
                    <MoveUpRight className="w-3 h-3" />
                  </div>
                </>
              )}

              {/* RENDER SPECIFIC PHYSICS & CIRCUIT SYMBOLS */}
              
              {/* 1. Physical Mass Block */}
              {el.type === 'mass-block' && (
                <div className="flex flex-col items-center">
                  <div className="w-36 h-20 rounded-2xl bg-blue-100 border-2 border-blue-500 flex items-center justify-center shadow-md">
                    <span className="text-xl font-bold text-blue-800 font-serif">{el.label}</span>
                  </div>
                  <span className="mt-1.5 text-xs font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                    {el.label} = {el.value} {el.unit}
                  </span>
                </div>
              )}

              {/* 2. Velocity Car */}
              {el.type === 'velocity-car' && (
                <div className="flex flex-col items-center">
                  <div className="relative px-3 py-1 bg-emerald-500 border-2 border-emerald-600 rounded-lg text-white font-mono text-xs font-bold flex items-center justify-between gap-3 shadow-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                    <span>{el.label} = {el.value} {el.unit}</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  </div>
                  <div className="w-full border-t-2 border-dashed border-emerald-500 -mt-1" />
                </div>
              )}

              {/* 3. Convex Lens */}
              {el.type === 'convex-lens' && (
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-36 border-y-2 border-x-4 border-blue-500 rounded-[50%] bg-blue-100/40 backdrop-blur-xs flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-blue-700"></span>
                  </div>
                  <div className="absolute w-44 border-t border-dashed border-blue-400 pointer-events-none" />
                  <span className="absolute -left-10 text-[11px] font-bold text-blue-600">F₁ •</span>
                  <span className="absolute -right-10 text-[11px] font-bold text-blue-600">• F₂</span>
                </div>
              )}

              {/* 4. Mirror */}
              {el.type === 'mirror' && (
                <div className="w-3 h-36 bg-sky-400 border border-sky-600 rounded-xs relative">
                  <div className="absolute inset-y-0 right-0 w-1 bg-slate-400 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 0, transparent 4px)' }} />
                </div>
              )}

              {/* 5. Battery DC Cell */}
              {el.type === 'battery' && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-red-500">+</span>
                    <div className="w-1 h-8 bg-red-500 rounded-full" />
                    <div className="w-2.5 h-12 bg-slate-800 rounded-sm" />
                    <div className="w-1 h-8 bg-blue-500 rounded-full" />
                    <span className="text-xs font-bold text-blue-500">-</span>
                  </div>
                  <span className="mt-1 text-xs font-bold text-red-600">
                    {el.label} = {el.value} {el.unit}
                  </span>
                </div>
              )}

              {/* 6. Resistor */}
              {el.type === 'resistor' && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center">
                    <div className="w-4 h-0.5 bg-slate-700" />
                    <div className="w-20 h-7 rounded-md bg-amber-100 border-2 border-amber-600 flex items-center justify-center font-bold text-xs text-amber-900 shadow-sm">
                      {el.label}
                    </div>
                    <div className="w-4 h-0.5 bg-slate-700" />
                  </div>
                  <span className="mt-1 text-xs font-bold text-slate-700">
                    {el.unit} {el.value}
                  </span>
                </div>
              )}

              {/* 7. Switch */}
              {el.type === 'switch' && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-slate-800" />
                    <div className="w-2 h-2 rounded-full bg-slate-900" />
                    <div className="w-12 h-0.5 bg-slate-800 -rotate-25 transform origin-left" />
                    <div className="w-2 h-2 rounded-full bg-slate-900" />
                    <div className="w-4 h-0.5 bg-slate-800" />
                  </div>
                  <span className="mt-1 text-xs font-bold text-slate-700">
                    {el.label}
                  </span>
                </div>
              )}

              {/* 8. Lamp / Lightbulb */}
              {el.type === 'lamp' && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-slate-800" />
                    <div className="w-12 h-12 rounded-full bg-yellow-200 border-2 border-yellow-500 flex items-center justify-center text-yellow-800 font-bold text-base shadow-md">
                      ✕
                    </div>
                    <div className="w-3 h-0.5 bg-slate-800" />
                  </div>
                  <span className="mt-1 text-xs font-bold text-slate-700">
                    {el.label} = {el.value} {el.unit}
                  </span>
                </div>
              )}

              {/* 9. Ammeter */}
              {el.type === 'ammeter' && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-slate-800" />
                    <div className="w-11 h-11 rounded-full bg-sky-100 border-2 border-sky-600 flex items-center justify-center text-sky-800 font-bold text-base shadow-sm">
                      A
                    </div>
                    <div className="w-3 h-0.5 bg-slate-800" />
                  </div>
                  <span className="mt-1 text-xs font-bold text-slate-700">
                    {el.label} = {el.value} {el.unit}
                  </span>
                </div>
              )}

              {/* 10. Voltmeter */}
              {el.type === 'voltmeter' && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center">
                    <div className="w-3 h-0.5 bg-slate-800" />
                    <div className="w-11 h-11 rounded-full bg-purple-100 border-2 border-purple-600 flex items-center justify-center text-purple-800 font-bold text-base shadow-sm">
                      V
                    </div>
                    <div className="w-3 h-0.5 bg-slate-800" />
                  </div>
                  <span className="mt-1 text-xs font-bold text-slate-700">
                    {el.label} = {el.value} {el.unit}
                  </span>
                </div>
              )}

              {/* 11. Force Vector Arrow */}
              {el.type === 'force-vector' && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-28 h-1 bg-red-500 relative flex items-center justify-end">
                      <div className="w-0 h-0 border-y-6 border-y-transparent border-l-10 border-l-red-600 -mr-1" />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs font-bold text-purple-700">
                    <span>a = {el.extraProps?.acceleration || 1.96} m/s²</span>
                    <span className="text-red-600">{el.label} = {el.value} {el.unit}</span>
                  </div>
                </div>
              )}

              {/* 12. Weight Vector Arrow */}
              {el.type === 'weight-vector' && (
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <div className="w-1 h-24 bg-orange-500 relative flex flex-col justify-end items-center">
                    <div className="w-0 h-0 border-x-6 border-x-transparent border-t-10 border-t-orange-600 -mb-1" />
                  </div>
                  <span className="mt-1 text-xs font-bold text-orange-600">
                    {el.label} = {el.value} {el.unit}
                  </span>
                </div>
              )}

              {/* 13. Dimension Line */}
              {el.type === 'dimension-line' && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center w-36">
                    <div className="w-0.5 h-4 bg-slate-600" />
                    <div className="flex-1 h-0.5 bg-slate-600" />
                    <span className="px-2 text-xs font-bold text-slate-700">
                      {el.label} = {el.value} {el.unit}
                    </span>
                    <div className="flex-1 h-0.5 bg-slate-600" />
                    <div className="w-0.5 h-4 bg-slate-600" />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 2. Floating Property Popover Card for Selected Element */}
        {selectedElement && (
          <div 
            className="absolute z-40 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-2xl w-72 animate-fade-in"
            style={{
              left: `${Math.min(window.innerWidth - 320, selectedElement.x + 160)}px`,
              top: `${Math.max(20, selectedElement.y - 10)}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="text-xs font-bold text-slate-800">
                  {selectedElement.type === 'mass-block' ? 'كتلة فيزيائية' : selectedElement.label}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center gap-1">
                <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                <span>{selectedElement.unit}</span>
              </div>
              <input 
                type="number"
                value={selectedElement.value}
                onChange={(e) => updateSelectedProp('value', parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-blue-600 font-serif">m</span>
            </div>

            {/* Quick Values */}
            <div className="flex items-center justify-between gap-1 mb-3">
              <span className="text-[11px] font-bold text-slate-400">قيم سريعة:</span>
              <div className="flex gap-1">
                {[1, 5, 10, 50].map(val => (
                  <button
                    key={val}
                    onClick={() => updateSelectedProp('value', val)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      selectedElement.value === val 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {val} kg
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options Accordion */}
            <div className="border-t border-slate-100 pt-2">
              <button 
                onClick={() => setShowAdvancedModalOptions(!showAdvancedModalOptions)}
                className="w-full text-right text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-between"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedModalOptions ? 'rotate-180' : ''}`} />
                <span>خيارات متقدمة</span>
              </button>

              {showAdvancedModalOptions && (
                <div className="mt-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">اسم المتغير:</span>
                    <input 
                      type="text" 
                      value={selectedElement.label} 
                      onChange={(e) => updateSelectedProp('label', e.target.value)}
                      className="w-24 px-2 py-1 rounded border border-slate-200 text-left font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">زاوية الدوران:</span>
                    <input 
                      type="number" 
                      value={selectedElement.rotation} 
                      onChange={(e) => updateSelectedProp('rotation', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 rounded border border-slate-200 text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Floating Vertical Toolbar on the Right (Exactly like Screenshot) */}
      <div className="absolute top-4 right-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-2.5 shadow-xl flex flex-col items-center gap-2.5 w-20 text-slate-700 text-[11px] font-bold">
        {/* Tool Items */}
        <button 
          onClick={() => addElement('force-vector', 'سهم')}
          className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <MoveUpRight className="w-4 h-4 text-slate-600" />
          <span>سهم</span>
        </button>

        <button 
          onClick={() => addElement('lamp', 'دائرة')}
          className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <Circle className="w-4 h-4 text-slate-600" />
          <span>دائرة</span>
        </button>

        <button 
          onClick={() => addElement('shape-triangle', 'مثلث')}
          className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <Triangle className="w-4 h-4 text-slate-600" />
          <span>مثلث</span>
        </button>

        <button 
          onClick={() => addElement('mass-block', 'مستطيل')}
          className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <Square className="w-4 h-4 text-slate-600" />
          <span>مستطيل</span>
        </button>

        <button 
          onClick={() => addElement('text-label', 'نص')}
          className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <Type className="w-4 h-4 text-slate-600" />
          <span>نص</span>
        </button>

        <button 
          onClick={() => addElement('dimension-line', 'رياضيات')}
          className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <Calculator className="w-4 h-4 text-slate-600" />
          <span>رياضيات</span>
        </button>

        <button 
          onClick={() => addElement('note', 'ملاحظة')}
          className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <StickyNote className="w-4 h-4 text-slate-600" />
          <span>ملاحظة</span>
        </button>

        <button 
          onClick={() => addElement('convex-lens', 'صورة')}
          className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
        >
          <ImageIcon className="w-4 h-4 text-slate-600" />
          <span>صورة</span>
        </button>

        {/* Physics Dropdown */}
        <div className="relative w-full">
          <button 
            onClick={(e) => { e.stopPropagation(); setOpenPhysicsMenu(!openPhysicsMenu); setOpenChemMenu(false); }}
            className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-blue-50 text-blue-700 transition-colors"
          >
            <Atom className="w-4 h-4 text-blue-600" />
            <span className="flex items-center gap-0.5">فيزياء <ChevronDown className="w-2.5 h-2.5" /></span>
          </button>

          {openPhysicsMenu && (
            <div className="absolute right-full top-0 ml-2 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 text-right space-y-1">
              <button onClick={() => addElement('mass-block', 'm', 5)} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">كتلة فيزيائية (Mass)</button>
              <button onClick={() => addElement('velocity-car', 'v', 15)} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">سيارة وسرعة (Vehicle)</button>
              <button onClick={() => addElement('convex-lens', 'عدسة')} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">عدسة مقعرة/محدبة</button>
              <button onClick={() => addElement('mirror', 'مرآة')} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">مرآة عاكسة</button>
              <button onClick={() => addElement('battery', 'E', 12)} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">بطارية DC Cell</button>
              <button onClick={() => addElement('resistor', 'R', 10)} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">مقاومة R</button>
              <button onClick={() => addElement('ammeter', 'I', 2)} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">أمبير متر (Ammeter)</button>
              <button onClick={() => addElement('voltmeter', 'U', 12)} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">فولت متر (Voltmeter)</button>
              <button onClick={() => addElement('switch', 'K')} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">قاطع / مفتاح</button>
              <button onClick={() => addElement('lamp', 'L', 60)} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 rounded-lg">مصباح كهربائي</button>
            </div>
          )}
        </div>

        {/* Chemistry Dropdown */}
        <div className="relative w-full">
          <button 
            onClick={(e) => { e.stopPropagation(); setOpenChemMenu(!openChemMenu); setOpenPhysicsMenu(false); }}
            className="w-full py-1.5 flex flex-col items-center gap-1 rounded-xl hover:bg-emerald-50 text-emerald-700 transition-colors"
          >
            <FlaskConical className="w-4 h-4 text-emerald-600" />
            <span className="flex items-center gap-0.5">كيمياء <ChevronDown className="w-2.5 h-2.5" /></span>
          </button>

          {openChemMenu && (
            <div className="absolute right-full top-0 ml-2 w-40 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 text-right space-y-1">
              <button onClick={() => addElement('flask', 'دورق معمل')} className="w-full text-right px-3 py-1.5 text-xs hover:bg-emerald-50 text-slate-700 rounded-lg">كأس / دورق</button>
              <button onClick={() => addElement('shape-circle', 'جزيء H2O')} className="w-full text-right px-3 py-1.5 text-xs hover:bg-emerald-50 text-slate-700 rounded-lg">جزيء H₂O</button>
            </div>
          )}
        </div>

        <div className="w-full border-t border-slate-200 my-1" />

        {/* Color Palette */}
        <div className="flex flex-col gap-1.5 items-center">
          {['#000000', '#2563eb', '#ef4444', '#22c55e', '#a855f7'].map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-5 h-5 rounded-full transition-transform ${
                selectedColor === color ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <span className="text-[9px] text-slate-400 mt-0.5">مخصص</span>
        </div>

        {/* Stroke thickness slider */}
        <div className="w-full flex flex-col items-center gap-0.5 mt-1">
          <span className="text-[10px] text-slate-500">السمك {strokeWidth}</span>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={strokeWidth} 
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-12 h-1 accent-blue-600 cursor-pointer"
          />
        </div>

        <div className="w-full border-t border-slate-200 my-1" />

        {/* Toggles: Grid & Axes */}
        <button 
          onClick={() => setShowGrid(!showGrid)}
          className={`w-full py-1.5 flex flex-col items-center gap-1 rounded-xl transition-colors ${
            showGrid ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <GridIcon className="w-4 h-4" />
          <span>شبكة</span>
        </button>

        <button 
          onClick={() => setShowAxes(!showAxes)}
          className={`w-full py-1.5 flex flex-col items-center gap-1 rounded-xl transition-colors ${
            showAxes ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>محاور</span>
        </button>
      </div>

      {/* 4. Floating Pagination / Action Bar at Bottom Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full shadow-xl flex items-center gap-4 text-slate-700">
        <button 
          onClick={deleteSelected}
          disabled={!selectedId}
          className="text-red-500 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 disabled:opacity-30 transition-all"
          title="حذف العنصر المحدد"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <div className="w-px h-5 bg-slate-200" />

        <button 
          onClick={() => addElement('mass-block', 'كتلة', 5)}
          className="text-blue-600 hover:text-blue-700 p-1.5 rounded-full hover:bg-blue-50 transition-all"
          title="إضافة عنصر جديد"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="w-px h-5 bg-slate-200" />

        {/* Page Switcher */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 font-mono">
          <button 
            onClick={() => setActivePage(p => Math.max(1, p - 1))}
            className="p-1 hover:bg-slate-100 rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>{activePage} / {totalPages}</span>
          <button 
            onClick={() => {
              setTotalPages(p => p + 1);
              setActivePage(p => p + 1);
            }}
            className="p-1 hover:bg-slate-100 rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationalBoard;
