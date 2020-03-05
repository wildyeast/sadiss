# wasm-fm-synth

wasm-fm-synth will be a browser synthesizer/sequencer. The sound engine is
taken from https://rustwasm.github.io/docs/wasm-bindgen/examples/web-audio.html

To build this, [Rust](https://www.rust-lang.org/tools/install) and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) have to be installed. Then run

```
$ yarn install
$ yarn serve
```

The app will run on localhost:8080.

You can use `yarn lint` to invoke eslint and `yarn fix` to autofix.
