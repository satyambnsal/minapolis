import { Scene } from "phaser";

export class LoadScene extends Scene {
  constructor() {
    super("load");
  }

  preload() {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x000000, 0.2);
    progressBox.fillRect(240, 270, 320, 50);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: "Loading...",
      style: {
        font: "20px monospace",
        color: "#000000",
      },
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: "0%",
      style: {
        font: "18px monospace",
        color: "#000000",
      },
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: "",
      style: {
        font: "18px monospace",
        color: "#000000",
      },
    });
    assetText.setOrigin(0.5, 0.5);

    this.load.on("progress", function (value: number) {
      percentText.setText(Math.ceil(value * 100) + "%");
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.load.on("fileprogress", function (file: any) {
      assetText.setText("Loading asset: " + file.key);
    });
    this.load.on("complete", function () {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    this.load.image("white", "/img/white.png");
    this.load.image("edge-e", "/img/edge-e.png");
    this.load.image("edge-ne", "/img/edge-ne.png");
    this.load.image("edge-nw", "/img/edge-nw.png");
    this.load.image("edge-w", "/img/edge-w.png");
    this.load.image("edge-sw", "/img/edge-sw.png");
    this.load.image("edge-se", "/img/edge-se.png");
    this.load.image("empty", "/img/empty.png");
    this.load.image("empty-hill", "/img/empty-hill.png");

    this.load.image("mine", "/img/mine.png");
    this.load.image("mine-bw", "/img/mine-bw.png");
    this.load.image("mine-red", "/img/mine-red.png");
    this.load.image("grass", "/img/grass.png");
    this.load.image("grass-bw", "/img/grass-bw.png");
    this.load.image("grass-red", "/img/grass-red.png");
    this.load.image("tree", "/img/tree.png");
    this.load.image("tree-bw", "/img/tree-bw.png");
    this.load.image("street", "/img/street.png");
    this.load.image("street-red", "/img/street-red.png");
    this.load.image("street-bw", "/img/street-bw.png");
    this.load.image("house", "/img/house.png");
    this.load.image("house-bw", "/img/house-bw.png");
    this.load.image("center", "/img/center.png");
    this.load.image("center-bw", "/img/center-bw.png");
    this.load.image("windmill", "/img/windmill.png");
    this.load.image("propeller", "/img/propeller.png");
    this.load.image("gold-coin", "/img/gold-coin.png");
    this.load.image("windmill-red", "/img/windmill-red.png");
    this.load.image("windmill-hill", "/img/windmill-hill.png");
    this.load.image("windmill-bw", "/img/windmill-bw.png");
    this.load.image("windmill-hill-bw", "/img/windmill-hill-bw.png");
    this.load.image("port-bw", "/img/port.png");
    this.load.spritesheet("port", "/img/port-color.png", {
      frameWidth: 140,
      frameHeight: 140,
    });

    this.load.image("blue", "/img/blue.png");
    this.load.image("rotate", "/img/rotate.png");
    this.load.image("question", "/img/question.png");
    this.load.image("x", "/img/x.png");
    this.load.image("help-page", "/img/help-page.png");
    this.load.image("page", "/img/page.png");
    this.load.image("waves", "/img/waves.png");
    this.load.image("waves2", "/img/waves2.png");
    this.load.image("particle", "/img/particle.png");
    this.load.image("next_arrow", "/img/next_arrow.png");
    this.load.image("a-shape", "/img/a-shape.png");
    this.load.image("c-shape", "/img/c-shape.png");
    this.load.image("slash-shape", "/img/slash-shape.png");

    this.load.spritesheet("tutorial-button", "/img/tutorial-button.png", {
      frameWidth: 811,
      frameHeight: 91,
    });

    this.load.image("play-button", "/img/playBtn.png");
    this.load.image("play-again-button", "/img/play-again-button.png");
    this.load.image("how-to-play-button", "/img/howtoplay.png");
    this.load.image("play-free-demo-button", "/img/playFreeDemo.png");
    this.load.image("share-score-button", "/img/shareScoreBtn.png");

    this.load.bitmapFont("font", "/font/font.png", "/font/font.fnt");

    this.load.audio("ambience", "/sfx/ambience.wav");
    this.load.audio("pop", "/sfx/pop.wav");
    this.load.audio("place", "/sfx/place.wav");
    this.load.audio("tree", "/sfx/tree.wav");
    this.load.audio("windmill", "/sfx/windmill.wav");
    this.load.audio("windmill-hill", "/sfx/windmill-hill.wav");
    this.load.audio("port", "/sfx/port.wav");
    this.load.audio("splash", "/sfx/splash.wav");
    this.load.audio("click", "/sfx/click.wav");
    this.load.audio("digging", "/sfx/digging.mp3");

    this.load.text("levels", "/data/levels.json");
  }

  create() {
    this.scene.start("menu");
  }
}
