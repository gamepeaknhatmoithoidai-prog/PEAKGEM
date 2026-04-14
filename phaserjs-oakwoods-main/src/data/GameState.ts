import Phaser from 'phaser';

export interface State {
  playerName: string;
  gender: 'male' | 'female';
  score: number;
  trust: number;          // 0–100: K'Brơi trust level
  chapter: number;        // 1 or 2
  decisions: string[];    // slugs of choices made
  inventory: string[];    // item keys collected
  plantsFound: number;    // 0–3
  animalSaved: boolean;
  evidenceCount: number;  // 0–5 (Ch2)
  ch1Done: boolean;
}

const DEFAULTS: State = {
  playerName: 'Thuận',
  gender: 'male',
  score: 0,
  trust: 0,
  chapter: 1,
  decisions: [],
  inventory: [],
  plantsFound: 0,
  animalSaved: false,
  evidenceCount: 0,
  ch1Done: false,
};

/** Thin wrapper around Phaser's registry for type-safe access. */
export class GS {
  private reg: Phaser.Data.DataManager;

  constructor(registry: Phaser.Data.DataManager) {
    this.reg = registry;
  }

  /** Call once in BootScene to initialise all keys. */
  init(): void {
    // Only write defaults that haven't been set yet (survives scene restarts)
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (this.reg.get(k) === undefined) {
        this.reg.set(k, v);
      }
    }
  }

  reset(): void {
    for (const [k, v] of Object.entries(DEFAULTS)) {
      this.reg.set(k, v);
    }
  }

  get<K extends keyof State>(k: K): State[K] {
    return this.reg.get(k) as State[K];
  }

  set<K extends keyof State>(k: K, v: State[K]): void {
    this.reg.set(k, v);
    this.reg.events.emit(`change-${k}`, v);
  }

  addScore(n: number): void {
    const next = Math.max(0, (this.get('score') || 0) + n);
    this.set('score', next);
    this.reg.events.emit('score-change', next);
  }

  addTrust(n: number): void {
    const next = Math.min(100, Math.max(0, (this.get('trust') || 0) + n));
    this.set('trust', next);
    this.reg.events.emit('trust-change', next);
  }

  addInventory(item: string): void {
    const inv: string[] = this.get('inventory') || [];
    if (!inv.includes(item)) {
      inv.push(item);
      this.set('inventory', [...inv]);
      this.reg.events.emit('inventory-change', inv);
    }
  }

  decide(slug: string): void {
    const ds: string[] = this.get('decisions') || [];
    if (!ds.includes(slug)) {
      ds.push(slug);
      this.set('decisions', [...ds]);
    }
  }

  hasMadeDecision(slug: string): boolean {
    return ((this.get('decisions') || []) as string[]).includes(slug);
  }

  /** Compute ending type from decisions & stats. */
  getEnding(): 'good' | 'neutral' | 'bad' {
    const score = this.get('score') || 0;
    const trust = this.get('trust') || 0;
    const evidence = this.get('evidenceCount') || 0;
    const animal = this.get('animalSaved') || false;

    const pts = (score >= 800 ? 2 : score >= 400 ? 1 : 0)
              + (trust >= 60 ? 2 : trust >= 30 ? 1 : 0)
              + (evidence >= 4 ? 2 : evidence >= 2 ? 1 : 0)
              + (animal ? 1 : 0);

    if (pts >= 6) return 'good';
    if (pts >= 3) return 'neutral';
    return 'bad';
  }
}
