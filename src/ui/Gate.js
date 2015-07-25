import Util from "src/base/Util.js"
import MathPainter from "src/ui/MathPainter.js"
import Matrix from "src/math/Matrix.js"
import GateDrawParams from "src/ui/GateDrawParams.js"
import Config from "src/Config.js"
import Point from "src/math/Point.js"
import Rect from "src/math/Rect.js"

/**
 * A described and possibly time-varying quantum operation.
 */
export default class Gate {
    /**
     * @param {!string} symbol The text shown inside the gate's box when drawn on the circuit.
     * @param {!Matrix|!function(!number): !Matrix} matrixOrFunc The operation the gate applies.
     * @param {!string} name A helpful human-readable name for the operation.
     * @param {!string} blurb A helpful description of what the operation does.
     * @param {!string} details A helpful description of what the operation does.
     * @param {!function(!GateDrawParams)=} symbolDrawer
     *
     * @property {!string} symbol
     * @property {!Matrix|!function(!number): !Matrix} matrixOrFunc
     * @property {!string} name
     * @property {!string} blurb
     * @property {!string} details
     * @property {!function} symbolDrawer
     */
    constructor(symbol, matrixOrFunc, name, blurb, details, symbolDrawer) {
        this.symbol = symbol;
        this.matrixOrFunc = matrixOrFunc;
        this.name = name;
        this.blurb = blurb;
        this.details = details;
        this.symbolDrawer = symbolDrawer || Gate.DEFAULT_DRAWER;
    }

    /**
     * @param {!number} time
     * @returns {!Matrix}
     */
    matrixAt(time) {
        return this.matrixOrFunc instanceof Matrix ? this.matrixOrFunc : this.matrixOrFunc(time);
    }

    /**
     * @param {!number} fraction
     * @param {!string} symbol
     * @returns {!Gate}
     */
    static fromPhaseRotation(fraction, symbol) {
        let mod = (n, d) => ((n % d) + d) % d;
        let dif_mod = (n, d) => mod(n + d/2, d) - d/2;
        let deg = dif_mod(fraction, 1) * 360;
        let deg_desc = (Math.round(deg*64)/64).toString();
        let name_desc =
            fraction === 1/3 ? "/3"
                : fraction === -1/3 ? "-/3"
                : fraction === 1/8 ? "/8"
                : fraction === -1/8 ? "-/8"
                : fraction === 1/16 ? "/16"
                : fraction === -1/16 ? "-/16"
                : (Math.round(deg*64)/64).toString() + "°";

        return new Gate(
            symbol || `Z(${name_desc})`,
            Matrix.fromPauliRotation(0, 0, fraction),
            `${deg_desc}° Phase Gate`,
            `Rotates the phase of a qubit's ON state by ${deg_desc}° while leaving its OFF state alone.`,
            `The standard Pauli Z gate corresponds to Z(180°).`);
    }

    /**
     * @param {!number} x
     * @param {!number} y
     * @param {!number} z
     * @param {=string} symbol
     * @returns {!Gate}
     */
    static fromPauliRotation(x, y, z, symbol) {
        if (x === 0 && y === 0) {
            return Gate.fromPhaseRotation(z, symbol);
        }

        let n = Math.sqrt(x * x + y * y + z * z);
        let deg = n * 360;
        return new Gate(
            symbol || `R(${[x, y, z].map(e => Format.SIMPLIFIED.formatFloat(e)).toString()})`,
            Matrix.fromPauliRotation(x, y, z),
            `${deg}° around <${x/n}, ${y/n}, ${z/n}>`,
            "A custom operation based on a rotation.",
            "",
            symbol === undefined ? Gate.MATRIX_DRAWER : Gate.DEFAULT_DRAWER);
    }

    /**
     * @param {!Matrix} matrix
     * @returns {!Gate}
     */
    static fromCustom(matrix) {
        return new Gate(
            matrix.toString(Format.MINIFIED),
            matrix,
            matrix.toString(Format.SIMPLIFIED),
            "A custom operation.",
            "",
            Gate.MATRIX_DRAWER);
    }

    /**
     *
     * @param {!number} p
     * @param {!string} fractionLabel
     * @param {=string} fractionSymbol
     * @returns {!Gate}
     */
    static fromTargetedRotation(p, fractionLabel, fractionSymbol) {
        Util.need(p >= -1 && p <= 1, arguments);
        return new Gate(
            `∠${fractionSymbol || fractionLabel}`,
            Matrix.fromTargetedRotation(p),
            `${fractionLabel} Target Rotation Gate`,
            `A tuned rotation gate that maps an OFF input to an output with ${fractionLabel} probability of being ON.`,
            `Equivalent to R(acos(√(${fractionLabel}))).`);
    }

    isTimeBased() {
        return !(this.matrixOrFunc instanceof Matrix);
    }

    /**
     * @param {!Painter} painter
     * @param {!Rect} areaRect
     * @param {!boolean} isInToolbox
     * @param {!boolean} isHighlighted
     * @param {!number} time
     * @param {?CircuitContext} circuitContext
     */
    paint(painter, areaRect, isInToolbox, isHighlighted, time, circuitContext) {
        this.symbolDrawer(new GateDrawParams(
            painter,
            isInToolbox,
            isHighlighted,
            areaRect,
            this,
            time,
            circuitContext));
    }

    toString() {
        return `Gate(${this.symbol})`;
    }
}

/**
* @param {!GateDrawParams} args
*/
Gate.DEFAULT_DRAWER = args => {
    let backColor = Config.GATE_FILL_COLOR;
    if (!args.isInToolbox && !args.gate.matrixAt(args.time).isApproximatelyUnitary(0.001)) {
        backColor = Config.BROKEN_COLOR_GATE;
    }
    if (args.isHighlighted) {
        backColor = Config.HIGHLIGHT_COLOR_GATE;
    }
    args.painter.fillRect(args.rect, backColor);
    args.painter.strokeRect(args.rect);
    let fontSize = 16;
    args.painter.printLine(
        args.gate.symbol,
        args.rect.paddedBy(-2).takeTopProportion(0.85),
        0.5,
        Config.DEFAULT_TEXT_COLOR,
        fontSize);
};

/**
 * @param {!GateDrawParams} args
*/
Gate.MATRIX_DRAWER = args => {
    args.painter.fillRect(args.rect, args.isHighlighted ? Config.HIGHLIGHT_COLOR_GATE : Config.GATE_FILL_COLOR);
    MathPainter.paintMatrix(
        args.painter,
        args.gate.matrixAt(args.time),
        args.rect,
        []);
    if (args.isHighlighted) {
        args.painter.ctx.globalAlpha = 0.9;
        args.painter.fillRect(args.rect, Config.HIGHLIGHT_COLOR_GATE);
        args.painter.ctx.globalAlpha = 1;
    }
};

/**
* @param {!GateDrawParams} args
*/
Gate.CYCLE_DRAWER = args => {
    if (args.isInToolbox && !args.isHighlighted) {
        Gate.DEFAULT_DRAWER(args);
        return;
    }
    let t = args.time * 2 * Math.PI;
    let d = new Point(
        Math.cos(t) * 0.75 * args.rect.w/2,
        -Math.sin(t) * 0.75 * args.rect.h/2);
    let p = args.rect.center().plus(d);
    Gate.DEFAULT_DRAWER(args);
    args.painter.fillCircle(p, 3, "gray");
};

/**
* @param {!GateDrawParams} args
*/
Gate.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX = args => {
    if (args.isInToolbox) {
        Gate.DEFAULT_DRAWER(args);
        return;
    }
    Gate.MATRIX_DRAWER(args);
};
