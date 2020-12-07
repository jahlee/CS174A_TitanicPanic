import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import {Text_Line} from './examples/text-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture
} = tiny;

const {Cube, Textured_Phong} = defs

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function shuffle(array) {
    var tmp, current, top = array.length;
    if(top) while(--top) {
        current = Math.floor(Math.random() * (top +1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }
    return array;
}

export class main_game extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // TODO: bottom right corner!, kept at 0,0,0 to make calculations easier
        const initial_corner_point = vec3(0, 0, 0);
        // TODO: how far each point is from each other
        const row_operation = (s, p) => p ? Mat4.translation(0, 0.2, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation = (t, p) => Mat4.translation(0.2, 0, 0).times(p.to4(1)).to3();
        const row_operation2 = (s, p) => p ? Mat4.translation(0, 0.1, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation2 = (t, p) => Mat4.translation(0.1, 0, 0).times(p.to4(1)).to3();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            moon: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(4),
            iceberg: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            water: new defs.Grid_Patch(20, 20, row_operation, column_operation),
            back: new defs.Grid_Patch(10, 10, row_operation2, column_operation2),
            // boat: new Shape_From_File("./assets/Boat.obj"),
            // wheel: new Shape_From_File("./assets/SteeringWheel.obj"),
            mountain: new Shape_From_File("./assets/everest.obj"),
            mtn: new Shape_From_File("./assets/lowpolymountains.obj"),
            cube: new Cube(),
            boat2: new Shape_From_File("./assets/boat2.obj"),
            text: new Text_Line(45),
            // triangle: new defs.Triangle(),
            // axis: new defs.Axis_Arrows(),
            // t1: new defs.Rounded_Closed_Cone(10,10,[[0, 10], [0, 10]]),
            // t2: new defs.Closed_Cone(10,10,[[0, 10], [0, 10]]),
            // t3: new defs.Cone_Tip(10,10,[[0, 10], [0, 10]])
        };

        // *** Materials
        this.materials = {
            ice: new Material(new defs.Phong_Shader(),
                {ambient: 0.75, diffusivity: 0.5, color: hex_color("#87ceeb")}),
            water: new Material(new defs.Phong_Shader(), {
                ambient: 0.1, diffusivity: 1, specularity: 0, color: color(0.05, 0.05, 1, 0.875)}),
            old_water: new Material(new defs.Phong_Shader(),
                {ambient: 0, diffusivity: 1, specularity: 1, color: hex_color("#2a50B0")}),
            boat: new Material(new Gouraud_Shader(2),
                {ambient: 0.5, diffusivity: 1, specularity: 0.4, color: hex_color("#C19A6B")}),
            bumps: new Material(new defs.Fake_Bump_Map(1),
                {color: color(.5, .5, .5, 1), ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("./assets/stars.png")}),
            sky: new Material(new defs.Phong_Shader(),
                {ambient: 0.9, diffusivity: 0, specularity: 0, color: hex_color("#87ceeb")}),
            night_sky: new Material(new defs.Phong_Shader(),
                {ambient: 0.9, diffusivity: 0, specularity: 0, color: hex_color("#000000")}),
            sun: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0.3, specularity: 0, color: hex_color("#ec544c")}), // same as color(0.925,0.329,0.298,1)
            moon: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0.3, specularity: 0, color: hex_color("#F0E68C")}),
            mountain : new Material(new defs.Fake_Bump_Map(1), {
                color: color(.5, .5, .5, 1), ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("./assets/texture_map.png")}),
            texture2: new Material(new Texture_Scroll_X(), {
                color: hex_color("#111111"),
                ambient: .5, diffusivity: 0.3, specularity: 0.3,
                texture: new Texture("assets/oc.jpg")
            }),
            texture1: new Material(new Texture_Rotate(), {
                color: hex_color("#111111"),
                ambient: .5, diffusivity: 0.3, specularity: 0.3,
                texture: new Texture("assets/oc.jpg")
            }),
            boat2_fn: new Material(new defs.Fake_Bump_Map(1), {
                color: color(.5, .5, .5, 1), ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("./assets/Normal.png")}),
            boat2_fm: new Material(new defs.Fake_Bump_Map(1), {
                color: color(.5, .5, .5, 1), ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("./assets/MetalSmooth.png")}),
            boat2_fa: new Material(new defs.Fake_Bump_Map(1), {
                color: color(.5, .5, .5, 1), ambient: .3, diffusivity: .5, specularity: .5, texture: new Texture("./assets/AlbedoTpy.png")}),
            text_image: new Material(new defs.Textured_Phong(1), {ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text.png")}),
            // back_water: new Material(new defs.Phong_Shader(), {ambient: 1, diffusivity: 1, specularity: 1, texture: new Texture("assets/ocean_swish.jpg")}),
            back_water: new Material(new Texture_Scroll_X(), {ambient: 0.5, diffusivity: 0.5, specularity: 0.2, color: color(0.3,0.3,0.8,0.2), texture: new Texture("assets/oc.jpg")}),
            back_water2: new Material(new Texture_Rotate(), {ambient: 0.5, diffusivity: 0.5, specularity: 0.5, color: color(0.3,0.3,0.8,0.2), texture: new Texture("assets/oc.jpg")}),
            back_water3: new Material(new defs.Textured_Phong(1), {ambient: 0.8, diffusivity: 1, specularity: 0.7, color: color(0.3,0.3,0.8,0.2), texture: new Texture("assets/oc.jpg")}),
            cartoon: new Material(new defs.Textured_Phong(1), {ambient: 0.5, diffusivity: 0.5, specularity: 0.5, color: color(0,0,1,0.7), texture: new Texture("assets/cartoonsea.png")}),
            movecartoon: new Material(new Texture_Scroll_X(), {ambient: 0.5, diffusivity: 0.5, specularity: 0.2, color: color(0,0,0.35,0.8), texture: new Texture("assets/cartoonsea.png")}),  //hex_color("#00002A")
            rotatecartoon: new Material(new Texture_Rotate(), {ambient: 0.5, diffusivity: 0.5, specularity: 0.5, color: color(0,0,1,0.7), texture: new Texture("assets/cartoonsea.png")})
        };

        // this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.initial_camera_location = Mat4.look_at(vec3(0, 6, 15), vec3(0, 6, 0), vec3(0, 1, 0));
        this.boat_view = Mat4.identity();
        this.pre_points = 0;
        this.pre_position = 0; // boat's x position
        this.pre_position_y = 0;
        this.alive = true;
        //var values = [-5,-4,-3,-2,-1,0,1,2,3,4,5];
        //this.values = shuffle[values]
        //this.x = (getRandomInt(-20,20));
        this.a =3;
        this.size_count = 0;

        this.vel = 0;
        this.holding = false;
        this.stopL = true;
        this.stopR = true;
        this.pre_highscore = 0;
        this.new_highscore = false;

        this.rmountain1 = this.rmountain2 = this.rmountain3 = this.rmountain4 = this.lmountain1 = this.lmountain2 = this.lmountain3 = this.lmountain4 = Mat4.identity();

    }

    display_scene(context, program_state) {
        const random = (x) => Math.sin(1000 * x + program_state.animation_time / 1000);

        // Draw the sheets, flipped 180 degrees so their normals point at us.
        const r = Mat4.rotation(Math.PI, 0, 1, 0).times(Mat4.rotation(Math.PI/2, 1, 0, 0));
        // AFTER ROTATION, +x is LEFT, + y is INTO THE SCREEN, +z is DOWN

        // p[0] and p[1] are the amt of horizontal and vertical value of plane, p[2] is for z direction
        // the 1.75*random determines the height at that point
        this.shapes.water.arrays.position.forEach((p, i, a) =>
            a[i] = vec3(p[0], p[1], 1.75*Math.sin(random(i/a.length))));

        // Draw the current sheet shape.
        // translation here specifies bottom right corner
        // this.shapes.water.draw(context, program_state, Mat4.translation(45, 0, 35).times(r).times(Mat4.scale(22.5,37.5,1)), this.materials.movecartoon);
         this.shapes.water.draw(context, program_state, Mat4.translation(45, 0, 35).times(r).times(Mat4.scale(22.5,37.5,1)), this.materials.rotatecartoon);
        // this.shapes.water.draw(context, program_state, Mat4.translation(45, 0, 35).times(r).times(Mat4.scale(22.5,37.5,1)), this.materials.cartoon);
        // this.shapes.water.draw(context, program_state, Mat4.translation(45, 0, 35).times(r).times(Mat4.scale(22.5,37.5,1)), this.materials.water);

        // Update the gpu-side shape with new vertices.
        this.shapes.water.copy_onto_graphics_card(context.context, ["position", "normal"], false);

        // same for the back water behind the boat

        this.shapes.back.arrays.position.forEach((p, i, a) =>
            a[i] = vec3(p[0], p[1], 0.75*Math.sin(random(i/a.length))));
        this.shapes.back.flat_shade();
        // boat is 0.8*2 in width, so 1 quarter is 0.4

        // +x is LEFT, + y is INTO THE SCREEN, +z is DOWN
        // BIG MIDDLE: when we scale z by 5, a translation of 0.75 is 3.75, so 1.25 is overlapped with the boat, 3.75 is out behind
        // this.shapes.back.draw(context, program_state, Mat4.scale(1,0.8,5).times(Mat4.translation(0.4,0.65/0.8,0.75)).times(r), this.materials.back_water2);
        if (this.alive) { // ONLY LET THE PLAYER MOVE IF THEY ARE STILL ALIVE
            let middle = r.times(Mat4.translation(-0.5,0,0));
            let left = r;
            let right = r.times(Mat4.translation(-0.5,0,0));

            if (this.LEFT) {
                middle = middle.times(Mat4.translation(-this.pre_position, 0, 0))
                    .times(Mat4.rotation(-Math.PI/5,0,0,1))
                    .times(Mat4.scale(1,7,1))
                    .times(Mat4.translation(-1.5,-5/7,0));
                left = left.times(Mat4.translation(-this.pre_position, 0, 0))
                    .times(Mat4.rotation(-Math.PI/5,0,0,1))
                    .times(Mat4.rotation(Math.PI/15,0,0,1))
                    .times(Mat4.scale(0.5,7,1))
                    .times(Mat4.translation(0,-5/7,0));
                right = right.times(Mat4.translation(-this.pre_position, 0, 0))
                    .times(Mat4.rotation(-Math.PI/5,0,0,1))
                    .times(Mat4.rotation(-Math.PI/15,0,0,1))
                    .times(Mat4.scale(0.5,7,1))
                    .times(Mat4.translation(-5,-5/7,0));
            }
            else if (this.RIGHT) {
                middle = middle.times(Mat4.translation(-this.pre_position, 0, 0))
                    .times(Mat4.rotation(Math.PI/5,0,0,1))
                    .times(Mat4.scale(1,7,1))
                    .times(Mat4.translation(1.5,-5/7,0));
                left = left.times(Mat4.translation(-1*this.pre_position, 0, 0))
                    .times(Mat4.rotation(Math.PI/5,0,0,1))
                    .times(Mat4.rotation(Math.PI/15,0,0,1))
                    .times(Mat4.scale(0.5,7,1))
                    .times(Mat4.translation(5,-5/7,0));
                right = right.times(Mat4.translation(-this.pre_position, 0, 0))
                    .times(Mat4.rotation(Math.PI/5,0,0,1))
                    .times(Mat4.rotation(-Math.PI/15,0,0,1))
                    .times(Mat4.scale(0.5,7,1))
                    .times(Mat4.translation(0,-5/7,0));
            }
            else {
                middle = middle.times(Mat4.scale(1,7,1))
                    .times(Mat4.translation(-1*this.pre_position, -5/7,0));
                left = left.times(Mat4.rotation(Math.PI/15, 0, 0, 1))
                    .times(Mat4.scale(0.5,7,1))
                    .times(Mat4.translation(3.5 - 2*this.pre_position, -2/7 + 2*Math.min(0, this.pre_position/10)/7,0));
                right = right.times(Mat4.rotation(-Math.PI/15, 0, 0, 1))
                    .times(Mat4.scale(0.5,7,1))
                    .times(Mat4.translation(-3.5 - 2*this.pre_position, -2/7 - 2*Math.max(0, this.pre_position/10)/7,0));
            }

            this.shapes.back.draw(context, program_state, middle, this.materials.back_water2);
            this.shapes.back.draw(context, program_state, left, this.materials.back_water2);
            this.shapes.back.draw(context, program_state, right, this.materials.back_water2);
        }

        // LEFT SIDE: y is now into the screen, z is down,
        // this.shapes.back.draw(context, program_state, r.times(Mat4.rotation(Math.PI/8, 0, 0, 1)).times(Mat4.scale(0.25,5,0.8)).times(Mat4.translation(0,-0.75,-0.65/0.8)), this.materials.back_water2);
        // this.shapes.back.draw(context, program_state, Mat4.scale(0.5,0.8,5).times(), this.materials.back_water2);

        // RIGHT SIDE:
        // this.shapes.back.draw(context, program_state, Mat4.translation(1,0,0).times(r).times(Mat4.rotation(-Math.PI/8, 0, 0, 1)).times(Mat4.scale(0.25,5,0.8)).times(Mat4.translation(0,-0.75,-0.65/0.8)), this.materials.back_water2);
        // this.shapes.back.draw(context, program_state, Mat4.translation(0, 0, 4).times(Mat4.scale(0.4,0.5,2)).times(Mat4.translation(-2.75,0,0)).times(r).times(Mat4.rotation(-Math.PI/10, 0,0,1)), this.materials.back_water2);

        // THIS GIVES NICE TEXTURE/SHAPE THOO
        // this.shapes.back.draw(context, program_state, Mat4.scale(0.75,0.8,5).times(Mat4.rotation(Math.PI/6,1,0,0)).times(Mat4.translation(0.4,4,0.75)).times(r), this.materials.back_water2);
        this.shapes.back.copy_onto_graphics_card(context.context, ["position", "normal"], false);
    }

    rock_the_boat() {
        this.boat2 = this.boat2.times(Mat4.rotation(0.1 - 0.25*Math.abs(Math.sin(this.t)**3),0,0,1));
        this.boat2 = this.boat2.times(Mat4.rotation(0.1 - 0.25*Math.abs(Math.cos(this.t*0.8)**2),1,0,0));
    }

    check_key_pressed(c) {
        /*
        document.addEventListener('keyup', function (evt) {
                if (evt.code === 'KeyX') {
                    this.vel = Math.min(0, this.vel + 0.1);
                }
            });

            document.addEventListener('keyup', function (evt) {
                if (evt.key === 'v') {
                    console.clear();
                }
            });
         */

        // NOTE: the logic for keyboard is different than the typical key pressing we use. For that reason, the if statement below is only for the website buttons
        if (c == 'L') {
            this.LEFT = true;
            this.RIGHT = false;
            this.stopL = true;
        }
        else if (c == 'R') {
            this.RIGHT = true;
            this.LEFT = false;
            this.stopR = true;
        }

        const DOWN_KEYS = {
            ArrowLeft: () => {
                this.LEFT = true;
                this.stopL = false;
            },
            ArrowRight: () => {
                this.RIGHT = true;
                this.stopL = false;
            },
        };

        const UP_KEYS = {
            ArrowLeft: () => {
                this.stopL = true;
                this.LEFT = false;
            },
            ArrowRight: () => {
                this.stopR = true;
                this.RIGHT = false;
            },
        };

        if (!this.holding) {
            document.addEventListener('keydown', (e) => {
                e.preventDefault();

                const handler = DOWN_KEYS[e.code];

                if (handler) {
                    handler();
                    this.holding = true;
                    return;
                }
            });
        }
        document.addEventListener('keyup', (e) => {
            e.preventDefault();

            const handler = UP_KEYS[e.code];

            if (handler) {
                handler();
                this.holding = false;
                return;
            }
        });
    }

    turn_boat() {
        if (this.alive) { // ONLY LET USER DO KEY CONTROLS IF THE PLAYER IS STILL ALIVE

            this.boat2 = Mat4.identity().times(Mat4.scale(1,1,-1))
                .times(Mat4.translation(0.1,1.75,2))
                .times(Mat4.translation(this.pre_position, 0, 0));

            if (this.RIGHT) {
                this.vel += 0.0075;
                this.boat2 = this.boat2.times(Mat4.rotation(-Math.PI/8, 0, -0.5, 1));
            }
            else if (this.LEFT) {
                this.vel -= 0.0075;
                this.boat2 = this.boat2.times(Mat4.rotation(Math.PI/8, 0, -0.5, 1));
            }
            else if (this.stopL) {
                this.vel = Math.min(this.vel + 0.010, 0);
            }
            else if (this.stopR) {
                this.vel = Math.max(this.vel - 0.010, 0);
            }
            this.pre_position += this.vel;
            if (this.pre_position > 10) {
                this.pre_position = 10;
                this.vel = 0;
            }
            else if (this.pre_position < -10) {
                this.pre_position = -10;
                this.vel = 0;
            }
        }

        // alternate way for movement
        // document.addEventListener('keyup', (event) => {
        //     if(event.repeat) {
        //         // key is being held down
        //     } else {
        //         // key is being pressed
        //     }
        // });
        // document.onkeydown = function(e){
        //     var keycode = window.event ? window.event.keyCode : e.which;
        //     if(keycode == 40){
        //         var timer = setTimeout(function(){
        //             alert('Down key held');
        //             document.onkeyup = function(){};
        //         }, 200);
        //         document.onkeyup = function(){
        //             clearTimeout(timer);
        //             alert('Down key pressed');
        //         }
        //     }
        // };
    }

    make_control_panel() {
        // check the left and right functions elsewhere, keep it here so you can technically press it on the website too
        this.key_triggered_button("Go Left [←]", ["ArrowLeft"], () => {
            this.check_key_pressed('L');
        }); 

        this.key_triggered_button("Go Right [→]", ["ArrowRight"], () => {
            this.check_key_pressed('R');
        });

        this.key_triggered_button("Play Game", ["p"], () => {
            this.startGame = true;
        })
    }
    

    // MAIN DISPLAY
    display(context, program_state) {
        // setting camera
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(this.initial_camera_location);
            this.firstRound = true;
        }

        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, .1, 1000);

        // variable initialization .
        let model_transform = Mat4.identity();
        this.t = program_state.animation_time / 1000;
        this.dt = program_state.animation_delta_time / 1000;

        // emitted light
        const light_position = vec4(0,30,-85, 1);
        const boat_position = vec4(0,2,-3,1);
        const sun_pos = vec4(-25, 10, -80, 1);

        // night-time lights
        // program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 15**3), new Light(boat_position, color(1,1,1,1), 10**2)];
        // let sun_transform = model_transform.times(Mat4.translation(0,20,-105)).times(Mat4.scale(5,5,5));
        // // night-time (moon)
        // this.shapes.moon.draw(context, program_state, sun_transform, this.materials.moon);
        // // night-time (black sky)
        // this.shapes.cube.draw(context, program_state, model_transform.times(Mat4.translation(0,20,-40).times(Mat4.scale(45,75,75))), this.materials.night_sky);

        // day-time lights
        program_state.lights = [new Light(light_position, color(0.4,0.4,0.4,1), 10**5), new Light(vec4(0,20,-30,1), color(0.75,0.75,0.75,1), 15**3)];
        let sun_transform = model_transform.times(Mat4.translation(0,20,-105)).times(Mat4.scale(5,5,5));
        // day-time (sun)
        this.shapes.sphere.draw(context, program_state, sun_transform, this.materials.sun);
        // day-time (blue sky)
        this.shapes.cube.draw(context, program_state, model_transform.times(Mat4.translation(0,20,-40).times(Mat4.scale(45,75,75))), this.materials.sky);

        // original algorithm for iceberg spawning
        // use modulus to make planets cycle back to initial position after 2, 3, 4 seconds
