mod cm_rhai_mode;
mod codemirror;

use demoloop::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn main() {
    wasm_logger::init(wasm_logger::Config::default());
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
}

fn to_js<D: std::fmt::Display>(i: D) -> JsValue {
    JsValue::from_str(i.to_string().as_str())
}

#[derive(Clone, Debug)]
struct Resources {
    canvas: solstice_2d::Canvas,
}

#[wasm_bindgen]
pub struct Demoloop {
    ctx: demoloop::LoopContext,
    width: f32,
    height: f32,
    /// Duration as seconds
    duration: f32,
}

#[wasm_bindgen]
impl Demoloop {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Demoloop, JsValue> {
        let el = window::winit::event_loop::EventLoop::new();
        let mut ctx = LoopContext::new(&el).map_err(to_js)?;
        let [width, height] = ctx.gfx.dimensions();

        let canvas = solstice_2d::Canvas::new(&mut ctx.ctx, width, height).map_err(to_js)?;
        let resources = Resources {
            canvas
        };

        // default is 32. 0 is unlimited.
        let ScriptContext { engine, scope, .. } = &mut ctx.script_ctx;
        engine.set_max_expr_depths(0, 0);
        demoloop::register_builtins(engine);

        engine.register_type::<Resources>().register_get("canvas", |l: &mut Resources| l.canvas.clone());
        scope.push("resources", resources.clone());


        Ok(Self {
            ctx,
            width,
            height,
            duration: 1.0,
        })
    }

    #[wasm_bindgen]
    pub fn get_duration(&self) -> f32 {
        self.duration
    }

    #[wasm_bindgen]
    pub fn set_duration(&mut self, duration: f32) -> Result<(), JsValue> {
        if duration > 0.0 {
            self.duration = duration;
            Ok(())
        } else {
            Err(JsValue::from_str("Duration must be greater than 0."))
        }
    }

    #[wasm_bindgen]
    pub fn update(&mut self, source: String) -> Result<(), JsValue> {
        let ScriptContext { engine, ast, .. } = &mut self.ctx.script_ctx;
        *ast = engine.compile(source.as_str()).map_err(to_js)?;
        Ok(())
    }

    #[wasm_bindgen]
    pub fn step(&mut self) {
        let ctx = &mut self.ctx;
        ctx.tick();
        let window::winit::dpi::PhysicalSize { width, height } = ctx.window().inner_size();

        let desired_width = self.width;
        let desired_height = self.height;

        let scale = (width as f32 / desired_width).min(height as f32 / desired_height);
        let x = (width as f32 - desired_width * scale) / 2.;
        let y = (height as f32 - desired_height * scale) / 2.;
        ctx.ctx.set_viewport(
            x as _,
            y as _,
            (desired_width * scale) as _,
            (desired_height * scale) as _,
        );
        let ratio = ctx.dt().as_secs_f32() % self.duration / self.duration;

        let ScriptContext { engine, ast, scope } = &mut ctx.script_ctx;

        match engine.call_fn(scope, ast, "update", (ratio, self.width, self.height)) {
            Ok(mut draw_list) => {
                ctx.gfx.process(&mut ctx.ctx, &mut draw_list);
            }
            Err(e) => log::error!("Runtime error: {}", e),
        }
    }
}
