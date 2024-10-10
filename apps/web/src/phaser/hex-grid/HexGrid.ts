import { Queue, Matrix2D } from "../util";
import { rotations, shapes, HEX_HEIGHT, HEX_WIDTH } from "./constants";
import { Trihex } from "./TriHex";
import { Hex } from "./Hex";
import { ScorePopper } from "./ScorePopper";
import { Tile } from "../../types";
import { GameObjects } from "phaser";

export class HexGrid extends GameObjects.Group {
  grid: Matrix2D<Hex>;
  hexes: Hex[];
  triPreviews: Phaser.GameObjects.Image[];
  enabled: boolean;
  scoreText: Phaser.GameObjects.BitmapText | null = null;
  scoreQueue: Queue<ScorePopper>;
  onQueueEmpty: (() => void) | null = null;

  onNewPoints: (score: number, hexType: number) => void;
  size: number;

  x: number;
  y: number;

  constructor(
    scene: Phaser.Scene,
    size: number,
    hills: number,
    x?: number,
    y?: number,
    onNewPoints?: (score: number, hexType: number) => void
  ) {
    super(scene);

    this.enabled = true;

    this.grid = new Matrix2D<Hex>();
    this.hexes = [];
    this.size = size;

    this.onNewPoints = onNewPoints!;

    this.x = x || 0;
    this.y = y || 0;

    this.scoreQueue = new Queue<ScorePopper>();

    for (let r = 0; r < size + size + 1; r++) {
      for (let c = 0; c < size + size + 1; c++) {
        if (c + r < size || c + r > size * 3) {
          continue;
        } else {
          const h = new Hex(scene, getX(r, c) + this.x, getY(r) + this.y, r, c);
          this.add(h);
          this.grid.set(r, c, h);
          this.hexes.push(h);
        }
      }
    }

    this.grid.get(0, size)?.setType(5);
    this.grid.get(0, size)?.setAngle(-60);
    this.grid.get(0, size * 2)?.setType(5);

    this.grid.get(size, 0)?.setType(5);
    this.grid.get(size, 0)?.setAngle(-120);
    this.grid.get(size, size * 2)?.setType(5);
    this.grid.get(size, size * 2)?.setAngle(60);

    this.grid.get(size, size)?.setType(4);

    this.grid.get(size * 2, 0)?.setType(5);
    this.grid.get(size * 2, 0)?.setAngle(-180);
    this.grid.get(size * 2, size)?.setType(5);
    this.grid.get(size * 2, size)?.setAngle(120);

    let placed = 0;
    while (placed < hills) {
      const r = Math.floor(Math.random() * (size + size + 1));
      const c = Math.floor(Math.random() * (size + size + 1));

      const h = this.grid.get(r, c);
      if (
        h &&
        !h.hasHill &&
        h.hexType === 0 &&
        !(this.grid.has(r, c + 1) && this.grid.get(r, c + 1)?.hasHill) &&
        !(
          this.grid.has(r - 1, c + 1) && this.grid.get(r - 1, c + 1)?.hasHill
        ) &&
        !(this.grid.has(r - 1, c) && this.grid.get(r - 1, c)?.hasHill) &&
        !(this.grid.has(r, c - 1) && this.grid.get(r, c - 1)?.hasHill) &&
        !(
          this.grid.has(r + 1, c - 1) && this.grid.get(r + 1, c - 1)?.hasHill
        ) &&
        !(this.grid.has(r + 1, c) && this.grid.get(r + 1, c)?.hasHill)
      ) {
        h.setHill(true);
        placed += 1;
      }
    }

    this.updateEdges();

    this.triPreviews = [];
    for (let i = 0; i < 3; i++) {
      const p = scene.add.image(-200, -200, "white");
      p.setScale(0.5);
      p.setAlpha(0.5);
      this.triPreviews.push(p);
    }

    scene.time.addEvent({
      repeat: -1,
      callback: this.nextPopper,
      callbackScope: this,
      delay: 100,
    });
  }

