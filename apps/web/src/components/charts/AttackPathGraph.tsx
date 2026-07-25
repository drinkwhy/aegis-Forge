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

export function AttackPathGraph({ nodes, links }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous
    d3.select(containerRef.current).selectAll('*').remove();

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height]);

    // Defs for arrows
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 24)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', 'var(--text-muted)')
      .style('stroke', 'none');

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    const linkText = g.append('g')
      .selectAll('text')
      .data(links)
      .join('text')
      .text(d => d.label)
      .attr('font-size', '10px')
      .attr('fill', 'var(--text-muted)')
      .attr('text-anchor', 'middle');

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    node.each(function(d) {
      const el = d3.select(this);
      if (d.type === 'agent') {
        el.append('circle').attr('r', 16).attr('fill', 'var(--primary)');
      } else if (d.type === 'mcp') {
        el.append('rect').attr('width', 28).attr('height', 28).attr('x', -14).attr('y', -14).attr('fill', 'var(--accent)');
      } else if (d.type === 'database') {
        el.append('polygon').attr('points', '0,-18 18,0 0,18 -18,0').attr('fill', 'var(--caution)');
      } else {
        el.append('circle').attr('r', 8).attr('fill', 'var(--text-muted)');
      }
    });

    node.append('text')
      .text(d => d.label)
      .attr('y', 30)
      .attr('font-size', '12px')
      .attr('fill', 'var(--text-primary)')
      .attr('text-anchor', 'middle');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [nodes, links]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
