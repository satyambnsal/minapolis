import { getShareScoreTwitterContent } from "@/lib/utils";
import {
  COMPETITION_SCORE_TWEET_DEFAULT_CONTENT,
  GAME_ENTRY_FEE_KEY,
} from "../../constants";
import {
  HexGrid,
  Trihex,
  shapes,
  Hex,
  HEX_HEIGHT,
  HEX_WIDTH,
} from "../hex-grid";
import { Button, pick, shuffle } from "../util";
import { Scene, GameObjects, Input, Math as PhaserMath } from "phaser";

export class MainScene extends Scene {
  grid: HexGrid | null = null;
  foreground: GameObjects.Image | null = null;
  nextType = 0;
  nextTrihex: Trihex | null = null;
  nextNextTrihex: Trihex | null = null;
  trihexDeck: Trihex[] = [];
  bigPreviewTrihex: Hex[] = [];
  bigPreviewContainer: GameObjects.Container | null = null;
  deckCounterImage: GameObjects.Image | null = null;
  deckCounterText: GameObjects.BitmapText | null = null;
  rotateLeftButton: Button | null = null;
  rotateRightButton: Button | null = null;
  openHelpButton: Button | null = null;
  closeHelpButton: Button | null = null;
  helpPage: GameObjects.Image | null = null;
  score = 0;
  initialTime = 0;
  scoreBreakdown: number[] = [];
  scoreText: GameObjects.BitmapText | null = null;

  timerText: GameObjects.BitmapText | null = null;
  timedEvent: Phaser.Time.TimerEvent | null = null;

  waves: GameObjects.Image | null = null;
  waves2: GameObjects.Image | null = null;

  pointerDown = false;
  previewX = 0;
  previewY = 0;

  gameOverText: GameObjects.BitmapText | null = null;
  rankText: GameObjects.BitmapText | null = null;
  nextRankText: GameObjects.BitmapText | null = null;
  competitionNameText: GameObjects.BitmapText | null = null;
  currentTimeText: GameObjects.BitmapText | null = null;
  playAgainButton: GameObjects.BitmapText | null = null;
  shareButton: GameObjects.Image | null = null;

  timerBackground: GameObjects.Rectangle | null = null


  // playAgainButton: Button | null = null;
  breakdownContainer: GameObjects.Container | null = null;
  breakdownHexes: Hex[] = [];
  breakdownTexts: GameObjects.BitmapText[] = [];

  constructor() {
    super("main");
  }

