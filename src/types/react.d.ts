// JSX types for <o-arc> and <o-progress> in React.
// Load once, for example in a .d.ts file of your app:
//   import type {} from '@zumer/orbit/react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { OrbitArc, OrbitArcAttributes, OrbitProgress, OrbitProgressAttributes } from './orbit.js';

type OrbitElementProps<Element, Attributes> =
  DetailedHTMLProps<HTMLAttributes<Element>, Element> & Attributes & { class?: string };

interface OrbitIntrinsicElements {
  'o-arc': OrbitElementProps<OrbitArc, OrbitArcAttributes>;
  'o-progress': OrbitElementProps<OrbitProgress, OrbitProgressAttributes>;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends OrbitIntrinsicElements {}
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements extends OrbitIntrinsicElements {}
  }
}
