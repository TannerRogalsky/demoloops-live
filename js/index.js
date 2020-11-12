import { Demoloop, init_codemirror_pass, RhaiMode } from '../target/pkg';
import CodeMirror from 'codemirror';
import ReactDOM from 'react-dom';
import App from './components/App';
import DEFAULT_LOOP from './components/default_loop';
import "./styles.css";

init_codemirror_pass(CodeMirror.Pass);
CodeMirror.defineMode("rhai", (cfg, mode) => {
    return new RhaiMode(cfg.indentUnit);
});

let reactContainer = document.createElement('div');
document.body.appendChild(reactContainer);

const state = {
    loopRef: (ref) => {
        let demoloop = new Demoloop();
        demoloop.update(DEFAULT_LOOP);

        let loop = () => {
            demoloop.step();
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
        state.loop = demoloop;
        ReactDOM.render(App(state), reactContainer);
    },
    loop: null,
}
ReactDOM.render(App(state), reactContainer);
