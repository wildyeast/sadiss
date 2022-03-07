extern crate console_error_panic_hook;
use std::panic;

use wasm_bindgen::prelude::*;
use web_sys::{AudioContext, OscillatorType};

/// Converts a midi note to frequency
///
/// A midi note is an integer, generally in the range of 21 to 108
pub fn midi_to_freq(note: u8) -> f32 {
    27.5 * 2f32.powf((note as f32 - 21.0) / 12.0)
}

#[wasm_bindgen]
pub struct FmOsc {
    ctx: AudioContext,
    /// The primary oscillator.  This will be the fundamental frequency
    primary: web_sys::OscillatorNode,

    /// Overall gain (volume) control
    gain: web_sys::GainNode,

    /// Amount of frequency modulation
    fm_gain: web_sys::GainNode,

    /// The oscillator that will modulate the primary oscillator's frequency
    fm_osc: web_sys::OscillatorNode,

    /// The ratio between the primary frequency and the fm_osc frequency.
    ///
    /// Generally fractional values like 1/2 or 1/4 sound best
    fm_freq_ratio: f32,

    fm_gain_ratio: f32,
}

impl Drop for FmOsc {
    fn drop(&mut self) {
        let _ = self.ctx.close();
    }
}

#[wasm_bindgen]
impl FmOsc {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<FmOsc, JsValue> {
        let ctx = web_sys::AudioContext::new()?;

        // Create our web audio objects.
        let primary = ctx.create_oscillator()?;
        let fm_osc = ctx.create_oscillator()?;
        let gain = ctx.create_gain()?;
        let fm_gain = ctx.create_gain()?;

        // Some initial settings:
        primary.set_type(OscillatorType::Sine);
        primary.frequency().set_value(440.0); // A4 note
        gain.gain().set_value(0.0); // starts muted
        fm_gain.gain().set_value(0.0); // no initial frequency modulation
        fm_osc.set_type(OscillatorType::Sine);
        fm_osc.frequency().set_value(0.0);

        // Connect the nodes up!

        // The primary oscillator is routed through the gain node, so that
        // it can control the overall output volume.
        primary.connect_with_audio_node(&gain)?;

        // Then connect the gain node to the AudioContext destination (aka
        // your speakers).
        gain.connect_with_audio_node(&ctx.destination())?;

        // The FM oscillator is connected to its own gain node, so it can
        // control the amount of modulation.
        fm_osc.connect_with_audio_node(&fm_gain)?;

        // Connect the FM oscillator to the frequency parameter of the main
        // oscillator, so that the FM node can modulate its frequency.
        fm_gain.connect_with_audio_param(&primary.frequency())?;

        // Start the oscillators!
        primary.start()?;
        fm_osc.start()?;

        Ok(FmOsc {
            ctx,
            primary,
            gain,
            fm_gain,
            fm_osc,
            fm_freq_ratio: 0.0,
            fm_gain_ratio: 0.0,
        })
    }

    /// Sets the gain for this oscillator, between 0.0 and 1.0.
    #[wasm_bindgen]
    pub fn set_gain(&self, mut gain: f32) {
        if gain > 1.0 {
            gain = 1.0;
        }
        if gain < 0.0 {
            gain = 0.0;
        }
        self.gain.gain().set_value(gain);
    }

    #[wasm_bindgen]
    pub fn set_freq(&self, freq: f32) {
        self.primary.frequency().set_value(freq);

        // The frequency of the FM oscillator depends on the frequency of the
        // primary oscillator, so we update the frequency of both in this method.
        self.fm_osc.frequency().set_value(self.fm_freq_ratio * freq);
        self.fm_gain.gain().set_value(self.fm_gain_ratio * freq);
    }

    #[wasm_bindgen]
    pub fn set_note(&self, note: u8) {
        let freq = midi_to_freq(note);
        self.set_freq(freq);
    }

    /// This should be between 0 and 1, though higher values are accepted.
    #[wasm_bindgen]
    pub fn set_amount(&mut self, amt: f32) {
        self.fm_gain_ratio = amt;

        self.fm_gain
            .gain()
            .set_value(self.fm_gain_ratio * self.primary.frequency().value());
    }

    /// This should be between 0 and 1, though higher values are accepted.
    #[wasm_bindgen]
    pub fn set_mod(&mut self, amt: f32) {
        self.fm_freq_ratio = amt;
        self.fm_osc
            .frequency()
            .set_value(self.fm_freq_ratio * self.primary.frequency().value());
    }
}

// The following makes printing to browser console from rust code possible.
// Like so: log($s)
// Copied from here: https://rustwasm.github.io/wasm-bindgen/examples/console-log.html
#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

// Importing JS performance.now()
#[link(wasm_import_module = "PerformanceNow")]
extern { fn performanceNow(); }

pub fn test () {
    let value = unsafe {performanceNow()};
    // log(value);
    return value;
}

// https://stackoverflow.com/questions/55375588/what-is-the-rust-equivalent-of-a-javascript-object-when-encoding-with-msgpack
use rmp_serde::{Deserializer, Serializer};
use serde::{Deserialize, Serialize};
use serde_json;

use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Breakpoint {
    time: f32,
    freq: f32,
    amp: f32,
    oscIndex: u8
}

use std::any::type_name;
fn print_type_of<T>(_: &T) {
    println!("{}", std::any::type_name::<T>())
}


#[wasm_bindgen]
pub fn play (all_breakpoints: &str) {
    // log(string);
    // let osc = FmOsc{};
    // let testValue = unsafe {test();};
    // log(testValue)
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    // let mut buf = Vec::new();

    // let test: HashMap<&str, &str> = Deserialize::deserialize(&mut Deserializer::new(&buf[..])).unwrap();
    // let b = serde_json::from_str(all_breakpoints).unwrap();
    // log(serde_json::from_str(all_breakpoints).unwrap());
    // log(all_breakpoints);

    untyped_example(all_breakpoints);

    // for name in names.iter() {
    //     match name {
    //         &"Ferris" => println!("There is a rustacean among us!"),
    //         // TODO ^ Try deleting the & and matching just "Ferris"
    //         _ => println!("Hello {}", name),
    //     }
    // }



}

// use serde_json::{Result, Value};
use std::fmt;
fn untyped_example(all_breakpoints: &str) -> serde_json::Result<()> {
    // Some JSON input data as a &str. Maybe this comes from the user.
    // let data = r#"
    //     {
    //         "name": "John Doe",
    //         "age": 43,
    //         "phones": [
    //             "+44 1234567",
    //             "+44 2345678"
    //         ]
    //     }"#;

    // Parse the string of data into serde_json::Value.
    // let v: serde_json::Value = serde_json::from_str(all_breakpoints)?;
    let v: Vec<serde_json::Value> = serde_json::from_str(all_breakpoints)?;

    log(&v.len().to_string());

    for item in &v {
        log(&item["amp"].to_string());
    }

    // Access parts of the data by indexing with square brackets.
    // log(&(&serde_json::Value::to_string(&v["breakpoints"][0]["amp"])));

    Ok(())
}