  create() {
    this.add.rectangle(640, 360, 1280, 720);
    const bgImage = this.add.image(640, 360, "map_pattern");
    bgImage.setScale(0.2);
    bgImage.setAlpha(0.1);
    this.score = 0;
    this.scoreBreakdown = [0, 0, 0, 0, 0, 0];

    this.pointerDown = false;

    // this.waves = this.add.image(640, 360, 'waves');
    // this.waves2 = this.add.image(640, 360, 'waves2');

    this.grid = new HexGrid(this, 5, 8, 0, 0, this.onNewPoints.bind(this));
    this.trihexDeck = this.createTrihexDeck(25, true);

    this.scoreText = this.add.bitmapText(150, 30, "font", "0 points", 60);
    this.scoreText.setDepth(4);

    this.rotateLeftButton = new Button(
      this,
      125,
      180,
      "rotate",
      this.rotateLeft.bind(this)
    );
    this.rotateLeftButton.setDepth(3.5);
    this.rotateLeftButton.setFlipX(true);
    this.rotateRightButton = new Button(
      this,
      375,
      180,
      "rotate",
      this.rotateRight.bind(this)
    );
    this.rotateRightButton.setDepth(3.5);

    this.openHelpButton = new Button(
      this,
      410,
      640,
      "question",
      this.openHelp.bind(this)
    );
    this.openHelpButton.setDepth(3.5);

    this.closeHelpButton = new Button(
      this,
      1210,
      640,
      "x",
      this.closeHelp.bind(this)
    );
    this.closeHelpButton.setDepth(5.1);
    this.closeHelpButton.setVisible(false);

    this.deckCounterText = this.add.bitmapText(
      240,
      620,
      "font",
      String(this.trihexDeck.length),
      60
    );
    this.deckCounterText.setOrigin(0.5, 0.45);
    this.deckCounterText.setDepth(3.6);

    this.deckCounterImage = this.add.image(240, 620, "a-shape");
    this.deckCounterImage.setDepth(3.5);
    this.deckCounterImage.setAlpha(0.5);

    this.bigPreviewContainer = this.add.container(1050, 325);
    this.bigPreviewContainer.setDepth(4);

    this.bigPreviewTrihex = [];
    for (let i = 0; i < 3; i++) {
      const h = new Hex(this, 0, 0, -1, -1);
      h.embiggen();
      h.setDepth(4);
      this.bigPreviewTrihex.push(h);
      this.bigPreviewContainer.add(h);
      this.bigPreviewContainer.add(h.edges.getChildren());
      this.bigPreviewContainer.add(h.propeller);
    }

    this.helpPage = this.add.image(640, 360, "help-page");
    this.helpPage.setScale(0.4);
    this.helpPage.setDepth(5);
    this.helpPage.setVisible(false);

    this.pickNextTrihex();

    // this.foreground = this.add.image(1600, 360, "page");
    // this.foreground.setDepth(3);

    // this.tweens.add({
    //   targets: this.foreground,
    //   props: { x: 2400 },
    //   duration: 400,
    // });

    this.tweens.add({
      targets: this.rotateLeftButton,
      props: { x: this.rotateLeftButton.x + 800 },
      duration: 400,
    });

    this.tweens.add({
      targets: this.openHelpButton,
      props: { x: this.openHelpButton.x + 800 },
      duration: 400,
    });

    this.tweens.add({
      targets: this.rotateRightButton,
      props: { x: this.rotateRightButton.x + 800 },
      duration: 400,
    });

    this.tweens.add({
      targets: this.scoreText,
      props: { x: this.scoreText.x + 800 },
      duration: 400,
    });

    this.tweens.add({
      targets: [this.deckCounterText, this.deckCounterImage],
      props: { x: this.deckCounterText.x + 800 },
      duration: 400,
    });

    this.input.on(Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.input.on(Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Input.Events.POINTER_UP, this.onPointerUp, this);
    this.input.keyboard?.on(
      Input.Keyboard.Events.ANY_KEY_DOWN,
      this.onKeyDown,
      this
    );

    this.input.on("wheel", this.onMouseWheel, this);


    const isTimerGame = this.game.registry.get("isTimerGame");
    if(isTimerGame){
      this.initialTime = 15;
      this.timerText = this.add.bitmapText(900, 100, "font", `Remaining Time : ${this.formatTime(this.initialTime)}`, 44);
      this.timerText.setTint(0x00ff7f);
      this.timedEvent = this.time.addEvent({ delay: 1000, callback: this.onEvent, callbackScope: this, loop: true });
      
      // Add a background for the timer
      // this.timerBackground = this.add.rectangle(1000, 100, 400, 60, 0x000000, 0.5);
      // this.timerBackground.setOrigin(0.5);
      // this.timerBackground.setDepth(this.timerText.depth - 1);
    }
}


onEvent() {
  this.initialTime -= 1; 
  this.timerText?.setText(`Remaining Time : ${this.formatTime(this.initialTime)}`);
  
  if (this.initialTime <= 10) {
    // Change color to yellow at 10 seconds
    this.timerText?.setTint(0xffff00);
  }
  
  if (this.initialTime <= 5) {
    // Change color to red at 5 seconds
    this.timerText?.setTint(0xff0000);
    this.pulseAndShakeTimer();
  }

  if(this.initialTime === 0){
    this.timedEvent?.remove();
    this.grid!.onQueueEmpty = this.endGame.bind(this);
    this.grid!.deactivate();
    this.timerText?.setPosition(900, 100);
    this.timerText?.setScale(1);
  }
}

pulseAndShakeTimer() {
  // Pulse animation
  this.tweens.add({
    targets: this.timerText,
    scale: 1.05,
    duration: 200,
    yoyo: true,
    repeat: 1,
    ease: 'Sine.easeInOut'
  });

  // Shake animation
  this.tweens.add({
    targets: this.timerText,
    x: 900 + Phaser.Math.Between(-6, 6),
    y: 100 + Phaser.Math.Between(-6, 6),
    duration: 50,
    yoyo: true,
    repeat: 3,
    ease: 'Sine.easeInOut'
  });
}

  onNewPoints(points: number, hexType: number) {
    this.score += points;
    this.scoreBreakdown[hexType] += points;
    this.scoreText?.setText(String(this.score) + " points");
  }

  async onPlaceTile() {
    //TODO: call mina contract to place a new tile
  }

  openHelp() {
    this.helpPage?.setVisible(true);
    this.closeHelpButton?.setVisible(true);
    this.openHelpButton?.setVisible(false);
    this.grid?.deactivate();
  }

  closeHelp() {
    this.helpPage?.setVisible(false);
    this.closeHelpButton?.setVisible(false);
    this.openHelpButton?.setVisible(true);
    this.grid?.activate();
  }

  onMouseWheel(event: WheelEvent) {
    if (event.deltaY > 0) {
      this.rotateRight();
    }
    if (event.deltaY < 0) {
      this.rotateLeft();
    }
  }

  rotateRight() {
    this.nextTrihex?.rotateRight();
    this.grid?.updateTriPreview(this.previewX, this.previewY, this.nextTrihex!);
    this.updateBigTrihex();
  }

  rotateLeft() {
    this.nextTrihex?.rotateLeft();
    this.grid?.updateTriPreview(this.previewX, this.previewY, this.nextTrihex!);
    this.updateBigTrihex();
  }

  updateBigTrihex() {
    for (let i = 0; i < 3; i++) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const row = shapes[this.nextTrihex.shape][i].ro;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const col = shapes[this.nextTrihex.shape][i].co;

      if (this.nextTrihex?.shape === "a") {
        this.bigPreviewTrihex[i].setX(HEX_WIDTH * 1.5 * (col + 0.5 * row));
        this.bigPreviewTrihex[i].setY(HEX_HEIGHT * 1.125 * row);
      } else if (this.nextTrihex?.shape === "v") {
        this.bigPreviewTrihex[i].setX(
          HEX_WIDTH * 1.5 * (col - 0.5 + 0.5 * row)
        );
        this.bigPreviewTrihex[i].setY(HEX_HEIGHT * 1.125 * row);
      } else {
        this.bigPreviewTrihex[i].setX(HEX_WIDTH * 1.5 * (col + 0.5 * row));
        this.bigPreviewTrihex[i].setY(HEX_HEIGHT * 1.125 * row);
      }

      this.bigPreviewTrihex[i].setType(this.nextTrihex?.hexes[i]!);
      if (this.nextTrihex?.hexes[i] === 0)
        this.bigPreviewTrihex[i].setVisible(false);
    }
  }

