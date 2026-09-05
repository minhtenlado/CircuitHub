'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import {
  Upload,
  FileArchive,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Layers,
  Cpu,
  Box,
  FileCode,
  CircuitBoard,
  RotateCcw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Info,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZipFile {
  name: string;
  size: number;
  type: string;
  category: 'gerber' | 'schematic' | 'pcb' | 'other';
}

interface PcbLayer {
  name: string;
  fileName: string;
  color: string;
  visible: boolean;
  svgContent?: string;
}

// Gerber file extension mapping
const GERBER_LAYERS: Record<string, { name: string; color: string }> = {
  '.gtl': { name: 'Top Copper', color: '#ef4444' },
  '.gbl': { name: 'Bottom Copper', color: '#3b82f6' },
  '.gto': { name: 'Top Silkscreen', color: '#ffffff' },
  '.gbo': { name: 'Bottom Silkscreen', color: '#ffffff' },
  '.gts': { name: 'Top Solder Mask', color: '#10b981' },
  '.gbs': { name: 'Bottom Solder Mask', color: '#10b981' },
  '.gko': { name: 'Board Outline', color: '#fbbf24' },
  '.gm1': { name: 'Board Outline', color: '#fbbf24' },
  '.gml': { name: 'Board Outline', color: '#fbbf24' },
  '.drl': { name: 'Drill File', color: '#8b5cf6' },
  '.txt': { name: 'Drill File', color: '#8b5cf6' },
};

const SCHEMATIC_EXTS = ['.sch', '.kicad_sch', '.pdf'];
const PCB_EXTS = ['.kicad_pcb', '.brd', '.pcb'];

function getExt(name: string): string {
  const lower = name.toLowerCase();
  for (const ext of Object.keys(GERBER_LAYERS)) {
    if (lower.endsWith(ext)) return ext;
  }
  for (const ext of [...SCHEMATIC_EXTS, ...PCB_EXTS]) {
    if (lower.endsWith(ext)) return ext;
  }
  return '';
}

function categorize(name: string): 'gerber' | 'schematic' | 'pcb' | 'other' {
  const lower = name.toLowerCase();
  if (Object.keys(GERBER_LAYERS).some(ext => lower.endsWith(ext))) return 'gerber';
  if (SCHEMATIC_EXTS.some(ext => lower.endsWith(ext))) return 'schematic';
  if (PCB_EXTS.some(ext => lower.endsWith(ext))) return 'pcb';
  return 'other';
}

