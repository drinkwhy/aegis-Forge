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
  agent: 'var(--primary)',
  mcp: 'var(--accent)',
  database: 'var(--caution)',
  tool: 'var(--text-muted)',
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

    // Arrow marker definition
    const defs = svg.append('defs');
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
      .attr('fill', 'var(--text-muted)')
      .style('stroke', 'none');

    const g = svg.append('g');

    // Zoom + pan
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
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
          .distance(140)
      )
      .force('charge', d3.forceManyBody().strength(-450))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(30));

    // Links
    const link = g
      .append('g')
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.12)')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

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
      .attr('text-anchor', 'middle');

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

    // Node shapes by type
    node.each(function (d) {
      const el = d3.select(this);
      const color = NODE_COLORS[d.type];

      if (d.type === 'agent') {
        el.append('circle').attr('r', 18).attr('fill', color).attr('fill-opacity', 0.9);
        // Glow ring
        el.append('circle')
          .attr('r', 22)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-opacity', 0.3)
          .attr('stroke-width', 2);
      } else if (d.type === 'mcp') {
        el.append('rect')
          .attr('width', 30)
          .attr('height', 30)
          .attr('x', -15)
          .attr('y', -15)
          .attr('rx', 6)
          .attr('fill', color)
          .attr('fill-opacity', 0.9);
      } else if (d.type === 'database') {
        el.append('polygon')
          .attr('points', '0,-20 20,0 0,20 -20,0')
          .attr('fill', color)
          .attr('fill-opacity', 0.9);
      } else {
        // tool — small circle
        el.append('circle').attr('r', 10).attr('fill', color).attr('fill-opacity', 0.7);
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
      .attr('text-anchor', 'middle');

    // Hover tooltip
    node
      .append('title')
      .text((d) => d.id + ' [' + d.type + ']');

    // Tick update — translate nodes, update links
    simulation.on('tick', () => {
      link
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
    };
  }, [nodes, links]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
