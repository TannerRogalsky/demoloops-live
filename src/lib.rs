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

#[wasm_bindgen]
pub struct Demoloop {
    ctx: demoloop::LoopContext,
    width: f32,
    height: f32,
    /// Duration as seconds
    duration: f32,
}

fn initialize_engine(ctx: &mut ScriptContext) {
    use rhai::RegisterFn;
    use solstice_2d::*;
    fn register_shape<G: solstice_2d::Geometry + Clone + 'static>(engine: &mut rhai::Engine) {
        engine
            .register_fn("draw", Context::draw::<G>)
            .register_fn("draw", Context::draw_with_color::<G>)
            .register_fn("draw", Context::draw_with_transform::<G>)
            .register_fn("draw", Context::draw_with_transform_and_color::<G>)
            .register_fn("draw", Context::draw_with_shader::<G>)
            .register_fn("stroke", Context::stroke::<G>)
            .register_fn("stroke", Context::stroke_with_color::<G>)
            .register_fn("stroke", Context::stroke_with_transform::<G>)
            .register_fn("stroke", Context::stroke_with_transform_and_color::<G>);
    }

    let ScriptContext { engine, .. } = ctx;
    // default is 32. 0 is unlimited.
    engine.set_max_expr_depths(0, 0);

    engine
        .register_type::<Color>()
        .register_fn("Color", Color::new);
    engine
        .register_type::<Rectangle>()
        .register_fn("Rectangle", Rectangle::new);
    register_shape::<Rectangle>(engine);
    engine
        .register_type::<RegularPolygon>()
        .register_fn("RegularPolygon", |x: f32, y: f32, v: i32, r: f32| {
            RegularPolygon::new(x, y, v as u32, r)
        })
        .register_fn("RegularPolygon", RegularPolygon::new);
    register_shape::<RegularPolygon>(engine);

    use std::ops::{Mul, MulAssign};
    engine
        .register_type::<Transform>()
        .register_fn("*", Transform::mul)
        .register_fn("*=", Transform::mul_assign)
        .register_fn("Translation", Transform::translation)
        .register_fn("Scale", Transform::scale)
        .register_fn("Rotation", |phi: f32| Transform::rotation(Deg(phi)));

    engine.register_type::<Shader2D>();

    engine
        .register_type::<Context>()
        .register_fn("Context", Context::default)
        .register_fn("clear", Context::clear);
}

#[wasm_bindgen]
impl Demoloop {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Demoloop, JsValue> {
        let el = window::winit::event_loop::EventLoop::new();
        let mut ctx = LoopContext::new(&el).map_err(to_js)?;
        let (width, height) = ctx.ctx_2d.dimensions();

        initialize_engine(&mut ctx.script_ctx);
        Ok(Self {
            ctx,
            width,
            height,
            duration: 1.0,
        })
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
        ctx.gfx_mut().set_viewport(
            x as _,
            y as _,
            (desired_width * scale) as _,
            (desired_height * scale) as _,
        );
        let ratio = ctx.dt().as_secs_f32() % self.duration / self.duration;
        let mut d2 = ctx.ctx_2d.start(&mut ctx.ctx);

        let ScriptContext { engine, ast, scope } = &mut ctx.script_ctx;

        match engine.call_fn(scope, ast, "update", (ratio, desired_width, desired_height)) {
            Ok(Context { commands }) => {
                for command in commands {
                    match command {
                        Command::Draw(draw_state) => {
                            let DrawState {
                                shader,
                                draw_mode,
                                geometry,
                                transform,
                                color,
                            } = draw_state;
                            if let Some(shader) = shader {
                                d2.set_shader(shader);
                            }
                            d2.draw_with_transform_and_color(
                                draw_mode, geometry, transform, color.0,
                            );
                            d2.remove_active_shader();
                        }
                        Command::Clear(color) => d2.clear(color.0),
                    }
                }
            }
            Err(e) => log::error!("Runtime error: {}", e),
        }
    }
}
