import React, {useMemo} from 'react';
import {ReactFlow, Background, Controls, MarkerType, Position, type Edge, type Node} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type {VisualRole, VisualUser} from './engine';
import {useCopy} from '../data/copy';

export function RoleGraph({roles, users}: {roles: VisualRole[]; users: VisualUser[]}) {
  const t = useCopy();
  const {nodes, edges} = useMemo(() => {
    const nodes: Node[] = roles.map((role, index) => ({
      id: `role-${role.id}`,
      position: {x: 320, y: index * 148},
      data: {label: `${role.id} · ${role.rules.length} ${t.permissions.toLowerCase()}`},
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      className: 'rb-graph-node'
    }));
    const edges: Edge[] = roles.flatMap(role => role.inherits.filter(parent => roles.some(item => item.id === parent)).map(parent => ({
      id: `${parent}-${role.id}`,
      source: `role-${parent}`,
      target: `role-${role.id}`,
      animated: true,
      markerEnd: {type: MarkerType.ArrowClosed, color: '#8cbf50'}
    })));
    users.forEach((user, index) => {
      nodes.push({
        id: `user-${user.id}`,
        position: {x: 24, y: index * 148},
        data: {label: `${user.name} · ${t.user.toLowerCase()}`},
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        className: 'rb-graph-user'
      });
      user.roles.filter(role => roles.some(item => item.id === role)).forEach(role => edges.push({
        id: `user-${user.id}-${role}`,
        source: `user-${user.id}`,
        target: `role-${role}`,
        style: {strokeDasharray: '5 5'}
      }));
    });
    return {nodes, edges};
  }, [roles, users, t]);

  return <div className="rb-graph" role="img" aria-label={t.graphDescription}>
    <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{padding: 0.2}} nodesDraggable nodesConnectable={false} elementsSelectable minZoom={0.3} maxZoom={1.7}>
      <Background gap={22} color="#536175" size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  </div>;
}
