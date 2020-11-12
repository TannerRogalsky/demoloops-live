export default `\
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