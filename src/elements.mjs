// Editor metadata for Orbit's custom elements. The build turns it into a
// Custom Elements Manifest and a VS Code HTML custom data file.

const shapes = ['none', 'rounded', 'circle', 'circle-a', 'circle-b', 'bullet', 'arrow', 'slash', 'backslash', 'zigzag'];

const common = {
  value: { type: 'number', description: 'Value relative to max.' },
  max: { type: 'number', default: '100', description: 'Value that fills the ring\'s range. Must be positive.' },
  shape: { type: shapes.map(shape => `'${shape}'`).join(' | '), default: 'none', values: shapes, description: 'Ending of the band.' },
  interactive: { type: 'boolean', description: 'Let the painted shape receive pointer events. Decorative by default.' },
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
      'text-anchor': { type: "'start' | 'middle' | 'end'", default: 'middle', values: ['start', 'middle', 'end'], description: 'Where curved text starts.' },
      flip: { type: 'boolean', description: 'Reverse the direction of curved text.' },
      'fit-range': { type: 'boolean', description: 'Squeeze curved text to the length of the arc.' },
    },
    cssProperties: [...colors, ['--o-color', 'Text color.'], ['--o-gap', 'Space between sibling arcs. Default 1; cascades from the ring or system.']],
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