  createTrihexDeck(size: number, allShapes?: boolean): Trihex[] {
    let deck: Trihex[] = [];
    for (let i = 0; i < size; i++) {
      if (allShapes) {
        if (i < size / 3) {
          deck.push(new Trihex(0, 0, 0, pick(["a", "v"])));
        } else if (i < size / 1.5) {
          deck.push(new Trihex(0, 0, 0, pick(["/", "-", "\\"])));
        } else {
          deck.push(new Trihex(0, 0, 0, pick(["c", "r", "n", "d", "j", "l"])));
        }
      } else {
        deck.push(new Trihex(0, 0, 0, "a"));
      }
    }
    deck = shuffle(deck);
    for (let i = 0; i < size; i++) {
      if (i < size / 2) {
        deck[i].hexes[0] = 3;
      } else {
        deck[i].hexes[0] = 1;
      }
    }
    deck = shuffle(deck);
    for (let i = 0; i < size; i++) {
      if (i < size / 2) {
        deck[i].hexes[1] = 3;
      } else {
        deck[i].hexes[1] = 2;
      }
    }
    deck = shuffle(deck);
    for (let i = 0; i < size; i++) {
      if (i < size / 2) {
        deck[i].hexes[2] = 3;
      } else {
        deck[i].hexes[2] = 2;
      }
      deck[i].hexes = shuffle(deck[i].hexes);
    }
    deck = shuffle(deck);
    return deck;
  }

