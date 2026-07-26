'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Shield, Brain, Zap, Cpu, Database, Activity, Eye, RefreshCw, Terminal, Layers } from 'lucide-react';

interface AnatomyNode {
  id: string;
  name: string;
  organ: 'head' | 'core' | 'spine' | 'left_arm' | 'right_arm' | 'forge';
  system: string;
  status: 'OPTIMAL' | 'EVALUATING' | 'DEFENDING' | 'ANOMALY';
  riskScore: number;
  position: [number, number, number];
  color: string;
  description: string;
}

const ANATOMY_NODES: AnatomyNode[] = [
  {
    id: 'head-cognition',
    name: 'Cognition & Model Engine',
    organ: 'head',
    system: 'Claude 3.5 / GPT-4o Manifold',
    status: 'OPTIMAL',
    riskScore: 0.05,
    position: [0, 2.2, 0],
    color: '#00d4ff', // Electric Cyan
    description: 'Monitors neural activation geometry, persistence entropy, and topological manifold collapse.'
  },
  {
    id: 'eye-perception',
    name: 'Perception & Input Scanner',
    organ: 'head',
    system: 'RAG & Context Ingestion',
    status: 'OPTIMAL',
    riskScore: 0.12,
    position: [0, 1.8, 0.4],
    color: '#38bdf8',
    description: 'Scans user prompts, external documents, and inbound webhooks for prompt injection payloads.'
  },
  {
    id: 'core-governance',
    name: 'Aegis Core Governance',
    organ: 'core',
    system: 'Sentinel Policy Engine',
    status: 'DEFENDING',
    riskScore: 0.08,
    position: [0, 0.7, 0],
    color: '#10b981', // Emerald Green
    description: 'Central policy enforcement. Evaluates permissions, trust levels, and identity boundaries.'
  },
  {
    id: 'spine-memory',
    name: 'Spine & Context Memory',
    organ: 'spine',
    system: 'Neo4j Asset Graph & RAG Vector DB',
    status: 'OPTIMAL',
    riskScore: 0.02,
    position: [0, 0.0, -0.2],
    color: '#a855f7', // Purple
    description: 'Preserves universal entity relationships and session conversation provenance.'
  },
  {
    id: 'arm-left-data',
    name: 'Left Capability: Data Sources',
    organ: 'left_arm',
    system: 'S3, PostgreSQL & File Readers',
    status: 'OPTIMAL',
    riskScore: 0.04,
    position: [-1.4, 0.6, 0],
    color: '#3b82f6', // Blue
    description: 'Handles document retrieval, database queries, and knowledge provenance verification.'
  },
  {
    id: 'arm-right-tools',
    name: 'Right Capability: Tool & MCP Execution',
    organ: 'right_arm',
    system: 'MCP Server Transport (Stdio/HTTP)',
    status: 'ANOMALY',
    riskScore: 0.88,
    position: [1.4, 0.6, 0],
    color: '#f97316', // Warning Orange
    description: 'Controls tool call parameters. Active tool poisoning vector blocked by Sentinel Policy.'
  },
  {
    id: 'forge-crucible',
    name: 'Crucible Shadow Forge',
    organ: 'forge',
    system: 'Council of Titans Evolution Lab',
    status: 'EVALUATING',
    riskScore: 0.35,
    position: [0, -1.8, 0],
    color: '#ef4444', // Red/Crimson Forge
    description: 'Runs ExecutionTitan, MPED, and Topological Titan to evolve new Sentinel Policies.'
  }
];