  updateEdges() {
    for (let r = 0; r < this.size + this.size + 1; r++) {
      for (let c = 0; c < this.size + this.size + 1; c++) {
        if (this.grid.has(r, c)) {
          const h = this.grid.get(r, c)!;

          if (this.grid.has(r, c + 1) && this.grid.get(r, c + 1)?.hexType !== 5)
            h.eEdge.setAlpha(0);
          else h.eEdge.setAlpha(1);

          if (
            this.grid.has(r - 1, c + 1) &&
            this.grid.get(r - 1, c + 1)?.hexType !== 5
          )
            h.neEdge.setAlpha(0);
          else h.neEdge.setAlpha(1);

          if (this.grid.has(r - 1, c) && this.grid.get(r - 1, c)?.hexType !== 5)
            h.nwEdge.setAlpha(0);
          else h.nwEdge.setAlpha(1);

          if (
            this.grid.has(r, c - 1) &&
            (this.grid.get(r, c - 1)?.hexType === h.hexType ||
              (h.hexType === 4 && this.grid.get(r, c - 1)?.hexType === 3) ||
              (h.hexType === 3 && this.grid.get(r, c - 1)?.hexType === 4))
          )
            h.wEdge.setAlpha(0.4);
          else h.wEdge.setAlpha(1);

          if (
            this.grid.has(r + 1, c - 1) &&
            (this.grid.get(r + 1, c - 1)?.hexType === h.hexType ||
              (h.hexType === 4 && this.grid.get(r + 1, c - 1)?.hexType === 3) ||
              (h.hexType === 3 && this.grid.get(r + 1, c - 1)?.hexType === 4))
          )
            h.swEdge.setAlpha(0.4);
          else h.swEdge.setAlpha(1);

          if (
            this.grid.has(r + 1, c) &&
            (this.grid.get(r + 1, c)?.hexType === h.hexType ||
              (h.hexType === 4 && this.grid.get(r + 1, c)?.hexType === 3) ||
              (h.hexType === 3 && this.grid.get(r + 1, c)?.hexType === 4))
          )
            h.seEdge.setAlpha(0.4);
          else h.seEdge.setAlpha(1);
        }
      }
    }
  }

  sinkBlanks() {
    this.scene.sound.play("splash", { volume: 0.75 });

    for (const h of this.hexes) {
      if (h.hexType === 0 || (h.hexType === 5 && !h.counted)) {
        h.puffer.setParticleTint(0x3b80a6);
        h.puff();
        h.setVisible(false);
        h.edges.setVisible(false);
        this.grid.delete(h.row, h.col);
      }
    }

    this.grid
      .get(0, this.size)
      ?.setFrame(
        (this.grid.has(1, this.size - 1) ? 4 : 0) +
          (this.grid.has(1, this.size) ? 2 : 0) +
          (this.grid.has(0, this.size + 1) ? 1 : 0)
      );

    this.grid
      .get(this.size, 0)
      ?.setFrame(
        (this.grid.has(this.size + 1, 0) ? 4 : 0) +
          (this.grid.has(this.size, 1) ? 2 : 0) +
          (this.grid.has(this.size - 1, 1) ? 1 : 0)
      );

    this.grid
      .get(0, this.size * 2)
      ?.setFrame(
        (this.grid.has(0, this.size * 2 - 1) ? 4 : 0) +
          (this.grid.has(1, this.size * 2 - 1) ? 2 : 0) +
          (this.grid.has(1, this.size * 2) ? 1 : 0)
      );

    this.grid
      .get(this.size, this.size * 2)
      ?.setFrame(
        (this.grid.has(this.size - 1, this.size * 2) ? 4 : 0) +
          (this.grid.has(this.size, this.size * 2 - 1) ? 2 : 0) +
          (this.grid.has(this.size + 1, this.size * 2 - 1) ? 1 : 0)
      );

    this.grid
      .get(this.size * 2, 0)
      ?.setFrame(
        (this.grid.has(this.size * 2, 1) ? 4 : 0) +
          (this.grid.has(this.size * 2 - 1, 1) ? 2 : 0) +
          (this.grid.has(this.size * 2 - 1, 0) ? 1 : 0)
      );

    this.grid
      .get(this.size * 2, this.size)
      ?.setFrame(
        (this.grid.has(this.size * 2 - 1, this.size + 1) ? 4 : 0) +
          (this.grid.has(this.size * 2 - 1, this.size) ? 2 : 0) +
          (this.grid.has(this.size * 2, this.size - 1) ? 1 : 0)
      );

    this.updateEdges();
  }

