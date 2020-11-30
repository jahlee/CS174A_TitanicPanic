import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

export class main_game extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // TODO: bottom right corner!, kept at 0,0,0 to make calculations easier
        const initial_corner_point1 = vec3(0, 0, 0);
        // TODO: how far each point is from each other
        const row_operation1 = (s, p) => p ? Mat4.translation(0, 0.5, 0).times(p.to4(1)).to3()
            : initial_corner_point1;
        const column_operation1 = (t, p) => Mat4.translation(0.5, 0, 0).times(p.to4(1)).to3();


        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            planet1: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            planet2: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(4),
            planet3: new defs.Subdivision_Sphere(2),
            water: new defs.Grid_Patch(75, 200, row_operation1, column_operation1)
            // TODO: # rows (-z), # cols (x) (length and width), operation for each row, col
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
                {ambient: 0.5, diffusivity: 1, specularity: 0.5, color: color(0, 0, 1, 1)}),
            water: new Material(new defs.Phong_Shader(),
                {ambient: 0.5, diffusivity: 1, specularity: 0.4, color: hex_color("#0000c0")})
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.boat_view = Mat4.identity();
    }

    display_scene(context, program_state) {
        const random = (x) => Math.sin(1000 * x + program_state.animation_time / 1000);

        // Update the JavaScript-side shape with new vertices:
        this.shapes.water.arrays.position.forEach((p, i, a) =>
            a[i] = vec3(p[0], p[1], 1.5 * random(i / a.length)));
        // TODO: p[0] and p[1] are the amt of horizontal and vertical value of plane, p[2] is for z direction
        // TODO: the .5*random determines the height at that point

        // Update the normals to reflect the surface's new arrangement.
        // This won't be perfect flat shading because vertices are shared.
        // this.shapes.water.flat_shade();

        // this.r = Mat4.rotation(-.5 * Math.sin(program_state.animation_time / 5000), 1, 1, 1);
        // this.r = Mat4.rotation(1.5, 1, 0, 0);

        // Draw the sheets, flipped 180 degrees so their normals point at us. TODO: the angle of 1.55 is a trail-and-error value
        const r = Mat4.rotation(Math.PI, 0, 1, 0).times(Mat4.rotation(1.55, 1, 0, 0));

        // Draw the current sheet shape.
        this.shapes.water.draw(context, program_state, Mat4.translation(50,-1.5,20).times(r), this.materials.water);
        // TODO: translation here specifies bottom right corner

        // Update the gpu-side shape with new vertices.
        // Warning:  You can't call this until you've already drawn the shape once.
        this.shapes.water.copy_onto_graphics_card(context.context, ["position", "normal"], false);
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
        this.key_triggered_button("Boat view", ["b"], () => this.attached = () => this.initial_camera_location);
    }

    display(context, program_state) {
        // setting camera
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
        }

        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 100);

        // variable initialization .
        let model_transform = Mat4.identity();
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const angle = t;

        // set light to emit from the rocket
        const light_position = vec4(0, 2, 5, 1);
        const sun_pos = vec4(-25, 10, -100, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000), new Light(sun_pos, color(0,0.243,0.803,0), 1000)];

        // create transformations for rocket and planets
        this.rocket = model_transform.times(Mat4.translation(0, 0, 13.5)).times(Mat4.scale(2, 2, 2)).times(Mat4.scale(1.2, 1, 2));

        // use modulus to make planets cycle back to initial position after 2, 3, 4 seconds
        this.planet1 = model_transform.times(Mat4.translation(0, 0, -60)).times(Mat4.translation(0, 0, (t%2)*75 - 50)).times(Mat4.scale(1.5, 1.5, 1.5));
        this.planet2 = model_transform.times(Mat4.translation(-4, 0, -60)).times(Mat4.translation(0, 0, (t%3 - 1)*75 - 50)).times(Mat4.scale(1.5, 1.5, 1.5));
        this.planet3 = model_transform.times(Mat4.translation(4, 0, -60)).times(Mat4.translation(0, 0, (t%4 - 1)*75 - 50)).times(Mat4.scale(1.5, 1.5, 1.5));

        // bullets??

        // button controls
        // TO-DO
        if (this.RIGHT) {
            this.rocket = this.rocket.times(Mat4.translation(1, 0, 0));
        }

        if (this.LEFT) {
            this.rocket = this.rocket.times(Mat4.translation(-1, 0, 0));
        }

        if (this.MIDDLE) {
            this.rocket = this.rocket;
        }

        this.display_scene(context, program_state);
        this.shapes.sphere.draw(context, program_state, this.rocket, this.materials.rocket);
        this.shapes.planet1.draw(context, program_state, this.planet1, this.materials.planet1);
        this.shapes.planet2.draw(context, program_state, this.planet2, this.materials.planet2);
        this.shapes.planet3.draw(context, program_state, this.planet3, this.materials.planet3);

        if (this.attached) {
            if (this.attached() == this.initial_camera_location)
                program_state.set_camera(this.initial_camera_location);
        }
    }
}

class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;
        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec4 Vertex_color;
        //, vec3 N, vertex_worldspace;
        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );
                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                vec3 N = normalize( mat3( model_transform ) * normal / squared_scale);
                vec3 vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                // Compute an initial (ambient) color:
                vec4 color = vec4( shape_color.xyz * ambient, shape_color.w );
                // Compute the final color with contributions from lights:
                color.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                Vertex_color = color;
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){                                                           
                // Compute an initial (ambient) color:
                gl_FragColor = Vertex_color;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}