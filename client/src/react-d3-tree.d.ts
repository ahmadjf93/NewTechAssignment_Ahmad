// Local type definitions for react-d3-tree.
declare module 'react-d3-tree' {
  import * as React from 'react';

  export type RawNodeDatum = {
    name: string;
    attributes?: Record<string, string | number>;
    children?: RawNodeDatum[];
  };

  export type TreeProps = {
    data: RawNodeDatum | RawNodeDatum[];
    translate?: { x: number; y: number };
    zoom?: number;
    scaleExtent?: { min: number; max: number };
    nodeSize?: { x: number; y: number };
    separation?: { siblings: number; nonSiblings: number };
    orientation?: 'horizontal' | 'vertical';
    zoomable?: boolean;
    collapsible?: boolean;
    pathFunc?: 'diagonal' | 'elbow' | 'straight' | 'step';
    styles?: any;
    renderCustomNodeElement?: (rd3tProps: any) => React.ReactNode;
  } & React.SVGProps<SVGSVGElement>;

  const Tree: React.ComponentType<TreeProps>;
  export default Tree;
}