export function IntelligenceAnatomy3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<AnatomyNode>(ANATOMY_NODES[2]); // Default: Core Governance
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 3>(1);
  const [activeTitan, setActiveTitan] = useState<'BEHAVIORAL' | 'MPED' | 'TOPOLOGICAL' | 'GSAE'>('TOPOLOGICAL');

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020817, 0.15);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // 2. Build Humanoid Particle Anatomy (Silhouette & Skeleton)
    const particleCount = 2400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Shape points into a glowing humanoid outline (Head, Torso, Arms, Legs)
      const part = Math.random();
      let x = 0, y = 0, z = 0;

      if (part < 0.15) {
        // Head sphere
        const u = Math.random(), v = Math.random();
        const theta = u * 2.0 * Math.PI, phi = Math.acos(2.0 * v - 1.0);
        const r = 0.38 + Math.random() * 0.05;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = 2.1 + r * Math.sin(phi) * Math.sin(theta);
        z = r * Math.cos(phi);
      } else if (part < 0.55) {
        // Torso / Core
        y = (Math.random() - 0.5) * 1.8 + 0.6;
        const radius = (1.5 - y * 0.4) * 0.35 * Math.random();
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
      } else if (part < 0.75) {
        // Arms
        const side = Math.random() > 0.5 ? 1 : -1;
        const t = Math.random();
        x = side * (0.4 + t * 1.1);
        y = 1.3 - t * 0.9;
        z = (Math.random() - 0.5) * 0.2;
      } else {
        // Shadow Forge particles below
        y = -1.2 - Math.random() * 1.2;
        const r = Math.random() * 1.4;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
      }

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Color mapping: Cyan to Violet
      const baseColor = y < -0.8 ? new THREE.Color(0xef4444) : new THREE.Color(0x00d4ff);
      colors[i * 3] = baseColor.r;
      colors[i * 3 + 1] = baseColor.g;
      colors[i * 3 + 2] = baseColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const humanoidParticles = new THREE.Points(geometry, particleMaterial);
    scene.add(humanoidParticles);

    // 3. Interactive Organ Node Spheres
    const nodeGroup = new THREE.Group();
    const nodeMeshes: THREE.Mesh[] = [];

    ANATOMY_NODES.forEach((n) => {
      const nodeGeo = new THREE.SphereGeometry(n.organ === 'head' || n.organ === 'core' ? 0.16 : 0.12, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(n.color),
        wireframe: true
      });

      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.set(...n.position);
      mesh.userData = n;
      nodeGroup.add(mesh);
      nodeMeshes.push(mesh);
    });

    scene.add(nodeGroup);

    // 4. Connecting Energy Lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.3
    });

    const lineGeo = new THREE.BufferGeometry();
    const linePositions: number[] = [];

    // Connect Head -> Core -> Arms & Spine -> Forge
    const connections = [
      [ANATOMY_NODES[0], ANATOMY_NODES[2]], // Head -> Core
      [ANATOMY_NODES[2], ANATOMY_NODES[4]], // Core -> Left Arm
      [ANATOMY_NODES[2], ANATOMY_NODES[5]], // Core -> Right Arm
      [ANATOMY_NODES[2], ANATOMY_NODES[3]], // Core -> Spine
      [ANATOMY_NODES[3], ANATOMY_NODES[6]], // Spine -> Forge
    ];

    connections.forEach(([source, target]) => {
      linePositions.push(...source.position);
      linePositions.push(...target.position);
    });

    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const energyLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(energyLines);

    // 5. Raycasting for Click / Select
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const clickedNode = intersects[0].object.userData as AnatomyNode;
        setSelectedNode(clickedNode);
      }
    };

    const domEl = mountRef.current;
    domEl.addEventListener('pointerdown', handlePointerDown);

    // 6. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle rotation & floating energy motion
      humanoidParticles.rotation.y = Math.sin(elapsedTime * 0.3) * 0.15;
      nodeGroup.rotation.y = Math.sin(elapsedTime * 0.3) * 0.15;
      energyLines.rotation.y = Math.sin(elapsedTime * 0.3) * 0.15;

      // Pulse nodes
      nodeMeshes.forEach((m, idx) => {
        const scale = 1 + Math.sin(elapsedTime * 3 + idx) * 0.08;
        m.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('pointerdown', handlePointerDown);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* 3D Canvas Viewport */}
      <div className="glass" style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Controls Overlay */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setZoomLevel(1)}
            className={`btn ${zoomLevel === 1 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            Level 1: Anatomy
          </button>
          <button
            onClick={() => setZoomLevel(2)}
            className={`btn ${zoomLevel === 2 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            Level 2: Organ System
          </button>
          <button
            onClick={() => setZoomLevel(3)}
            className={`btn ${zoomLevel === 3 ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '12px', padding: '4px 10px' }}
          >
            Level 3: Titans Telemetry
          </button>
        </div>

        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</span>
          <span className="badge badge-critical" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} className="animate-pulse" /> Sentinel Active
          </span>
        </div>

        {/* 3D WebGL Canvas */}
        <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} />

        {/* Footnote Guide */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10, color: 'var(--text-muted)', fontSize: '12px' }}>
          💡 Click any organ node to inspect cognitive state & Council of Titans evaluation.
        </div>
      </div>

      {/* Side Inspection Panel */}
      <div className="glass animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div style={{ background: 'rgba(0, 212, 255, 0.15)', padding: '10px', borderRadius: '8px', color: selectedNode.color }}>
            <Brain size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{selectedNode.name}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedNode.system}</span>
          </div>
        </div>

        {/* Status & Risk Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Organ State</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: selectedNode.status === 'ANOMALY' ? 'var(--danger)' : 'var(--success)' }}>
              {selectedNode.status}
            </span>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Anomaly Risk</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: selectedNode.riskScore > 0.5 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {(selectedNode.riskScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {selectedNode.description}
        </p>

        {/* Council of Titans Real-Time Section */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} color="var(--primary)" /> Council of Titans Analysis
          </h4>

          {/* Titan Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            {(['TOPOLOGICAL', 'BEHAVIORAL', 'MPED', 'GSAE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTitan(t)}
                className={`btn ${activeTitan === t ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '10px', padding: '4px 8px' }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Titan Specific Analysis */}
          {activeTitan === 'TOPOLOGICAL' && (
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Persistence Entropy:</span>
                <span>0.842</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Entropy Delta (ΔH):</span>
                <span style={{ color: 'var(--danger)' }}>-0.71 (Collapse)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Betti Numbers:</span>
                <span>β₀=1, β₁=0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Manifold Compression:</span>
                <span style={{ color: 'var(--warning)' }}>88% High</span>
              </div>
            </div>
          )}

          {activeTitan === 'BEHAVIORAL' && (
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Output Risk Score:</span>
                <span style={{ color: 'var(--danger)' }}>0.88 (Critical)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Policy Violations:</span>
                <span>1 Active</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                Rule: "Block tool call when context provenance = UNTRUSTED"
              </div>
            </div>
          )}

          {activeTitan === 'MPED' && (
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>CPU Execution Load:</span>
                <span>24.5% (Normal)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Execution Latency:</span>
                <span>210 ms</span>
              </div>
            </div>
          )}

          {activeTitan === 'GSAE' && (
            <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Context Provenance:</span>
                <span style={{ color: 'var(--warning)' }}>UNTRUSTED (RAG)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tool Invocation:</span>
                <span>read_file ('/etc/passwd')</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button className="btn btn-primary" style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}>
          <Shield size={16} /> Deploy Sentinel Policy v47
        </button>
      </div>
    </div>
  );
}
