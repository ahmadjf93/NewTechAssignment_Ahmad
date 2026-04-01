import React from 'react';
import Tree from 'react-d3-tree';
import '@newtech/theme';
import './styles.css';

type TreeProps = React.ComponentProps<typeof Tree> & {
  emptyLabel?: string;
  className?: string;
};

const defaultStyles = {
  nodes: {
    node: {
      circle: { fill: '#4c6ef5', stroke: '#1f2a4d', strokeWidth: 2 },
      name: { fill: '#0a0f23', fontWeight: 700 },
      attributes: { fill: '#1f2a4d' },
    },
    leafNode: {
      circle: { fill: '#24356d', stroke: '#1f2a4d', strokeWidth: 2 },
      name: { fill: '#0a0f23', fontWeight: 700 },
      attributes: { fill: '#1f2a4d' },
    },
  },
  links: { stroke: '#2f4078', strokeWidth: 2 },
};

export function OrgTree({ data, className, emptyLabel = 'No data', styles, ...rest }: TreeProps) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <div className="nt-tree-empty">{emptyLabel}</div>;
  }
  return (
    <div className={className || 'nt-tree-wrapper'}>
      <Tree
        data={data}
        pathFunc="straight"
        orientation="vertical"
        collapsible={false}
        zoomable
        styles={{ ...defaultStyles, ...styles }}
        {...rest}
      />
    </div>
  );
}