  canPlaceShape(shape: string) {
    for (const hex of this.hexes) {
      if (hex.hexType === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const rotation of (rotations as any)[shape]) {
          let canPlaceHere = true;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const offsets of (shapes as any)[rotation]) {
            const r = hex.row + offsets.ro;
            const c = hex.col + offsets.co;
            if (!(this.grid.has(r, c) && this.grid.get(r, c)?.hexType === 0)) {
              canPlaceHere = false;
            }
          }
          if (canPlaceHere) return true;
        }
      }
    }
    return false;
  }

  neighbors(row: number, col: number) {
    return [
      this.grid.get(row, col + 1),
      this.grid.get(row - 1, col + 1),
      this.grid.get(row - 1, col),
      this.grid.get(row, col - 1),
      this.grid.get(row + 1, col - 1),
      this.grid.get(row + 1, col),
    ];
  }

  deactivate() {
    this.enabled = false;
    this.triPreviews[0].setVisible(false);
    this.triPreviews[1].setVisible(false);
    this.triPreviews[2].setVisible(false);
  }

  activate() {
    this.enabled = true;
    this.triPreviews[0].setVisible(true);
    this.triPreviews[1].setVisible(true);
    this.triPreviews[2].setVisible(true);
  }

  updateTriPreview(x: number, y: number, trihex: Trihex) {
    if (!this.enabled) return;
    if (trihex.shape === "a") {
      y -= HEX_HEIGHT / 2;
    }
    if (trihex.shape === "v") {
      y -= HEX_HEIGHT / 2;
      x -= HEX_WIDTH / 2;
    }
    const r = getRow(x, y);
    const c = getCol(x, y);

    const hexes = [];
    let touching = false;

    for (let i = 0; i < 3; i++) {
      const offsets = (shapes as any)[trihex.shape][i];
      const currentHex = this.grid.get(r + offsets.ro, c + offsets.co);
      hexes.push(currentHex);
      this.triPreviews[i].setX(getX(r + offsets.ro, c + offsets.co));
      this.triPreviews[i].setY(getY(r + offsets.ro));

      if (!touching) {
        for (const n of this.neighbors(r + offsets.ro, c + offsets.co)) {
          if (
            n &&
            (n.hexType === 1 ||
              n.hexType === 2 ||
              n.hexType === 3 ||
              n.hexType === 4)
          ) {
            touching = true;
          }
        }
      }
    }

    if (
      touching &&
      hexes[0] &&
      hexes[0].hexType === 0 &&
      hexes[1] &&
      hexes[1].hexType === 0 &&
      hexes[2] &&
      hexes[2].hexType === 0
    ) {
      for (let i = 0; i < 3; i++) {
        this.triPreviews[i].setTexture(
          ["white", "windmill-bw", "grass-bw", "street-bw", "", "", "mine-bw"][
            trihex.hexes[i]
          ]
        );
      }
    } else {
      for (let i = 0; i < 3; i++) {
        this.triPreviews[i].setTexture(
          [
            "white",
            "windmill-red",
            "grass-red",
            "street-red",
            "",
            "",
            "mine-red",
          ][trihex.hexes[i]]
        );
      }
    }
  }

  placeTrihex(
    x: number,
    y: number,
    trihex: Trihex,
    onPlaceTile?: (tiles: Tile[]) => void
  ): boolean {
    if (trihex.shape === "a") {
      y -= HEX_HEIGHT / 2;
    }
    if (trihex.shape === "v") {
      y -= HEX_HEIGHT / 2;
      x -= HEX_WIDTH / 2;
    }
    const r = getRow(x, y);
    const c = getCol(x, y);

    const hexes: Hex[] = [];
    // console.log({ r, c, trihex });
    let touching = false;
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const offsets = (shapes as any)[trihex.shape][i];
      hexes.push(this.grid.get(r + offsets.ro, c + offsets.co)!);

      if (!touching) {
        for (const n of this.neighbors(r + offsets.ro, c + offsets.co)) {
          if (
            n &&
            (n.hexType === 1 ||
              n.hexType === 2 ||
              n.hexType === 3 ||
              n.hexType === 4)
          ) {
            touching = true;
            break;
          }
        }
      }
    }
    if (
      touching &&
      hexes[0] &&
      hexes[0].hexType === 0 &&
      hexes[1] &&
      hexes[1].hexType === 0 &&
      hexes[2] &&
      hexes[2].hexType === 0
    ) {
      this.scene.sound.play("place");
      // prepare data for network call
      const tiles: Tile[] = [];
      for (let i = 0; i < 3; i++) {
        hexes[i].setType(trihex.hexes[i]);
        tiles.push({
          row: hexes[i].row,
          col: hexes[i].col,
          tile_type: trihex.hexes[i],
        });
      }

      // calculate scores
      for (let i = 0; i < 3; i++) {
        this.getPointsFor(hexes[i]);
      }

      onPlaceTile && onPlaceTile(tiles);

      this.updateEdges();
      return true;
    } else {
      return false;
    }
  }

  // returns connected hexes INCLUDING itself
  getConnected(hex: Hex): Hex[] {
    const connectedHexes = [];
    const visited = new Set<Hex>();
    const queue = new Queue<Hex>();
    queue.enq(hex);

    while (queue.size() > 0) {
      const h = queue.deq()!;
      if (!visited.has(h)) connectedHexes.push(h);
      visited.add(h);

      for (const n of this.neighbors(h.row, h.col)) {
        if (
          n &&
          (n.hexType === h.hexType || (h.hexType === 3 && n.hexType === 5)) &&
          !visited.has(n)
        ) {
          queue.enq(n);
        }
      }
    }

    return connectedHexes;
  }

  getPointsFor(hex: Hex) {
    if (hex.counted) return;

    if (hex.hexType === 1) {
      let isolated = true;
      for (const h of this.neighbors(hex.row, hex.col)) {
        if (h && h.hexType === 1) {
          isolated = false;
          if (h.counted) {
            h.counted = false;
            this.scoreQueue.enq(
              new ScorePopper(this.scene, [h], h.hasHill ? -3 : -1)
            );
          }
        }
      }
      if (isolated) {
        this.scoreQueue.enq(
          new ScorePopper(this.scene, [hex], hex.hasHill ? 3 : 1)
        );
        hex.counted = true;
      }
    } else if (hex.hexType === 2) {
      const group = this.getConnected(hex);

      const uncountedParks = [];
      for (const park of group) {
        if (!park.counted) uncountedParks.push(park);
      }
      while (uncountedParks.length >= 3) {
        const newParks = uncountedParks.splice(0, 3);
        newParks[0].counted = true;
        newParks[1].counted = true;
        newParks[2].counted = true;
        this.scoreQueue.enq(new ScorePopper(this.scene, newParks, 5));
      }
    } else if (hex.hexType === 3) {
      for (const h of this.neighbors(hex.row, hex.col)) {
        if (h && h.hexType === 4 && !hex.counted) {
          this.scoreQueue.enq(new ScorePopper(this.scene, [hex], 1));
          hex.counted = true;
        }
      }
      const group = this.getConnected(hex);
      let connectedToCenter = false;
      for (const h of group) {
        if (h.hexType === 3 && h.counted) connectedToCenter = true;
      }
      if (connectedToCenter) {
        for (const h of group) {
          if (!h.counted) {
            this.scoreQueue.enq(
              new ScorePopper(this.scene, [h], h.hexType === 5 ? 3 : 1)
            );
            h.counted = true;
          }
        }
      }
    } else if (hex.hexType === 6) {
      this.scoreQueue.enq(new ScorePopper(this.scene, [hex], 3));
    }
  }

  nextPopper() {
    if (this.scoreQueue.size() > 0) {
      const p = this.scoreQueue.deq()!;
      p.pop();

      if (this.onNewPoints) {
        this.onNewPoints(p.points, p.hexes[0].hexType);
      }

      for (const h of p.hexes) {
        h.upgrade();
        if (p.points > 0) h.puff();
      }

      if (p.points > 0) {
        if (p.hexes[0].hexType === 3) {
          this.scene.sound.play("pop", { volume: 0.5 });
        }
        if (p.hexes[0].hexType === 2) {
          this.scene.sound.play("tree", { volume: 0.5 });
        }
        if (p.hexes[0].hexType === 1) {
          if (p.hexes[0].hasHill) {
            this.scene.sound.play("windmill-hill", {
              volume: 0.6,
            });
          } else {
            this.scene.sound.play("windmill", { volume: 0.6 });
          }
        }
        if (p.hexes[0].hexType === 5) {
          this.scene.sound.play("port", { volume: 0.9 });
        }
        if (p.hexes[0].hexType === 6) {
          this.scene.sound.play("digging", { volume: 1 });
        }
      }
    } else if (this.onQueueEmpty) {
      this.onQueueEmpty();
      this.onQueueEmpty = null;
    }
  }
}

export function getY(row: number) {
  return 100 + row * HEX_HEIGHT * 0.75;
}

export function getX(row: number, col: number) {
  return (col + 0.5 * row) * HEX_WIDTH - 50;
}

export function getRow(_: number, y: number) {
  return Math.floor((y - 100 + 0.4 * HEX_HEIGHT) / (HEX_HEIGHT * 0.75));
}

export function getCol(x: number, y: number) {
  return Math.floor(
    (x + 50 + 0.5 * HEX_WIDTH) / HEX_WIDTH - 0.5 * getRow(x, y)
  );
}