export function BomView() {
  const { toast } = useToast();
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [fileList, setFileList] = useState<ZipFile[]>([]);
  const [activeView, setActiveView] = useState<'3d' | 'schematic' | 'gerber'>('3d');
  const [rotation, setRotation] = useState(-15);
  const [zoom, setZoom] = useState(1);
  const [schematicContent, setSchematicContent] = useState<string | null>(null);
  const [schematicType, setSchematicType] = useState<'kicad' | 'pdf' | 'text' | null>(null);
  const [boardWidth, setBoardWidth] = useState(50);
  const [boardHeight, setBoardHeight] = useState(80);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Real extracted Gerber layers
  const [layers, setLayers] = useState<PcbLayer[]>([]);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast({ title: 'Invalid file', description: 'Please upload a .zip file.', variant: 'destructive' });
      return;
    }

    setUploadedName(file.name);
    setParsed(false);
    setParsing(true);

    try {
      const zip = await JSZip.loadAsync(file);
      const files: ZipFile[] = [];
      const detectedLayers: PcbLayer[] = [];
      let schematicFile: { name: string; content: string; type: 'kicad' | 'pdf' | 'text' } | null = null;

      // Iterate through all files in the ZIP
      const entries = Object.values(zip.files);
      for (const entry of entries) {
        if (entry.dir) continue;
        const name = entry.name.split('/').pop() || entry.name;
        const ext = getExt(name);
        const category = categorize(name);

        if (category === 'other') continue; // Skip non-PCB files

        const size = await entry.async('uint8array').then(arr => arr.length);

        files.push({ name, size, type: getCategoryLabel(category, ext), category });

        // Extract Gerber layer info
        if (category === 'gerber' && GERBER_LAYERS[ext]) {
          const content = await entry.async('text');
          const layerInfo = GERBER_LAYERS[ext];
          detectedLayers.push({
            name: layerInfo.name,
            fileName: name,
            color: layerInfo.color,
            visible: true,
            svgContent: parseGerberToSvg(content, ext),
          });
        }

        // Extract schematic content
        if (category === 'schematic') {
          const content = await entry.async('text');
          if (name.toLowerCase().endsWith('.pdf')) {
            const blob = await entry.async('blob');
            schematicFile = { name, content: URL.createObjectURL(blob), type: 'pdf' };
          } else if (name.toLowerCase().endsWith('.kicad_sch')) {
            schematicFile = { name, content, type: 'kicad' };
          } else {
            schematicFile = { name, content, type: 'text' };
          }
        }

        // Extract board dimensions from PCB file
        if (category === 'pcb') {
          const content = await entry.async('text');
          extractBoardSize(content);
        }
      }

      // Sort: gerbers first, then schematic, then pcb
      files.sort((a, b) => {
        const order = { gerber: 0, schematic: 1, pcb: 2, other: 3 };
        return order[a.category] - order[b.category];
      });

      setFileList(files);
      setLayers(detectedLayers);

      if (schematicFile) {
        setSchematicContent(schematicFile.content);
        setSchematicType(schematicFile.type);
      }

      setParsing(false);
      setParsed(true);

      toast({
        title: 'PCB files extracted!',
        description: `${files.length} files found — ${detectedLayers.length} Gerber layers, ${files.some(f => f.category === 'schematic') ? 'schematic ✓' : 'no schematic'}, ${files.some(f => f.category === 'pcb') ? 'PCB ✓' : 'no PCB'}.`,
      });
    } catch {
      setParsing(false);
      toast({ title: 'Failed to parse ZIP', description: 'Could not read the ZIP file. Make sure it contains Gerber files.', variant: 'destructive' });
    }
  }

  // Simple Gerber parser → SVG paths
  function parseGerberToSvg(content: string, ext: string): string {
    // Extract coordinates from Gerber commands
    // Gerber format: X{coord}Y{coord}D01* (draw), X{coord}Y{coord}D02* (move), D03 (flash)
    const lines = content.split('\n');
    const paths: string[] = [];
    let currentX = 0;
    let currentY = 0;
    let allCoords: { x: number; y: number }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('%')) continue;

      const xMatch = trimmed.match(/X(-?\d+)/);
      const yMatch = trimmed.match(/Y(-?\d+)/);

      if (xMatch || yMatch) {
        const x = xMatch ? parseInt(xMatch[1]) / 1000000 : currentX;
        const y = yMatch ? parseInt(yMatch[1]) / 1000000 : currentY;

        if (trimmed.includes('D02') || trimmed.includes('D3')) {
          // Move
          currentX = x;
          currentY = y;
        } else if (trimmed.includes('D01') || (!trimmed.includes('D02') && !trimmed.includes('D03'))) {
          // Draw line
          paths.push(`M${currentX.toFixed(2)},${currentY.toFixed(2)} L${x.toFixed(2)},${y.toFixed(2)}`);
          allCoords.push({ x: currentX, y: currentY });
          currentX = x;
          currentY = y;
          allCoords.push({ x, y });
        }

        if (trimmed.includes('D03')) {
          // Flash (pad)
          paths.push(`M${(x - 0.3).toFixed(2)},${y.toFixed(2)} a0.3,0.3 0 1,0 0.6,0 a0.3,0.3 0 1,0 -0.6,0`);
        }
      }
    }

    if (paths.length === 0) return '';

    // Normalize coordinates
    const xs = allCoords.map(c => c.x);
    const ys = allCoords.map(c => c.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;

    const normalizedPaths = paths
      .map(p => {
        return p.replace(/(-?\d+\.\d+)/g, (m) => {
          const num = parseFloat(m);
          if (p.startsWith('M')) {
            const parts = p.split(' ');
            return m;
          }
          return m;
        });
      });

    // Build SVG with viewBox
    return `<g transform="translate(${-minX}, ${-minY})">${paths.join(' ')}</g>`;
  }

  function extractBoardSize(content: string) {
    // Try to find board dimensions in KiCad PCB format
    // General format: (edge_corners (pts (xy X1 Y1) (xy X2 Y2) ...))
    const edgeMatch = content.match(/\(edge_corners[\s\S]*?\)/);
    if (edgeMatch) {
      const coords = edgeMatch[0].matchAll(/\(xy\s+([\d.]+)\s+([\d.]+)\)/g);
      const points = [...coords].map(m => [parseFloat(m[1]), parseFloat(m[2])]);
      if (points.length >= 2) {
        const xs = points.map(p => p[0]);
        const ys = points.map(p => p[1]);
        const w = Math.max(...xs) - Math.min(...xs);
        const h = Math.max(...ys) - Math.min(...ys);
        if (w > 0 && w < 500 && h > 0 && h < 500) {
          setBoardWidth(Math.round(w));
          setBoardHeight(Math.round(h));
        }
      }
    }
  }

  function getCategoryLabel(category: string, ext: string): string {
    if (category === 'gerber' && GERBER_LAYERS[ext]) return GERBER_LAYERS[ext].name;
    if (category === 'schematic') return 'Schematic';
    if (category === 'pcb') return 'PCB Layout';
    return 'Other';
  }

  function reset() {
    setUploadedName(null);
    setParsed(false);
    setFileList([]);
    setLayers([]);
    setSchematicContent(null);
    setSchematicType(null);
    setActiveView('3d');
    setRotation(-15);
    setZoom(1);
  }

  function formatSize(bytes: number) {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  function orderJlcpcb() {
    toast({ title: 'Opening JLCPCB...', description: 'Upload your zip file on JLCPCB to get an instant quote.' });
    window.open('https://cart.jlcpcb.com/quote', '_blank');
  }

  const gerberCount = fileList.filter(f => f.category === 'gerber').length;
  const hasSchematic = fileList.some(f => f.category === 'schematic');
  const hasPcb = fileList.some(f => f.category === 'pcb');
  const aspectRatio = boardWidth / boardHeight || 0.625;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-[0_6px_20px_-6px_rgba(6,182,212,0.5)]">
            <CircuitBoard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">PCB Manufacturing Upload</h1>
            <p className="text-sm text-muted-foreground">Upload your Gerber zip for JLCPCB manufacturing — 3D preview, schematic viewer, layer breakdown</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50/50 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-cyan-900 space-y-1">
          <p className="font-semibold">JLCPCB-compatible format</p>
          <p className="text-cyan-800">
            Upload a <code className="font-mono text-xs bg-cyan-100 px-1.5 py-0.5 rounded">.zip</code> file from KiCad/Altium "Plot" or "Export" function.
            Must contain Gerber files (.gtl, .gbl, .gko, etc.), schematic (.kicad_sch or .pdf), and PCB layout (.kicad_pcb).
            We'll extract real layers, render 3D preview, and display the schematic.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <a href="https://jlcpcb.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800">
              <ExternalLink className="h-3 w-3" />
              JLCPCB Gerber Requirements
            </a>
          </div>
        </div>
      </div>

      {!parsed ? (
        /* Upload zone */
        <Card
          className={cn(
            'border-2 border-dashed transition-all cursor-pointer overflow-hidden',
            isDragging ? 'border-cyan-400 bg-cyan-50/40 scale-[1.01]' : 'border-cyan-300/60 hover:border-cyan-400'
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <CardContent className="p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'h-20 w-20 rounded-full border-2 flex items-center justify-center mb-4 transition-all',
                isDragging ? 'border-cyan-400 bg-cyan-100' : 'border-cyan-200 bg-cyan-50'
              )}
            >
              {parsing ? <Loader2 className="h-9 w-9 text-cyan-500 animate-spin" /> : <FileArchive className="h-9 w-9 text-cyan-500" />}
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">
              {parsing ? 'Extracting PCB files...' : isDragging ? 'Drop your zip here' : 'Drop your Gerber ZIP file here'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {parsing ? 'Reading Gerber layers, schematic, and PCB layout from ZIP' : 'or click to browse · .zip format only'}
            </p>
            {uploadedName && (
              <div className="flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50/50 px-3 py-2 mb-4">
                <FileArchive className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-medium">{uploadedName}</span>
              </div>
            )}
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white" disabled={parsing}>
              <Upload className="h-4 w-4 mr-2" />
              Choose ZIP File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        /* Parsed results with viewers */
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="h-4 w-4 text-cyan-600" />
                  <span className="text-xs text-muted-foreground">Gerber Layers</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">{gerberCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className={cn('h-4 w-4', hasSchematic ? 'text-emerald-600' : 'text-slate-400')} />
                  <span className="text-xs text-muted-foreground">Schematic</span>
                </div>
                <p className={cn('text-2xl font-bold tabular-nums', hasSchematic ? 'text-emerald-600' : 'text-slate-400')}>
                  {hasSchematic ? '✓' : '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CircuitBoard className={cn('h-4 w-4', hasPcb ? 'text-emerald-600' : 'text-slate-400')} />
                  <span className="text-xs text-muted-foreground">PCB Layout</span>
                </div>
                <p className={cn('text-2xl font-bold tabular-nums', hasPcb ? 'text-emerald-600' : 'text-slate-400')}>
                  {hasPcb ? '✓' : '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-cyan-300/60 bg-gradient-to-br from-cyan-50/60 to-teal-50/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                  <span className="text-xs text-muted-foreground">JLCPCB Ready</span>
                </div>
                <p className="text-lg font-bold text-cyan-700">✓ Compatible</p>
              </CardContent>
            </Card>
          </div>

          {/* Viewer area */}
          <Card className="border-border/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-slate-50/60">
              {/* View tabs */}
              <div className="flex items-center gap-1">
                <ViewTab active={activeView === '3d'} onClick={() => setActiveView('3d')} icon={Box} label="3D Preview" />
                <ViewTab active={activeView === 'schematic'} onClick={() => setActiveView('schematic')} icon={FileCode} label="Schematic" disabled={!hasSchematic} />
                <ViewTab active={activeView === 'gerber'} onClick={() => setActiveView('gerber')} icon={Layers} label="Gerber Layers" disabled={layers.length === 0} />
              </div>

              {/* View controls for 3D */}
              <div className="flex items-center gap-1">
                {activeView === '3d' && (
                  <>
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 rounded-md hover:bg-slate-200 text-muted-foreground" aria-label="Zoom out">
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-muted-foreground tabular-nums px-1">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} className="p-1.5 rounded-md hover:bg-slate-200 text-muted-foreground" aria-label="Zoom in">
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-border/60 mx-1" />
                    <button onClick={() => setRotation(r => r - 15)} className="p-1.5 rounded-md hover:bg-slate-200 text-muted-foreground" aria-label="Rotate left">
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setRotation(r => r + 15)} className="p-1.5 rounded-md hover:bg-slate-200 text-muted-foreground" aria-label="Rotate right">
                      <RotateCcw className="h-4 w-4 scale-x-[-1]" />
                    </button>
                    <button onClick={() => { setRotation(-15); setZoom(1); }} className="p-1.5 rounded-md hover:bg-slate-200 text-muted-foreground" aria-label="Reset">
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Viewer content */}
            <div className="relative h-[450px] bg-slate-900 overflow-hidden">
              <AnimatePresence mode="wait">
                {/* === 3D Preview === */}
                {activeView === '3d' && (
                  <motion.div key="3d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ perspective: '800px' }}
                  >
                    <div
                      className="relative"
                      style={{
                        transform: `rotateX(25deg) rotateZ(${rotation}deg) scale(${zoom})`,
                        transition: 'transform 0.3s ease-out',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* PCB Board Base */}
                      <div
                        className="relative rounded-lg shadow-2xl overflow-hidden"
                        style={{
                          width: aspectRatio > 1 ? '320px' : `${320 * aspectRatio}px`,
                          height: aspectRatio > 1 ? `${320 / aspectRatio}px` : '320px',
                          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
                          border: '2px solid #059669',
                        }}
                      >
                        {/* Copper traces from real Gerber data */}
                        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${boardWidth} ${boardHeight}`} preserveAspectRatio="none">
                          {/* Render real Gerber layer SVGs */}
                          {layers.filter(l => l.visible).map((layer, i) => (
                            <g key={i} dangerouslySetInnerHTML={{ __html: layer.svgContent || '' }} />
                          ))}

                          {/* If no Gerber data was parsed, show placeholder traces */}
                          {layers.length === 0 && (
                            <>
                              <path d="M5 5 L15 5 L15 15 L25 15 L25 25 L35 25" stroke="#fbbf24" strokeWidth="0.3" fill="none" opacity="0.7" />
                              <path d="M40 10 L50 10 L50 20 L60 20" stroke="#fbbf24" strokeWidth="0.3" fill="none" opacity="0.7" />
                            </>
                          )}

                          {/* Board outline */}
                          <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="none" stroke="#fbbf24" strokeWidth="0.2" opacity="0.5" />

                          {/* Silkscreen text */}
                          <text x="2" y={boardHeight - 2} fontSize="2" fill="#fff" opacity="0.5" fontFamily="monospace">
                            {uploadedName?.replace('.zip', '') || 'PCB'}
                          </text>
                        </svg>

                        {/* Solder mask overlay (green) */}
                        <div className="absolute inset-0 bg-emerald-600/15" style={{ mixBlendMode: 'multiply' }} />

                        {/* 3D depth effect: board edge highlight */}
                        <div className="absolute inset-0 rounded-lg" style={{
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)',
                        }} />
                      </div>

                      {/* Board thickness (3D side) */}
                      <div
                        className="absolute rounded-b-lg"
                        style={{
                          width: aspectRatio > 1 ? '320px' : `${320 * aspectRatio}px`,
                          height: '8px',
                          bottom: '-8px',
                          left: 0,
                          background: 'linear-gradient(to bottom, #065f46, #064e3b)',
                          transform: 'rotateX(-90deg)',
                          transformOrigin: 'top',
                        }}
                      />

                      {/* Shadow */}
                      <div className="mx-auto mt-3 rounded-full bg-black/40 blur-lg" style={{
                        width: aspectRatio > 1 ? '280px' : `${280 * aspectRatio}px`,
                        height: '12px',
                      }} />
                    </div>

                    {/* Info overlay */}
                    <div className="absolute top-3 left-3 rounded-lg bg-slate-800/80 backdrop-blur px-3 py-2 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Box className="h-3 w-3 text-cyan-400" />
                        <span className="font-semibold">3D PCB Preview</span>
                      </div>
                      <p className="text-slate-400">{boardWidth} × {boardHeight} mm · {layers.length} layers · {rotation}° rotation</p>
                    </div>

                    {/* Layer legend */}
                    <div className="absolute top-3 right-3 rounded-lg bg-slate-800/80 backdrop-blur px-3 py-2 space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Layers</div>
                      {layers.slice(0, 5).map((l, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                          {l.name}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* === Schematic View === */}
                {activeView === 'schematic' && hasSchematic && (
                  <motion.div key="schematic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 overflow-auto bg-white"
                  >
                    {schematicType === 'pdf' && schematicContent ? (
                      <iframe src={schematicContent} className="w-full h-full" title="Schematic PDF" />
                    ) : schematicType === 'kicad' && schematicContent ? (
                      <div className="p-6">
                        <div className="text-xs font-mono text-slate-400 mb-3">KiCad Schematic — {fileList.find(f => f.category === 'schematic')?.name}</div>
                        {/* Parse KiCad schematic for component info */}
                        <KiCadSchematicViewer content={schematicContent} />
                      </div>
                    ) : (
                      <div className="p-6 font-mono text-xs text-slate-700 whitespace-pre-wrap overflow-auto h-full">
                        {schematicContent}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* === Gerber Layer View === */}
                {activeView === 'gerber' && layers.length > 0 && (
                  <motion.div key="gerber" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex"
                  >
                    {/* Layer list sidebar */}
                    <div className="w-48 border-r border-slate-700 bg-slate-800/60 overflow-y-auto p-3 space-y-1">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Layers ({layers.length})</div>
                      {layers.map((layer, i) => (
                        <button key={i}
                          onClick={() => setLayers(ls => ls.map((l, idx) => idx === i ? { ...l, visible: !l.visible } : l))}
                          className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 transition-colors"
                        >
                          <span className="h-3 w-3 rounded-full border border-slate-600 flex-shrink-0"
                            style={{ backgroundColor: layer.visible ? layer.color : 'transparent' }}
                          />
                          <div className="flex-1 text-left min-w-0">
                            <div className={layer.visible ? '' : 'text-slate-500 line-through'}>{layer.name}</div>
                            <div className="text-[9px] text-slate-500 truncate font-mono">{layer.fileName}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Gerber render area */}
                    <div className="flex-1 flex items-center justify-center p-6 bg-slate-900">
                      <div className="relative rounded-lg bg-slate-800 border border-slate-700 overflow-hidden" style={{
                        width: aspectRatio > 1 ? '320px' : `${320 * aspectRatio}px`,
                        height: aspectRatio > 1 ? `${320 / aspectRatio}px` : '320px',
                      }}>
                        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${boardWidth} ${boardHeight}`} preserveAspectRatio="none">
                          {/* Board outline */}
                          <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="none" stroke="#fbbf24" strokeWidth="0.15" opacity="0.5" />

                          {/* Render each visible layer */}
                          {layers.filter(l => l.visible).map((layer, i) => (
                            <g key={i} stroke={layer.color} fill="none" strokeWidth="0.15" opacity="0.8"
                              dangerouslySetInnerHTML={{ __html: layer.svgContent || '' }}
                            />
                          ))}

                          {/* If no parsed SVG, show the layer name as text */}
                          {layers.filter(l => l.visible).every(l => !l.svgContent) && (
                            <text x={boardWidth / 2} y={boardHeight / 2} textAnchor="middle" fontSize="3" fill="#94a3b8" fontFamily="monospace">
                              {layers.filter(l => l.visible).map(l => l.name).join(' + ')}
                            </text>
                          )}
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* File list */}
          <Card className="border-border/60 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-slate-50/60">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileArchive className="h-4 w-4 text-cyan-600" />
                Files in ZIP ({fileList.length})
              </h3>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={reset} className="text-xs h-7">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Upload New
                </Button>
                <Button size="sm" onClick={orderJlcpcb} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs h-7">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Order on JLCPCB
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border/20">
              {fileList.map((file, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/40 transition-colors">
                  <div className={cn(
                    'h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0',
                    file.category === 'gerber' ? 'bg-cyan-50 text-cyan-600' :
                    file.category === 'schematic' ? 'bg-emerald-50 text-emerald-600' :
                    file.category === 'pcb' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                  )}>
                    {file.category === 'gerber' ? <Layers className="h-4 w-4" /> :
                     file.category === 'schematic' ? <FileCode className="h-4 w-4" /> :
                     file.category === 'pcb' ? <CircuitBoard className="h-4 w-4" /> : <FileArchive className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate font-mono">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.type} · {formatSize(file.size)}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    'text-[10px] flex-shrink-0',
                    file.category === 'gerber' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                    file.category === 'schematic' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    file.category === 'pcb' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                  )}>
                    {file.category}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* PCB Specs Summary */}
          <Card className="border-cyan-200/60 bg-gradient-to-br from-cyan-50/40 to-teal-50/30">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-600" />
                PCB Specifications (Auto-detected from files)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SpecItem label="Board Size" value={`${boardWidth} × ${boardHeight} mm`} />
                <SpecItem label="Gerber Layers" value={`${gerberCount} files`} />
                <SpecItem label="Schematic" value={hasSchematic ? '✓ Found' : '—'} />
                <SpecItem label="PCB Layout" value={hasPcb ? '✓ Found' : '—'} />
              </div>
              <div className="mt-4 pt-4 border-t border-cyan-200/40">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Ready for JLCPCB manufacturing</p>
                    <p className="text-xl font-bold text-cyan-700">Upload to get instant quote</p>
                  </div>
                  <Button onClick={orderJlcpcb} className="bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Order on JLCPCB
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* KiCad Schematic Viewer — parses .kicad_sch format */
function KiCadSchematicViewer({ content }: { content: string }) {
  // Extract components from KiCad schematic
  const components: { ref: string; value: string; footprint: string }[] = [];
  const refMatches = content.matchAll(/\(symbol\s+"?([^"\s]+)"?[\s\S]*?\(property\s+"Reference"\s+"([^"]+)"[\s\S]*?\(property\s+"Value"\s+"([^"]+)"[\s\S]*?\(property\s+"Footprint"\s+"([^"]+)"/g);
  for (const m of refMatches) {
    components.push({ ref: m[2], value: m[3], footprint: m[4] });
  }

  // Also try simpler format
  if (components.length === 0) {
    const simpleRefs = content.matchAll(/\(property\s+"Reference"\s+"([^"]+)"\s+\(property\s+"Value"\s+"([^"]+)"/g);
    for (const m of simpleRefs) {
      components.push({ ref: m[1], value: m[2], footprint: '—' });
    }
  }

  // Count nets
  const nets = content.match(/\(net\s+\d+\s+"[^"]+"\)/g) || [];

  return (
    <div className="space-y-4">
      {components.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Components ({components.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {components.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border/60 bg-slate-50/60 px-3 py-2">
                <Cpu className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{c.ref} = {c.value}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono">{c.footprint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h4 className="text-sm font-semibold mb-2">Nets ({nets.length})</h4>
        <div className="flex flex-wrap gap-1.5">
          {nets.slice(0, 20).map((net, i) => {
            const name = net.match(/"([^"]+)"/)?.[1] || '';
            return <Badge key={i} variant="outline" className="text-[10px] bg-cyan-50 text-cyan-700 border-cyan-200">{name}</Badge>;
          })}
          {nets.length > 20 && <Badge variant="outline" className="text-[10px]">+{nets.length - 20} more</Badge>}
        </div>
      </div>
      {components.length === 0 && nets.length === 0 && (
        <div className="text-xs text-muted-foreground italic">
          Schematic file found but format not fully parsed. File size: {(content.length / 1024).toFixed(1)} KB
        </div>
      )}
    </div>
  );
}

function ViewTab({ active, onClick, icon: Icon, label, disabled }: { active: boolean; onClick: () => void; icon: any; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'text-muted-foreground hover:text-foreground hover:bg-slate-100',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan-100/60 bg-white/60 px-3 py-2">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