  pickNextTrihex() {
    if (this.trihexDeck.length > 0) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.nextTrihex = this.trihexDeck.pop();

      this.deckCounterText?.setText(String(this.trihexDeck.length));

      if (this.trihexDeck.length > 0) {
        this.deckCounterImage?.setTexture(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          {
            a: "a-shape",
            v: "a-shape",
            "/": "slash-shape",
            "-": "slash-shape",
            "\\": "slash-shape",
            c: "c-shape",
            r: "c-shape",
            n: "c-shape",
            d: "c-shape",
            j: "c-shape",
            l: "c-shape",
          }[this.trihexDeck[this.trihexDeck.length - 1].shape]
        );
      } else {
        this.deckCounterImage?.setVisible(false);
        this.deckCounterText?.setText("");
      }
      this.updateBigTrihex();

      this.bigPreviewContainer?.setPosition(
        this.deckCounterImage?.x,
        this.deckCounterImage?.y
      );
      this.bigPreviewContainer?.setScale(0.2);

      this.tweens.add({
        targets: this.bigPreviewContainer,
        props: {
          x: 1050,
          y: 325,
          scale: 1,
        },
        duration: 400,
      });
    } else {
      this.bigPreviewContainer?.setVisible(false);
      this.nextTrihex = new Trihex(0, 0, 0, "a");
    }
  }

  waitForFinalScore() {
    this.grid!.onQueueEmpty = this.endGame.bind(this);
  }

  endGame() {
    const handleSaveScore = this.game.registry.get("handleSaveScore");
    const isDemoGame = this.game.registry.get("isDemoGame");
    const competitionKey = this.game.registry.get("competitionKey");

    const isTimerGame = this.game.registry.get("isTimerGame");

      if(isTimerGame){
          this.timedEvent?.remove();
      }

    if (this.scoreText) {
      handleSaveScore(this.score);
      console.log("data send to database");
    }

    this.grid!.sinkBlanks();
    try {
      window.sessionStorage.removeItem(GAME_ENTRY_FEE_KEY);
    } catch (err) {
      console.error("failed to unset game entry fees key");
    }

    this.tweens.add({
      targets: [
        this.bigPreviewContainer,
        this.rotateLeftButton,
        this.rotateRightButton,
        this.deckCounterImage,
        this.deckCounterText,
        this.openHelpButton,
      ],
      props: {
        alpha: 0,
      },
      duration: 300,
    });

    this.tweens.add({
      targets: this.scoreText,
      props: {
        y: 150,
      },
      duration: 700,
      ease: PhaserMath.Easing.Quadratic.Out,
    });

    let rank, message1, message2;
    if (this.score === 0) {
      // Z rank
      rank = "Rank: Z";
      message1 = "What!?";
      message2 = "(That's honestly impressive!)";
    } else if (this.score < 70) {
      // E rank
      rank = "Rank: E";
      message1 = "Finished!";
      message2 = "(Next rank at 70 points)";
    } else if (this.score < 80) {
      // D rank
      rank = "Rank: D";
      message1 = "Not bad!";
      message2 = "(Next rank at 80 points)";
    } else if (this.score < 90) {
      // C rank
      rank = "Rank: C";
      message1 = "Good job!";
      message2 = "(Next rank at 90 points)";
    } else if (this.score < 100) {
      // B rank
      rank = "Rank: B";
      message1 = "Well done!";
      message2 = "(Next rank at 100 points)";
    } else if (this.score < 110) {
      // A rank
      rank = "Rank: A";
      message1 = "Excellent!";
      message2 = "(Next rank at 110 points)";
    } else if (this.score < 120) {
      // A+ rank
      rank = "Rank: A+";
      message1 = "Amazing!";
      message2 = "(Next rank at 120 points)";
    } else if (this.score < 125) {
      // S rank
      rank = "Rank: S";
      message1 = "Incredible!!";
      message2 = "(This is the highest rank!)";
    } else {
      // S rank (perfect)
      rank = "Rank: S";
      message1 = "A perfect score!!";
      message2 = "(This is the highest rank!)";
    }

    this.gameOverText = this.add.bitmapText(1500, 70, "font", message1, 60);
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setDepth(4);

    this.rankText = this.add.bitmapText(1500, 460, "font", rank, 60);
    this.rankText.setOrigin(0.5);
    this.rankText.setDepth(4);

    this.nextRankText = this.add.bitmapText(1500, 520, "font", message2, 40);
    this.nextRankText.setOrigin(0.5);
    this.nextRankText.setDepth(4);

    this.competitionNameText = this.add.bitmapText(
      1500,
      570,
      "font",
      `Competition Key: ${competitionKey}`,
      24
    );
    this.competitionNameText.setOrigin(0.5);
    this.competitionNameText.setDepth(4);

    const currentTime: string = this.getGameStartTime();
    this.currentTimeText = this.add.bitmapText(
      1500,
      590,
      "font",
      `Played At: ${currentTime}`,
      24
    );
    this.currentTimeText.setOrigin(0.5);
    this.currentTimeText.setDepth(4);

    if (isDemoGame) {
      this.playAgainButton = this.add
        .bitmapText(1400, 630, "font", "Play Again", 40)
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5)
        .on("pointerover", () => {
          this.tweens.add({
            targets: this.playAgainButton,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 60,
            ease: "Linear",
          });
        })
        .on("pointerover", () => {
          this.tweens.add({
            targets: this.playAgainButton,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 60,
            ease: "Linear",
          });
        })
        .on("pointerout", () =>
          this.tweens.add({
            targets: this.playAgainButton,
            scaleX: 1,
            scaleY: 1,
            duration: 60,
            ease: "Linear",
          })
        )
        .on("pointerdown", () => {
          this.tweens.add({
            targets: this.playAgainButton,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 60,
            ease: "Linear",
          });
          this.playAgain();
        })
        .on("pointerup", () => {
          this.playAgain();
        })
        .setDepth(4);
    }

    this.shareButton = this.add
      .image(1450, 700, "share-score-button")
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        this.tweens.add({
          targets: this.shareButton,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 60,
          ease: "Linear",
        });
      })
      .on("pointerover", () => {
        this.tweens.add({
          targets: this.shareButton,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 60,
          ease: "Linear",
        });
      })
      .on("pointerout", () =>
        this.tweens.add({
          targets: this.shareButton,
          scaleX: 1,
          scaleY: 1,
          duration: 60,
          ease: "Linear",
        })
      )
      .on("pointerdown", () => {
        this.tweens.add({
          targets: this.shareButton,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 60,
          ease: "Linear",
        });
        // this.navigateToExternalSite(getShareScoreTwitterContent(this.score));
      })
      .on("pointerup", () => {
        const scoreTweetContent =
          this.game.registry.get("scoreTweetContent") ||
          COMPETITION_SCORE_TWEET_DEFAULT_CONTENT;
        this.navigateToExternalSite(
          getShareScoreTwitterContent(scoreTweetContent, this.score)
        );
      })
      .setDepth(4);

    this.breakdownContainer = this.add.container(1500, 300);
    this.breakdownContainer.setDepth(4);

    this.breakdownHexes = [];
    this.breakdownTexts = [];

    for (let i = 0; i < 3; i++) {
      const h = new Hex(this, 0, 0, -1, -1);
      h.embiggen();
      h.setDepth(4);
      this.breakdownContainer.add(h);
      this.breakdownHexes.push(h);
      this.breakdownContainer.add(h.edges.getChildren());
      this.breakdownContainer.add(h.propeller);

      const t = this.add.bitmapText(0, 80, "font", "0", 40);
      t.setOrigin(0.5);
      this.breakdownTexts.push(t);
      this.breakdownContainer.add(t);
    }

    this.breakdownHexes[0].setType(3);
    this.breakdownHexes[0].upgrade();
    this.breakdownHexes[0].setX(-125);
    this.breakdownTexts[0].setX(-125);
    this.breakdownTexts[0].setText(
      String(this.scoreBreakdown[3] + this.scoreBreakdown[5])
    );

    this.breakdownHexes[1].setType(2);
    this.breakdownHexes[1].upgrade();
    this.breakdownTexts[1].setText(String(this.scoreBreakdown[2]));

    this.breakdownHexes[2].setType(1);
    this.breakdownHexes[2].setX(125);
    this.breakdownTexts[2].setX(125);
    this.breakdownTexts[2].setText(String(this.scoreBreakdown[1]));

    this.tweens.add({
      targets: this.gameOverText,
      props: { x: 1040 },
      delay: 300,
      duration: 300,
      ease: PhaserMath.Easing.Quadratic.Out,
    });

    this.tweens.add({
      targets: this.breakdownContainer,
      props: { x: 1040 },
      delay: 600,
      duration: 300,
      ease: PhaserMath.Easing.Quadratic.Out,
    });

    this.tweens.add({
      targets: [this.rankText, this.nextRankText],
      props: { x: 1040 },
      delay: 900,
      duration: 300,
      ease: PhaserMath.Easing.Quadratic.Out,
    });

    this.tweens.add({
      targets: [this.competitionNameText, this.currentTimeText],
      props: { x: 1040 },
      delay: 1200,
      duration: 300,
      ease: PhaserMath.Easing.Quadratic.Out,
    });

    if (isDemoGame) {
      this.tweens.add({
        targets: this.playAgainButton,
        props: { x: 1040 },
        delay: 1200,
        duration: 300,
        ease: PhaserMath.Easing.Quadratic.Out,
      });
    }

    this.tweens.add({
      targets: this.shareButton,
      props: { x: 1040 },
      delay: 1500,
      duration: 300,
      ease: PhaserMath.Easing.Quadratic.Out,
    });
  }

  playAgain() {
    this.breakdownContainer?.setVisible(false);
    this.gameOverText?.setVisible(false);
    this.nextRankText?.setVisible(false);
    this.rankText?.setVisible(false);
    this.playAgainButton?.setVisible(false);
    this.shareButton?.setVisible(false);
    this.scoreText?.setVisible(false);

    // this.tweens.add({
    //   targets: this.foreground,
    //   props: { x: 1600 },
    //   duration: 400,
    // });

    this.time.addEvent({
      callback: this.scene.restart,
      callbackScope: this.scene,
      delay: 500,
    });
  }

  navigateToExternalSite(url: string) {
    window.open(url, "_blank");
  }

 formatTime(seconds: number): string {
    // Minutes
    const minutes = Math.floor(seconds / 60);
    // Seconds
    let partInSeconds: number | string = seconds % 60;
    // Adds left zeros to seconds
    partInSeconds = partInSeconds.toString().padStart(2, '0');
    // Returns formated time
    return `${minutes}:${partInSeconds}`;
}



  onPointerUp(event: Input.Pointer) {
    if (this.pointerDown) {
      this.previewX = event.worldX;
      this.previewY = event.worldY;
      this.placeTrihex();
    }
    this.pointerDown = false;
  }

  placeTrihex() {
    if (!this.grid?.enabled) return;
    if (
      this.grid.placeTrihex(
        this.previewX,
        this.previewY,
        this.nextTrihex!,
        this.onPlaceTile.bind(this)
      )
    ) {
      this.pickNextTrihex();

      if (
        this.nextTrihex?.hexes[0] === 0 ||
        !this.grid.canPlaceShape(this.nextTrihex?.shape!)
      ) {
        this.time.addEvent({
          callback: this.waitForFinalScore,
          callbackScope: this,
          delay: 1000,
        });
        this.grid.deactivate();
      }
      this.grid.updateTriPreview(-100, -100, this.nextTrihex!);
    }
  }

  onPointerDown(event: Input.Pointer) {
    if (event.worldX === this.previewX && event.worldY === this.previewY) {
      this.placeTrihex();
    } else {
      this.previewX = event.worldX;
      this.previewY = event.worldY;
      this.grid?.updateTriPreview(event.worldX, event.worldY, this.nextTrihex!);
    }
    this.pointerDown = true;
  }

  onPointerMove(event: Input.Pointer) {
    this.previewX = event.worldX;
    this.previewY = event.worldY;
    this.grid?.updateTriPreview(event.worldX, event.worldY, this.nextTrihex!);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.keyCode === 39 || event.keyCode === 68) {
      this.rotateRight();
    }
    if (event.keyCode === 37 || event.keyCode === 65) {
      this.rotateLeft();
    }
  }

  getGameStartTime(): string {
    const now: Date = new Date();

    const months: string[] = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const month: string = months[now.getUTCMonth()];
    const day: number = now.getUTCDate();
    const year: number = now.getUTCFullYear();
    const hours: string = now.getUTCHours().toString().padStart(2, "0");
    const minutes: string = now.getUTCMinutes().toString().padStart(2, "0");
    const seconds: string = now.getUTCSeconds().toString().padStart(2, "0");

    return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds} UTC`;
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    for (const hex of this.grid!.hexes) {
      hex.update(time, delta);
    }

    this.waves?.setX(640 + Math.sin(time * 0.001) * 10);
    this.waves2?.setX(640 - Math.sin(time * 0.001) * 10);
  }
}