//         this.iceberg1 = model_transform.times(Mat4.translation(0, 0, -60)).times(Mat4.translation(0, 0, (this.t/3%2)*75 - 50)).times(Mat4.scale(3, 6, 1.5));
//         this.iceberg2 = model_transform.times(Mat4.translation(-12, 0, -60)).times(Mat4.translation(0, 0, (this.t/3%3 - 1)*75 - 50)).times(Mat4.scale(3, 6, 1.5));
//         this.iceberg3 = model_transform.times(Mat4.translation(12, 0, -60)).times(Mat4.translation(0, 0, (this.t/3%4 - 1)*75 - 50)).times(Mat4.scale(3, 6, 1.5));

        //NOTE: THIS.A MUST STAY ABOVE 0
        let time1 = (this.t/this.a%2)*75;
        let time2 = (this.t/this.a%3 - 1)*75;
        let time3 = (this.t/this.a%4 - 1)*75;
        let time4 = (this.t/this.a%5 - 1)*75;


        if (time1 >= 130) 
        {
             this.x = (getRandomInt(-10,10));
             //this.x = values[Math.floor(Math.random() * values.length)]
        }

        if (time2 >= 130)
        {
            this.x2 = (getRandomInt(-10,10));
 
        }
        if (time3 >= 130)
        {
            this.x3 = (getRandomInt(-10,10));
        }
        if (time3 >= 130)
        {
            this.x4 = (getRandomInt(-10,10));
        }
        

        if (this.alive) {
            this.iceberg1 = model_transform.times(Mat4.translation(this.x, 0, -60)).times(Mat4.translation(0, 0, time1-50)).times(Mat4.scale(3, 5, 5));
            this.iceberg2 = model_transform.times(Mat4.translation(this.x2, 0, -60)).times(Mat4.translation(0, 0, time2-50)).times(Mat4.scale(5, 7, 5.5));
            this.iceberg3 = model_transform.times(Mat4.translation(this.x3, 0, -60)).times(Mat4.translation(0, 0, time3-50)).times(Mat4.scale(4, 6, 4));
        }

        if (this.startGame) {
            this.firstRound = false;
            //set score to 0
            this.pre_points = 0;
            //reset icebergs
            program_state.animation_time = 0;
            //put boat at center
            this.pre_position = 0;
            this.pre_position_y = 0;
            this.alive = true;
            //reset boat movement
            this.RIGHT = false;
            this.LEFT = false;
            //put initial text again
            this.startGame = false;
            this.new_highscore = false;
        }

        let iceberg1z = time1 - 50;
        let iceberg2z = time2 - 50;
        let iceberg3z = time3 - 50;

       // collision detection

       if (this.alive) {
            if ((Math.abs(iceberg1z - 57) < 5 && Math.abs(this.pre_position - this.x) < 5) || (Math.abs(iceberg2z - 57) < 5 && Math.abs(this.pre_position - this.x2) < 5) || (Math.abs(iceberg3z - 57) < 5 && Math.abs(this.pre_position - this.x3) < 5)) {  
                this.alive = false;
            }
       }

        this.boat2 = model_transform.times(Mat4.scale(1,1,-1)).times(Mat4.translation(0.1,1.75,2));
        this.boat2 = this.boat2.times(Mat4.translation(this.pre_position, this.pre_position_y, 0));

        if (!this.alive) {
            if (this.pre_position_y > -5) {
                this.pre_position_y -= 0.05;
            }
        }
        else {
            this.turn_boat();
        }

        this.display_scene(context, program_state);
        const p = this.t + 4;
        const q = p + 4;
        const r = q + 4;
        
        if (this.alive) {
            this.rmountain1 = model_transform.times(Mat4.scale(3,10,10)).times(Mat4.translation(13, 0.23, -1 * (16 - this.t%16.0)));
            this.rmountain2 = model_transform.times(Mat4.scale(3,10,10)).times(Mat4.translation(13, 0.23, -1 * (16 - (p%16.0))));
            this.rmountain3 = model_transform.times(Mat4.scale(3,10,10)).times(Mat4.translation(13, 0.23, -1 * (16 - (q%16.0))));
            this.rmountain4 = model_transform.times(Mat4.scale(3,10,10)).times(Mat4.translation(13, 0.23, -1 * (16 - (r%16.0))));

            this.lmountain1 = model_transform.times(Mat4.scale(-3,10,10)).times(Mat4.translation(13, 0.23, -1 * (16 - this.t%16.0)));
            this.lmountain2 = model_transform.times(Mat4.scale(-3,10,10)).times(Mat4.translation(13, 0.23, -1 * (16 - (p%16.0))));
            this.lmountain3 = model_transform.times(Mat4.scale(-3,10,10)).times(Mat4.translation(13, 0.23, -1 * (16 - (q%16.0))));
            this.lmountain4 = model_transform.times(Mat4.scale(-3,10,10)).times(Mat4.translation(13, 0.23, -1 * (16 - (r%16.0))));
        }

        // right mountains
        this.shapes.mountain.draw(context, program_state, this.rmountain1, this.materials.mountain);
        this.shapes.mountain.draw(context, program_state, this.rmountain2, this.materials.mountain);
        this.shapes.mountain.draw(context, program_state, this.rmountain3, this.materials.mountain);
        this.shapes.mountain.draw(context, program_state, this.rmountain4, this.materials.mountain);
        // left mountains
        this.shapes.mountain.draw(context, program_state, this.lmountain1, this.materials.mountain);
        this.shapes.mountain.draw(context, program_state, this.lmountain2, this.materials.mountain);
        this.shapes.mountain.draw(context, program_state, this.lmountain3, this.materials.mountain);
        this.shapes.mountain.draw(context, program_state, this.lmountain4, this.materials.mountain);

        this.rock_the_boat();
        this.shapes.boat2.draw(context, program_state, this.boat2, this.materials.boat2_fa);

        let points = this.pre_points;
        let highscore = this.pre_highscore;

        this.shapes.iceberg.draw(context, program_state, this.iceberg1, this.materials.ice);
        this.shapes.iceberg.draw(context, program_state, this.iceberg2, this.materials.ice);
        this.shapes.iceberg.draw(context, program_state, this.iceberg3, this.materials.ice);


        if (this.alive) { // Only increment points while player is alive
            points += 10;
            if (points > highscore) {
                highscore = points;
                this.new_highscore = true;
            }
        } else { // Game over screen upon losing
            this.shapes.text.set_string("GAME", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-2.5, 7, -5 * Math.sin(this.t*5)/10)), this.materials.text_image);
            this.shapes.text.set_string("OVER", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-2.5, 5, -5 * Math.sin(this.t*5)/10)), this.materials.text_image);
            this.shapes.text.set_string("Press P to try again", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-4.5, 3, -5 * Math.sin(this.t*5)/10)).times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);
            if (this.new_highscore) {
                this.shapes.text.set_string("*NEW HIGHSCORE!*", context.context);
                this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-3.5, 2, -5 * Math.sin(this.t*5)/10)).times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);
            }
        }

        this.pre_points = points;
        this.pre_highscore = highscore;

        this.shapes.text.set_string("SCORE: " + points.toString(), context.context);
