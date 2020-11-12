import { Demoloop, init_codemirror_pass, RhaiMode } from '../target/pkg';

import CodeMirror from 'codemirror';
import "codemirror/lib/codemirror.css";
import "codemirror/addon/comment/comment";
import "codemirror/addon/display/rulers";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/search/match-highlighter";
import "codemirror/addon/selection/active-line";

import "./styles.css";

const DEFAULT_LOOP = `\
fn update(ratio, width, height) {
    let ctx = Context();
    ctx.clear(Color(0.4, 0.4, 0.8, 1.0));

    let n = 6;
    let radius = 50.0;
    let inner_radius = 10.0;

    let exterior_angle = 360.0 / n.to_float();
    let interior_angle = 180.0 - exterior_angle;
    let side = 2.0 * (radius + inner_radius) * (180.0 / n.to_float()).sin();
    let apothem = radius * (180.0 / n.to_float()).cos();

    let central_shape = RegularPolygon(0.0, 0.0, n, radius);
    let central_color = Color(0.6, 0.2, 0.6, 1.0);

    let outer_shape = RegularPolygon(0.0, 0.0, 6, inner_radius);
    let outer_color = Color(0.2, 0.2, 0.8, 1.0);

    let black = Color(0.0, 0.0, 0.0, 1.0);

    for y in range(0, 10) {
        for x in range(0, 10) {
            let x_offset = (y % 2).to_float() * 0.5;
            let x_offset = x.to_float() + x_offset;
            let x = x_offset * radius * 2.0;
            let y = y.to_float() * apothem * 2.0;
            
            let origin = Translation(x, y);
            ctx.draw(central_shape, origin, central_color);
            ctx.stroke(central_shape, origin, black);
        }
    }

    for y in range(0, 10) {
        for x in range(0, 10) {
            let x_offset = (y % 2).to_float() * 0.5;
            let x_offset = x.to_float() + x_offset;
            let x = x_offset * radius * 2.0;
            let y = y.to_float() * apothem * 2.0;
            
            let origin = Translation(x, y);

            for i in range(0, n) {
                let inner_ratio = i.to_float() / n.to_float();
                let mu = inner_ratio * 360.0;
                let outer_transform = origin 
                    * Rotation(mu)
                    * Translation(radius + inner_radius, 0.0)
                    * Rotation(interior_angle)
                    * Translation(side * ratio, 0.0)
                    ;

                ctx.draw(outer_shape, outer_transform, outer_color);
                // ctx.stroke(outer_shape, outer_transform, black);
            }
        }
    }

    ctx
}`;

init_codemirror_pass(CodeMirror.Pass);
CodeMirror.defineMode("rhai", (cfg, mode) => {
    return new RhaiMode(cfg.indentUnit);
});

var editor = CodeMirror(document.body, {
    value: DEFAULT_LOOP,
    mode:  "rhai",
    theme: "default",
    lineNumbers: true,
    indentUnit: 4,
    matchBrackets: true,
    viewportMargin: Infinity,
    foldGutter: {
        rangeFinder: CodeMirror.fold.brace,
    },
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    styleActiveLine: true,
    highlightSelectionMatches: {
        minChars: 3,
        showToken: true,
        annotateScrollbar: true,
    },
    rulers: [
    {
        column: 80,
        color: "#ccc",
    },
    ],
    autoCloseBrackets: {
        pairs: `()[]{}''""`,
        closeBefore: `)]}'":;,`,
        triples: "",
        explode: "()[]{}",
    },
    extraKeys: {
        Tab: cm => {
            // This function is a modification of `defaultTab` to insert soft
            // tab instead of hard tab.
            if (cm.somethingSelected()) {
                cm.indentSelection("add");
            } else {
                cm.execCommand("insertSoftTab");
            }
        },
        "Ctrl-/": "toggleComment",
    },
});

let canvas = document.createElement('canvas');
canvas.id = "canvas";
document.body.appendChild(canvas);

let demoloop = new Demoloop();
demoloop.update(DEFAULT_LOOP);

editor.on('change', (editor, changes) => {
    const result = demoloop.update(editor.getValue());
    if (result) {
        console.error(result);
    }
});

let loop = () => {
    demoloop.step();
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);