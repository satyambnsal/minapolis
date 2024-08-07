/* eslint-disable @typescript-eslint/no-explicit-any */

// from lodash
export function copyArray(source: any[], array?: any[]) {
  let index = -1;
  const length = source.length;

  array || (array = new Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return array;
}

// from lodash
export function shuffle(array: any[]) {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  const result = copyArray(array);
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result;
}

export class Button extends Phaser.GameObjects.Sprite {
  onDownCallback: () => void;
  down: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    onDownCallback: () => void
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);

    this.onDownCallback = onDownCallback;

    this.down = false;

    this.setInteractive();
    this.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.on(Phaser.Input.Events.POINTER_OUT, this.onOut, this);
    this.on(Phaser.Input.Events.POINTER_OVER, this.onOver, this);
    this.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
  }

  onOver() {
    this.setScale(1.075);
  }

  onOut() {
    this.down = false;
    this.setScale(1);
  }

  onUp() {
    this.scene.sound.play("click", { volume: 0.9 });
    this.setScale(1);
    if (this.down) {
      this.onDownCallback();
    }
  }

  onDown() {
    this.scene.sound.play("click", { volume: 0.4 });
    this.setScale(0.9);
    this.down = true;
  }
}

export class Queue<Type> {
  data: Map<number, Type>;
  head: number;
  tail: number;

  constructor() {
    this.data = new Map<number, Type>();
    this.head = 0;
    this.tail = 0;
  }

  enq(item: Type) {
    this.data.set(this.tail, item);
    this.tail++;
  }

  deq(): Type | undefined {
    if (this.data.has(this.head)) {
      const item = this.data.get(this.head);
      this.data.delete(this.head);
      this.head++;
      return item;
    }
  }

  size(): number {
    return this.tail - this.head;
  }
}

export class Matrix2D<Type> {
  rows: Map<number, Map<number, Type>>;

  constructor() {
    this.rows = new Map<number, Map<number, Type>>();
  }

  set(row: number, col: number, obj: Type) {
    let r = this.rows.get(row);
    if (!r) {
      r = new Map<number, Type>();
      this.rows.set(row, r);
    }
    r.set(col, obj);
  }

  get(row: number, col: number) {
    const r = this.rows.get(row);
    if (r) {
      return r.get(col) || null;
    } else {
      return null;
    }
  }

  delete(row: number, col: number) {
    const r = this.rows.get(row);
    if (r) {
      r.delete(col);
    }
  }

  has(row: number, col: number) {
    const r = this.rows.get(row);
    if (r) {
      return r.has(col);
    } else {
      return false;
    }
  }
}

export function pick(array: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return array[Math.floor(Math.random() * array.length)];
}