<<<<<<< Updated upstream
        this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-10, 11, 0)).times(Mat4.scale(0.5, 0.5, 0.5)), this.materials.text_image);
        if (points%10 == 0)
=======
        this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-10.5, 11.5, 0)).times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);
        this.shapes.text.set_string("HIGHSCORE: " + highscore.toString(), context.context);
        this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-10.5, 10.5, 0)).times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);

        if (points%500 == 0)
>>>>>>> Stashed changes
        {
             this.a = this.a/1.001;

        }


        // beginning game dialogue
        if (this.t < 3 && this.firstRound) {
            //this.shapes.cube.draw(context, program_state, model_transform.times(Mat4.translation(0,20,-40).times(Mat4.scale(45,75,75))), this.materials.logo);
            this.shapes.text.set_string("OH NO! OBSTACLES SPOTTED AHEAD!", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-4.5, 6, -5 * Math.sin(this.t*5)/10)).times(Mat4.scale(0.2, 0.2, 0.2)), this.materials.text_image);
        } else if (this.t < 7 && this.firstRound) {
            this.shapes.text.set_string("STEER THIS BOAT TO SAFETY!", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-4, 6, -5 * Math.sin(this.t*5)/10)).times(Mat4.scale(0.2, 0.2, 0.2)), this.materials.text_image);
        } else {
            if (this.size_count < 0.17) {
                this.size_count += 0.01
            }
            this.shapes.text.set_string("USE THE LEFT AND RIGHT ARROW KEYS", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(1, 11.5, 0)).times(Mat4.scale(this.size_count, this.size_count, this.size_count)), this.materials.text_image);

            this.shapes.text.set_string("TO STEER THE BOAT AND AVOID THE ICEBERGS", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(0, 11, 0)).times(Mat4.scale(this.size_count, this.size_count, this.size_count)), this.materials.text_image); 
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

class Texture_Scroll_X extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                vec2 current_coord = f_tex_coord + 0.1 * animation_time;
                // vec2 current_coord = f_tex_coord - 2.5 * animation_time;
                vec4 tex_color = texture2D( texture, current_coord );
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}

class Texture_Rotate extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #7.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            void main(){
                // Sample the texture image in the correct place:
                vec2 current_coord = f_tex_coord - vec2(0.5, 0.5);
                float PI = 3.1415926;
                float angle =  -PI * animation_time / 60.0;
                // float angle =  10.0 * PI * animation_time / 60.0;
                mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)); 
                current_coord = rotation * current_coord;
                current_coord = current_coord + vec2(0.5, 0.5);
                vec4 tex_color = texture2D( texture, current_coord );
                if( tex_color.w < .01 ) discard;
                                                                         // Compute an initial (ambient) color:
                gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                         // Compute the final color with contributions from lights:
                gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
        } `;
    }
}