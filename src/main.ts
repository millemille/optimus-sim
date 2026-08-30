import "./style.css";
import { Game } from "./game/Game.ts";

const canvas = document.getElementById("view");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("canvas #view missing");
}

const game = new Game(canvas);
game.start();
