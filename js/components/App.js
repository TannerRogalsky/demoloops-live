import React from 'react';
import DEFAULT_LOOP from './default_loop';

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

export default function App(state) {
  const codeMirrorContainerRef = (ref) => {
    if (ref && !state.editor) {
      let editor = CodeMirror(ref, {
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

      editor.on('change', (editor, changes) => {
        const result = state.loop.update(editor.getValue());
        if (result) {
          console.error(result);
        }
      });
      
      state.editor = editor;
    }   
  }

  return (
    <div id="container">
      <div id="codeMirrorContainer" ref={codeMirrorContainerRef} />
      <div id="loopContainer">
        <canvas id="canvas" ref={state.loopRef} />
      </div>
    </div>
  );
}