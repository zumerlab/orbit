/** Ending of an arc or progress band. */
export type OrbitShape =
  | 'none'
  | 'rounded'
  | 'circle'
  | 'circle-a'
  | 'circle-b'
  | 'bullet'
  | 'arrow'
  | 'slash'
  | 'backslash'
  | 'zigzag';

type Numeric = number | `${number}`;
type BooleanAttribute = boolean | '' | undefined;

/** Attributes of `<o-arc>`. */
export interface OrbitArcAttributes {
  /** Share of the ring's range, relative to `max`. Without it, sibling arcs split the range equally. */
  value?: Numeric;
  /** Value that fills the whole range. Default `--o-max` of the ring or system, else `100`. */
  max?: Numeric;
  /**
   * Where the arc begins, on the same scale as `value` (0 is the start of the range).
   * A placed arc takes no slot and moves no other arc, so it can sit over a ring that already has arcs.
   */
  start?: Numeric;
  shape?: OrbitShape;
  /**
   * Where curved text sits on the arc. Default `middle`.
   * With `range="auto"`, an explicit value also anchors the arc at its angle:
   * `middle` centers it there, `end` ends it there.
   */
  'text-anchor'?: 'start' | 'middle' | 'end';
  /** Reverse the direction of curved text. */
  flip?: BooleanAttribute;
  /** Squeeze curved text to the length of the arc. */
  'fit-range'?: BooleanAttribute;
  /** Size the arc to its text. Consecutive `range="auto"` arcs follow each other. */
  range?: 'auto';
  /** Let the band receive pointer events, even where it is transparent. Arcs are decorative by default. */
  interactive?: BooleanAttribute;
  /** Extra touch area in px on each side of an interactive band. */
  'hit-width'?: Numeric;
}

/** Attributes of `<o-progress>`. */
export interface OrbitProgressAttributes {
  /** Progress relative to `max`. `--o-progress` overrides it. */
  value?: Numeric;
  /** Value that fills the whole range. Default `--o-max` of the ring or system, else `100`. */
  max?: Numeric;
  shape?: OrbitShape;
  /** `stroke` draws open lines colored by `--o-stroke` and `--o-back-stroke`. */
  variant?: 'stroke';
  /** Let the whole track receive pointer events, whatever its colors. Progress is decorative by default. */
  interactive?: BooleanAttribute;
  /** Extra touch area in px on each side of an interactive track. */
  'hit-width'?: Numeric;
}

export declare class OrbitArc extends HTMLElement {
  /** Mirrors the `value` attribute; null when it is not set. Setting it redraws. */
  value: number | null;
  /** Mirrors the `max` attribute (default 100). Setting it redraws. */
  max: number;
  /** Redraw now. The runtime calls this when the arc or its layout changes. */
  update(): void;
}

export declare class OrbitProgress extends HTMLElement {
  /** Mirrors the `value` attribute; null when it is not set. Setting it redraws. */
  value: number | null;
  /** Mirrors the `max` attribute (default 100). Setting it redraws. */
  max: number;
  /**
   * Redraw now. The runtime calls this when the progress or its layout changes.
   * It also writes `--o-value-angle` on its ring, where a `.satellite.at-value` sits.
   */
  update(): void;
}

export interface OrbitApi {
  /** Update layouts now, after changes Orbit cannot observe (for example CSSOM edits). Defaults to the document. */
  refresh(root?: Element | Document | ShadowRoot): void;
  /**
   * Resolves when pending layouts of `root` (default: the document) are drawn.
   * Each `<o-arc>` and `<o-progress>` also fires a bubbling `o-rendered` event after it redraws.
   */
  ready(root?: Element | Document | ShadowRoot): Promise<void>;
  /**
   * Scale systems that set a fixed px `--o-force` with a container's width (500px = 1).
   * Not needed for the default `--o-force`, which follows its `.bigbang`.
   * Returns a function that stops observing.
   */
  resize(target: string | Element): () => void;
}

export declare const Orbit: OrbitApi;

/** Define `<o-arc>` and `<o-progress>`. Runs on import; repeated calls are safe. */
export declare function registerOrbit(): void;

declare global {
  interface HTMLElementTagNameMap {
    'o-arc': OrbitArc;
    'o-progress': OrbitProgress;
  }
  interface Window {
    Orbit: OrbitApi;
  }
  interface HTMLElementEventMap {
    'o-rendered': Event;
  }
}
