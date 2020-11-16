import {defs, tiny} from './examples/common.js';

// Pull these names into this module's scope for convenience:
const {vec3, Mat4, color, hex_color, Material, Scene} = tiny;
const {Basic_Shader} = defs

const Minimal_Shape =
    class Minimal_Shape extends tiny.Vertex_Buffer {
        // **Minimal_Shape** an even more minimal triangle, with three
        // vertices each holding a 3D position and a color.
        constructor() {
            super("position", "color");
            // Describe the where the points of a triangle are in space, and also describe their colors:
            // TODO: Edit the position and color here
            this.arrays.position = [
                vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0),
            ];
            this.arrays.color = [
                color(1, 0, 0, 1), color(0, 1, 0, 1), color(0, 0, 1, 1), 
            ];
        }
    }


export class Assignment1_Scene extends Scene {
    // **Minimal_Webgl_Demo** is an extremely simple example of a Scene class.
    constructor(webgl_manager, control_panel) {
        super(webgl_manager, control_panel);
        // Don't create any DOM elements to control this scene:
        this.widget_options = {make_controls: false, show_explanation: false};
        // Send a Triangle's vertices to the GPU buffers:
        this.shapes = {triangle: new Minimal_Shape()};
        this.shader = new Basic_Shader();
    }

    display(context, graphics_state) {
        // Every frame, simply draw the Triangle at its default location.
        this.shapes.triangle.draw(context, graphics_state, Mat4.identity(), new Material(this.shader));
    }
}