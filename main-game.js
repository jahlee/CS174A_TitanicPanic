import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class main_game extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            planet1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            planet2: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(4),
            planet3: new defs.Subdivision_Sphere(2)

        };

        // *** Materials
        this.materials = {
            rocket: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 1, color: hex_color("#87ceeb")}),
            planet1: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 1, specularity: 0.5, color: color(1, 0, 0, 1)}),
            planet2: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 1, specularity: 0.5, color: color(0, 1, 0, 1)}),
            planet3: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 1, specularity: 0.5, color: color(0, 0, 1, 1)})
        }


        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
    }

    make_control_panel() {
        this.key_triggered_button("Go Left", ["x"], () => {
            this.MIDDLE = false;
            this.LEFT = true;
            this.RIGHT = false;
        }); 

        this.key_triggered_button("Go Middle", ["c"], () => {
            this.MIDDLE = true;
            this.RIGHT = false;
            this.LEFT = false;
        }); 

        this.key_triggered_button("Go Right", ["v"], () => {
            this.MIDDLE = false;
            this.RIGHT = true;
            this.LEFT = false;
        });  
    }

    display(context, program_state) {
        // setting camera
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 1000);

        // variable initialization .
        let model_transform = Mat4.identity();

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        const radius = Math.sin(t/5 * 2 * Math.PI) + 2;
        const angle = t;

        // set light to emit from the rocket
        const light_position = vec4(0, 2, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // create transformations for rocket and planets
        this.rocket = model_transform.times(Mat4.translation(0, 0, 13.5)).times(Mat4.scale(2, 2, 2)).times(Mat4.scale(1.2, 1, 2));

        // use modulus to make planets cycle back to initial position after 2, 3, 4 seconds
        this.planet1 = model_transform.times(Mat4.translation(0, 0, -60)).times(Mat4.translation(0, 0, (t%2)*75 - 50)).times(Mat4.rotation(angle, 0, 1, 0)).times(Mat4.scale(1.5, 1.5, 1.5));
        this.planet2 = model_transform.times(Mat4.translation(-4, 0, -60)).times(Mat4.translation(0, 0, (t%3 - 1)*75 - 50)).times(Mat4.rotation(-angle, 0, 1, 0)).times(Mat4.scale(1.5, 1.5, 1.5));
        this.planet3 = model_transform.times(Mat4.translation(4, 0, -60)).times(Mat4.translation(0, 0, (t%4 - 1)*75 - 50)).times(Mat4.rotation(-angle, 0, 1, 0)).times(Mat4.scale(1.5, 1.5, 1.5));

        // bullets??

        // button controls
        // TO-DO
        if (this.RIGHT) {
            this.rocket = this.rocket.times(Mat4.translation(2, 0, 0));
        }

        if (this.LEFT) {
            this.rocket = this.rocket.times(Mat4.translation(-2, 0, 0));
        }

        if (this.MIDDLE) {
            this.rocket = this.rocket
        }

        this.shapes.sphere.draw(context, program_state, this.rocket, this.materials.rocket);
        this.shapes.planet1.draw(context, program_state, this.planet1, this.materials.planet1);
        this.shapes.planet2.draw(context, program_state, this.planet2, this.materials.planet2);
        this.shapes.planet3.draw(context, program_state, this.planet3, this.materials.planet3);
    }
}