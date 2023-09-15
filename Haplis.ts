var canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
var score: number, timer: number, gameTick: number, multiplier: number;
var gameboard: number[][];
var currentPiece: { x: number; y: number; c: number } = null;
var keyLeft: boolean = false,
    keyRight: boolean = false,
    keyDown: boolean = false,
    fastFall: boolean = false,
    isBuffered: boolean = null,
    autoPlay: boolean = false,
    smartAI: boolean = false,
    canSwap: boolean = true;
const width: number = 10,
    height: number = 20,
    size: number = 32,
    fullWidth: number = (10 + width) * size,
    fullHeight: number = (1 + height) * size;
var haplominoes: ImageData[] = [];
var bg: ImageData;
var nextPieces: number[] = [],
    holdPiece: number;
function OnLoad() {
    canvas = <HTMLCanvasElement>document.getElementById("canvas");
    canvas.width = fullWidth;
    canvas.height = fullHeight;
    ctx = canvas.getContext("2d");
    GenerateImageData().then(PlayMusic);
}
function StartGame() {
    PlayMusic();
    gameboard = [];
    nextPieces = [];
    score = gameTick = multiplier = 0;
    currentPiece = holdPiece = isBuffered = null;
    keyLeft = keyRight = keyDown = fastFall = autoPlay = smartAI = false;
    canSwap = true;
    for (var i: number = 0; i < 4; i++) nextPieces.push(RandomColor());
    for (var i: number = 0; i < height; i++) {
        gameboard[i] = [];
        for (var j: number = 0; j < width; j++) gameboard[i][j] = 0;
    }
    Draw();
    timer = setInterval(GameLoop, 1000 / 60);
}
document.onkeydown = function EnterKey(e) {
    PlayMusic();
    if (timer == null) StartGame();
    if (e.code == "KeyA" || e.code == "KeyJ" || e.code == "ArrowLeft") {
        keyLeft = true;
        keyRight = false;
        isBuffered = false;
    } else if (e.code == "KeyD" || e.code == "KeyL" || e.code == "ArrowRight") {
        keyLeft = false;
        keyRight = true;
        isBuffered = false;
    } else if (e.code == "Space" && canSwap) {
        canSwap = false;
        let tempColor = currentPiece.c;
        currentPiece = { x: 4, y: 0, c: holdPiece };
        holdPiece = tempColor;
        if (currentPiece.c == null) currentPiece = GetNextPiece();
    } else if (e.code == "KeyS" || e.code == "KeyK" || e.code == "ArrowDown") keyDown = true;
    else if (e.code == "KeyW" || e.code == "KeyI" || e.code == "ArrowUp") fastFall = true;
    else if (e.code == "Equal" && e.altKey && e.shiftKey) {
        autoPlay = !autoPlay;
        smartAI = false;
    } else if (e.code == "Equal" && e.altKey) {
        autoPlay = false;
        smartAI = !smartAI;
        if (smartAI) isBuffered = true;
        else isBuffered = true;
    }
};
document.onkeyup = function EnterKey(e) {
    if (e.repeat) return;
    if (e.code == "KeyA" || e.code == "ArrowLeft") {
        if (isBuffered != null && isBuffered) isBuffered = false;
        else keyLeft = false;
    } else if (e.code == "KeyD" || e.code == "ArrowRight") {
        if (isBuffered != null && isBuffered) isBuffered = false;
        else keyRight = false;
    } else if (e.code == "KeyS" || e.code == "KeyK" || e.code == "ArrowDown") keyDown = false;
};
function GameLoop() {
    gameTick++;
    MoveUpdate();
    GravityUpdate();
}
function MoveUpdate() {
    if (fastFall) return;
    if (currentPiece != null) {
        if (smartAI) {
            keyLeft = keyRight = false;
            let first = gameboard[0].indexOf(0),
                last = gameboard[0].lastIndexOf(0),
                x;
            if (first == last) x = -1;
            else if (first <= width - last - 1 && first != 4) x = first;
            else x = last;
            if (isBuffered != null && gameboard[height - 1].filter((e) => e).length < 0) isBuffered = null;
            if (x == -1 || isBuffered != null) {
                fastFall = true;
                isBuffered = true;
            } else if (x - currentPiece.x > 0) keyRight = true;
            else if (x - currentPiece.x < 0) keyLeft = true;
            else fastFall = true;
        } else if (autoPlay) {
            keyLeft = keyRight = false;
            isBuffered = null;
            let x = gameboard[height - 1].findIndex((e) => !e);
            if (x - currentPiece.x > 0) keyRight = true;
            else if (x - currentPiece.x < 0) keyLeft = true;
            else fastFall = true;
        }
        if (keyLeft && currentPiece.x != 0 && !gameboard[currentPiece.y][currentPiece.x - 1]) {
            currentPiece.x--;
            if (isBuffered != null && !isBuffered) {
                isBuffered = null;
                keyLeft = false;
            } else if (isBuffered != null && isBuffered) isBuffered = false;
            Draw();
        } else if (keyRight && currentPiece.x != width - 1 && !gameboard[currentPiece.y][currentPiece.x + 1]) {
            currentPiece.x++;
            if (isBuffered != null && !isBuffered) {
                isBuffered = null;
                keyRight = false;
            } else if (isBuffered != null && isBuffered) isBuffered = false;
            Draw();
        }
    }
}
function GravityUpdate() {
    if ((keyDown && gameTick % 3 == 0) || fastFall || gameTick % 64 == 0) {
        gameTick = 0;
        if (currentPiece == null || currentPiece == undefined) {
            currentPiece = GetNextPiece();
            if (gameboard[0][4]) {
                GameOver();
                return;
            }
        } else {
            if (currentPiece.y + 1 == height || gameboard[currentPiece.y + 1][currentPiece.x]) {
                gameboard[currentPiece.y][currentPiece.x] = currentPiece.c;
                if (CheckRow(currentPiece.y)) {
                    score += ++multiplier * 100;
                }
                currentPiece = null;
                canSwap = true;
                fastFall = false;
            } else {
                currentPiece.y++;
                if (fastFall) score += 2;
                else if (keyDown) score++;
            }
        }
        Draw();
    }
}
function Draw() {
    ctx.putImageData(bg, 0, 0);
    ctx.fillStyle = "FFA000";
    ctx.fillRect(0, 0, 100, 100);
    for (var i: number = 0; i < height; i++)
        for (var j: number = 0; j < width; j++) {
            if (gameboard[i][j]) ctx.putImageData(haplominoes[gameboard[i][j]], (j + 5) * size, i * size);
        }
    if (currentPiece != null)
        ctx.putImageData(haplominoes[currentPiece.c], (currentPiece.x + 5) * size, currentPiece.y * size);
    for (let i = 0; i < nextPieces.length; i++)
        if (nextPieces[i] != null) ctx.putImageData(haplominoes[nextPieces[i]], (width + 7) * size, (i * 2 + 7) * size);
    if (holdPiece != null) ctx.putImageData(haplominoes[holdPiece], 2 * size, 5 * size);
    ctx.fillStyle = "#FFF";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("" + score, 2.5 * size, 10.8 * size, size * 3);
}
function CheckRow(y: number) {
    if (!gameboard[y].every((e) => e)) return false;
    gameboard.splice(y, 1);
    gameboard.splice(0, 0, Array(width).fill(0));
    return true;
}
function GameOver() {
    clearInterval(timer);
    Draw();
    ctx.fillStyle = "#FFF";
    ctx.font = "80px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME", ((width + 10) / 2) * size, 9 * size, (width - 2) * size);
    ctx.fillText("OVER", ((width + 10) / 2) * size, 11 * size, (width - 2) * size);
    ctx.fillStyle = "#FFF";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Final Score: " + score, ((width + 10) / 2) * size, 12.25 * size, (width - 2) * size);
    var highScore: number = GetHighScore();
    ctx.fillText("High Score: " + highScore, ((width + 10) / 2) * size, 32.25 * size, (width - 2) * size);
    timer = null;
}
function GetHighScore() {
    if (window.localStorage) {
        var highScore: number = JSON.parse(window.localStorage.getItem("haplis-highscore"));

        if (typeof highScore == "undefined" || !highScore) highScore = score;
        // Keep to 5 at most
        if (highScore < score) highScore = score;

        // Write to localStorage
        window.localStorage.setItem("haplis-highscore", JSON.stringify(highScore));
        return highScore;
    } else return score;
}
async function GenerateImageData() {
    function GenerateHaplomino(base: string, light: string, dark: string): ImageData {
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, 2, size - 2);
        ctx.fillRect(0, 0, size - 2, 2);
        ctx.fillStyle = dark;
        ctx.fillRect(size - 2, 2, 2, size);
        ctx.fillRect(2, size - 2, size, 2);
        return ctx.getImageData(0, 0, size, size);
    }
    haplominoes = [
        GenerateHaplomino("#303030", "#505050", "#101010"), // Grey - 0
        GenerateHaplomino("#DEDE30", "#FFFF50", "#4A4A10"), // Yellow - 1
        GenerateHaplomino("#30DEDE", "#50FFFF", "#4A4A10"), // Cyan - 2
        GenerateHaplomino("#30DE30", "#50FF50", "#104A4A"), // Lime - 3
        GenerateHaplomino("#DE30DE", "#FF50FF", "#4A104A"), // Purple - 4
        GenerateHaplomino("#DE3030", "#FF5050", "#4A1010"), // Red - 5
        GenerateHaplomino("#3030DE", "#5050FF", "#10104A"), // Blue - 6
        GenerateHaplomino("#FF6A30", "#FF8A50", "#DE4A10"), // Orange - 7
        GenerateHaplomino("#DEDEDE", "#FFFFFF", "#4A4A4A"), // White - 8
        GenerateHaplomino("#4E4E4E", "#838383", "#1A1A1A"), // L.Gray - 9
    ];
    let haplominoBg = createImageBitmap(haplominoes[9]);
    ctx.fillStyle = ctx.createPattern(await haplominoBg, "repeat");
    ctx.fillRect(0, 0, fullWidth, fullHeight);
    ctx.fillStyle = "#000";
    ctx.fillRect(size * 5, 0, width * size, height * size);
    ctx.fillRect(size, 4 * size, 3 * size, 3 * size);
    ctx.fillRect((width + 6) * size, 6 * size, 3 * size, 9 * size);
    ctx.fillStyle = "#FFF";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("HOLD", 2.5 * size, 3.8 * size, size * 3);
    ctx.fillText("SCORE", 2.5 * size, 9.8 * size, size * 3);
    ctx.fillText("NEXT", (width + 7.5) * size, 5.8 * size, size * 3);
    bg = ctx.getImageData(0, 0, fullWidth, fullHeight);
}
function GetNextPiece(): { x: number; y: number; c: number } {
    nextPieces.push(RandomColor());
    return { x: 4, y: 0, c: nextPieces.shift() };
}
function RandomColor(): number {
    var selectedColor = 0;
    for (var i = 0; i < 6; i++) {
        selectedColor = Math.ceil(Math.random() * 7);
        if (nextPieces.findIndex((e) => e == selectedColor) == -1) break;
    }
    return selectedColor;
}
function PlayMusic() {
    var p = (<HTMLAudioElement>document.getElementById("jams")).play();
    p.then(() => {}).catch((e) => {});
}
