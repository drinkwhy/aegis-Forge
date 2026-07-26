'use client';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'agent' | 'mcp' | 'database' | 'tool';
  label: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
}

const NODE_COLORS: Record<GraphNode['type'], string> = {
  agent: '#00d4ff',    // Electric Cyan
  mcp: '#7c3aed',      // Violet
  database: '#f97316', // High Orange / Caution
  tool: '#94a3b8',     // Muted Blue-Grey
};

export function AttackPathGraph({ nodes, links }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    // Clear previous render
    d3.select(containerRef.current).selectAll('*').remove();

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height].join(' '));

    const defs = svg.append('defs');

    // Arrow marker definition
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', 'rgba(255, 255, 255, 0.4)')
      .style('stroke', 'none');

    // Create glow filters for each color
    Object.entries(NODE_COLORS).forEach(([type, color]) => {
      const filter = defs
        .append('filter')
        .attr('id', `glow-${type}`)
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');

      filter
        .append('feGaussianBlur')
        .attr('stdDeviation', '6')
        .attr('result', 'blur');

      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'blur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    const g = svg.append('g');

    // Zoom + pan
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (e) => g.attr('transform', e.transform.toString()));
    svg.call(zoom);

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(40));

    // Links container
    const linkGroup = g.append('g').attr('class', 'links');

    // Underlay links (the background line)
    const link = linkGroup
      .selectAll<SVGLineElement, GraphLink>('.link-base')
      .data(links)
      .join('line')
      .attr('class', 'link-base')
      .attr('stroke', 'rgba(255, 255, 255, 0.08)')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Animated dash overlays (simulating packet flows)
    const linkPulse = linkGroup
      .selectAll<SVGLineElement, GraphLink>('.link-pulse')
      .data(links)
      .join('line')
      .attr('class', 'link-pulse')
      .attr('stroke', 'var(--primary)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8, 20')
      .attr('stroke-linecap', 'round')
      .style('mix-blend-mode', 'screen')
      .style('opacity', 0.8);

    // Add CSS keyframe animation for the pulse movement
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulseFlow {
        to {
          stroke-dashoffset: -40;
        }
      }
      .link-pulse {
        animation: pulseFlow 2s linear infinite;
      }
    `;
    document.head.appendChild(style);

    // Link labels
    const linkLabel = g
      .append('g')
      .selectAll<SVGTextElement, GraphLink>('text')
      .data(links)
      .join('text')
      .text((d) => d.label)
      .attr('font-size', '10px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('fill', 'var(--text-muted)')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none');

    // Node groups
    const node = g
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Interactive Hover States
    node.on('mouseenter', function (event, d) {
      // Dim all nodes & links
      node.style('opacity', 0.35);
      link.style('stroke', 'rgba(255, 255, 255, 0.03)');
      linkPulse.style('opacity', 0.1);

      // Highlight hovered node
      d3.select(this)
        .transition()
        .duration(200)
        .style('opacity', 1)
        .attr('transform', `scale(1.15)`);

      // Highlight direct connections
      const connectedNodeIds = new Set<string>();
      links.forEach((l) => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;

        if (sourceId === d.id) {
          connectedNodeIds.add(targetId);
        } else if (targetId === d.id) {
          connectedNodeIds.add(sourceId);
        }
      });

      node.filter((n) => connectedNodeIds.has(n.id)).style('opacity', 0.95);
      
      link
        .filter((l) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return sId === d.id || tId === d.id;
        })
        .attr('stroke', 'rgba(255, 255, 255, 0.4)')
        .attr('stroke-width', 2.5);

      linkPulse
        .filter((l) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return sId === d.id || tId === d.id;
        })
        .style('opacity', 1)
        .attr('stroke-width', 3);
    });

    node.on('mouseleave', function () {
      node.transition().duration(200).style('opacity', 1).attr('transform', 'scale(1)');
      link.attr('stroke', 'rgba(255, 255, 255, 0.08)').attr('stroke-width', 2);
      linkPulse.style('opacity', 0.8).attr('stroke-width', 2);
    });

    // Node shapes by type with custom neon glow filters
    node.each(function (d) {
      const el = d3.select(this);
      const color = NODE_COLORS[d.type];

      if (d.type === 'agent') {
        el.append('circle')
          .attr('r', 16)
          .attr('fill', color)
          .attr('filter', `url(#glow-agent)`)
          .style('opacity', 0.9);
        el.append('circle')
          .attr('r', 20)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-opacity', 0.4)
          .attr('stroke-width', 2);
      } else if (d.type === 'mcp') {
        el.append('rect')
          .attr('width', 28)
          .attr('height', 28)
          .attr('x', -14)
          .attr('y', -14)
          .attr('rx', 6)
          .attr('fill', color)
          .attr('filter', `url(#glow-mcp)`)
          .style('opacity', 0.9);
      } else if (d.type === 'database') {
        el.append('polygon')
          .attr('points', '0,-18 18,0 0,18 -18,0')
          .attr('fill', color)
          .attr('filter', `url(#glow-database)`)
          .style('opacity', 0.9);
      } else {
        el.append('circle')
          .attr('r', 10)
          .attr('fill', color)
          .style('opacity', 0.85);
      }
    });

    // Labels below nodes
    node
      .append('text')
      .text((d) => d.label)
      .attr('y', 32)
      .attr('font-size', '11px')
      .attr('font-family', 'Inter, sans-serif')
      .attr('fill', 'var(--text-secondary)')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none');

    // Tick update — translate nodes, update links
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      linkPulse
        .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
        .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
        .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
        .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

      linkLabel
        .attr('x', (d) => (((d.source as GraphNode).x ?? 0) + ((d.target as GraphNode).x ?? 0)) / 2)
        .attr('y', (d) => (((d.source as GraphNode).y ?? 0) + ((d.target as GraphNode).y ?? 0)) / 2 - 6);

      node.attr('transform', (d) => 'translate(' + (d.x ?? 0) + ',' + (d.y ?? 0) + ')');
    });

    return () => {
      simulation.stop();
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, [nodes, links]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
