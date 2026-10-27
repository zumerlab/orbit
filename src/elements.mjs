// Editor metadata for Orbit's custom elements. The build turns it into a
// Custom Elements Manifest and a VS Code HTML custom data file.

const shapes = ['none', 'rounded', 'circle', 'circle-a', 'circle-b', 'bullet', 'arrow', 'slash', 'backslash', 'zigzag'];

const common = {
  value: { type: 'number', description: 'Value relative to max.' },
  max: { type: 'number', default: '100', description: 'Value that fills the ring\'s range. Must be positive. Without it, --o-max of the ring or system.' },
  shape: { type: shapes.map(shape => `'${shape}'`).join(' | '), default: 'none', values: shapes, description: 'Ending of the band.' },
  interactive: { type: 'boolean', description: 'Let the band receive pointer events, even where it is transparent. Decorative by default.' },
  'hit-width': { type: 'number', default: '0', description: 'Extra touch area in px on each side of an interactive band.' },
};

const colors = [
  ['--o-fill', 'Band color.'],
  ['--o-stroke', 'Outline color.'],
  ['--o-stroke-width', 'Outline width, unitless.'],
];

export const elements = [
  {
    name: 'o-arc',
    className: 'OrbitArc',
    description: 'A segment of its ring. Without value, sibling arcs split the range equally; with value, they stack in DOM order. Text content is drawn along the arc. Place it directly in a ring.',
    attributes: {
      ...common,
      value: { type: 'number', description: 'Share of the ring\'s range, relative to max. Without it, sibling arcs split the range equally.' },
      start: { type: 'number', description: 'Where the arc begins, on the same scale as value. A placed arc takes no slot and moves no other arc: text over a ring that already has arcs, or segments on a timeline.' },
      'text-anchor': { type: "'start' | 'middle' | 'end'", default: 'middle', values: ['start', 'middle', 'end'], description: 'Where curved text sits on the arc. With range="auto", an explicit value anchors the arc at its angle: middle centers it, end ends it there.' },
      flip: { type: 'boolean', description: 'Reverse the direction of curved text.' },
      'fit-range': { type: 'boolean', description: 'Squeeze curved text to the length of the arc.' },
      range: { type: "'auto'", values: ['auto'], description: 'Size the arc to its text. Consecutive range="auto" arcs follow each other.' },
    },
    cssProperties: [
      ...colors,
      ['--o-color', 'Text color.'],
      ['--o-gap', 'Space between sibling arcs. Default 1; cascades from the ring or system.'],
      ['--o-max', 'Value that fills the range when there is no max attribute. Default 100; cascades from the ring or system.'],
      ['--o-ripple-color', 'Color of the .ripple wave. Default --o-fill.'],
      ['--o-ripple-duration', 'One wave of .ripple. Default 1.6s.'],
      ['--o-ripple-scale', 'How far a .ripple wave grows, from the center of the ring. Default 1.14.'],
    ],
  },
  {
    name: 'o-progress',
    className: 'OrbitProgress',
    description: 'A progress band over a background track that spans its ring\'s range. Place it directly in a ring.',
    attributes: {
      ...common,
      variant: { type: "'stroke'", values: ['stroke'], description: 'Draw open lines colored by --o-stroke and --o-back-stroke instead of filled bands.' },
    },
    cssProperties: [
      ...colors,
      ['--o-back-fill', 'Track color.'],
      ['--o-back-stroke', 'Track outline color.'],
      ['--o-back-stroke-width', 'Track outline width, unitless.'],
      ['--o-progress', 'Progress value; overrides the value attribute.'],
      ['--o-max', 'Value that fills the range when there is no max attribute. Default 100; cascades from the ring or system.'],
    ],
  },
];

export function customElementsManifest(version) {
  return {
    schemaVersion: '1.0.0',
    readme: '',
    modules: [{
      kind: 'javascript-module',
      path: 'dist/orbit.mjs',
      declarations: elements.map(element => ({
        kind: 'class',
        name: element.className,
        tagName: element.name,
        customElement: true,
        description: element.description,
        superclass: { name: 'HTMLElement' },
        attributes: Object.entries(element.attributes).map(([name, attribute]) => ({
          name,
          description: attribute.description,
          type: { text: attribute.type },
          ...(attribute.default ? { default: attribute.default } : {}),
        })),
        cssProperties: element.cssProperties.map(([name, description]) => ({ name, description })),
        events: [{ name: 'o-rendered', description: 'Fired after the element redraws. Bubbles and crosses shadow roots.' }],
      })),
      exports: elements.flatMap(element => [
        { kind: 'js', name: element.className, declaration: { name: element.className, module: 'dist/orbit.mjs' } },
        { kind: 'custom-element-definition', name: element.name, declaration: { name: element.className, module: 'dist/orbit.mjs' } },
      ]),
    }],
    package: { name: '@zumer/orbit', version },
  };
}

export function vscodeHtmlData() {
  return {
    version: 1.1,
    tags: elements.map(element => ({
      name: element.name,
      description: element.description,
      attributes: Object.entries(element.attributes).map(([name, attribute]) => ({
        name,
        description: attribute.description + (attribute.default ? ` Default: ${attribute.default}.` : ''),
        ...(attribute.values ? { values: attribute.values.map(value => ({ name: value })) } : {}),
        ...(attribute.type === 'boolean' ? { valueSet: 'v' } : {}),
      })),
    })),
  };
}
