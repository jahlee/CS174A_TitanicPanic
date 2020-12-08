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
        const row_operation2 = (s, p) => p ? Mat4.translation(0, 0.15, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation2 = (t, p) => Mat4.translation(0.15, 0, 0).times(p.to4(1)).to3();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            sphere: new defs.Subdivision_Sphere(4),
            moon: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(4),
            iceberg: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            water: new defs.Grid_Patch(20, 20, row_operation, column_operation),
            back: new defs.Grid_Patch(9, 4, row_operation2, column_operation2),
            mountain: new Shape_From_File("./assets/everest.obj"),
            cube: new Cube(),
            boat2: new Shape_From_File("./assets/boat2.obj"),
            text: new Text_Line(45),
        };

        // *** Materials
        this.materials = {
            ice: new Material(new defs.Phong_Shader(),
                {ambient: 0.9, diffusivity: 2, specularity: 0.5, color: hex_color("#87ceeb")}),
            sky: new Material(new defs.Phong_Shader(),
                {ambient: 0.9, diffusivity: 1, specularity: 0.5, color: hex_color("#87ceeb")}),
            sun: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0.3, specularity: 0, color: hex_color("#ec544c")}), // same as color(0.925,0.329,0.298,1)
            moon: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: 0.3, specularity: 0, color: hex_color("#F0E68C")}),
            mountain : new Material(new defs.Fake_Bump_Map(1), {
                color: color(0.7,0.7,0.7, 1), ambient: .3, diffusivity: 1, specularity: .5, texture: new Texture("./assets/texture_map.png")}),
            boat2_fm: new Material(new defs.Fake_Bump_Map(1), {
                color: color(0.5,0.5,0.5,1), ambient: .5, diffusivity: 2, specularity: 0, texture: new Texture("./assets/MetalSmooth.png")}),
            boat2_fa: new Material(new defs.Fake_Bump_Map(1), {
                color: color(0.2,0.2,0.2, 1), ambient: 0.3, diffusivity: 1, specularity: 0, texture: new Texture("./assets/AlbedoTpy.png")}),
            text_image: new Material(new defs.Textured_Phong(1), {ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text.png")}),
            // back_water: new Material(new Texture_Scroll_Back_Water(), {ambient: 0.65, diffusivity: 0, specularity: 0, color: color(0.15,0.15,0.6,1), texture: new Texture("assets/oc.jpg")}),
            back_water: new Material(new Texture_Scroll_Back_Water(), {ambient: 0.65, diffusivity: 0, specularity: 0, color: color(0.8,0.6,0.8,1)}),
            movecartoon: new Material(new Texture_Scroll_Water(), {ambient: 0.2, diffusivity: 2.5, specularity: 0.35, color: color(0.1,0.15,0.9,1), texture: new Texture("assets/cartoonsea.png")}),  //hex_color("#00002A")
            rotatecartoon: new Material(new Texture_Rotate(), {ambient: 0.5, diffusivity: 0.5, specularity: 0.5, color: color(0,0,1,0.7), texture: new Texture("assets/cartoonsea.png")})
        };

        // this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.initial_camera_location = Mat4.look_at(vec3(0, 6, 15), vec3(0, 6, 0), vec3(0, 1, 0));
        this.pre_points = 0;
        this.pre_position = 0; // boat's x position
        this.pre_position_y = 0;
        this.alive = true;
        this.a = 3;
        this.size_count = 0;
        this.vel = 0;
        this.holding = false;
        this.stopL = this.stopR = true;
        this.pre_highscore = 0;
        this.new_highscore = false;
        this.rmountain1 = this.rmountain2 = this.rmountain3 = this.rmountain4 = this.lmountain1 = this.lmountain2 = this.lmountain3 = this.lmountain4 = Mat4.identity();
        this.boat_texture = 0;
        this.environment = 0;
    }

    display_water(context, program_state) {
        const random = (x) => Math.sin(1000 * x + this.t);
        // Draw the sheets, flipped 180 degrees so their normals point at us.
        const r = Mat4.rotation(Math.PI, 0, 1, 0).times(Mat4.rotation(Math.PI/2, 1, 0, 0));

        // AFTER ROTATION, +x is LEFT, + y is INTO THE SCREEN, +z is DOWN
        // p[0] and p[1] are the amt of horizontal and vertical value of plane, p[2] is for z direction, the 1.75*random determines the height at that point
        this.shapes.water.arrays.position.forEach((p, i, a) =>
            a[i] = vec3(p[0], p[1], 1.75*Math.sin(random(i/a.length))));

        // Draw the current sheet shape, translation specifies bottom right corner
        this.shapes.water.draw(context, program_state, Mat4.translation(45, 0, 35).times(r).times(Mat4.scale(22.5,37.5,1)), this.materials.movecartoon);
        // this.shapes.water.draw(context, program_state, Mat4.translation(45, 0, 35).times(r).times(Mat4.scale(22.5,37.5,1)), this.materials.rotatecartoon);

        // Update the gpu-side shape with new vertices.
        this.shapes.water.copy_onto_graphics_card(context.context, ["position", "normal"], false);

        // same for the back water behind the boat
        this.shapes.back.arrays.position.forEach((p, i, a) =>
            a[i] = vec3(p[0], p[1], 0.25*Math.sin(random(i/a.length))));

        // +x is LEFT, + y is INTO THE SCREEN, +z is DOWN
        let middle = this.boat2.times(r).times(Mat4.translation(-0.5,0,1)).times(Mat4.scale(2,10,1));
        context.context.disable(context.context.DEPTH_TEST);
        this.shapes.back.draw(context, program_state, middle, this.materials.back_water);
        context.context.enable(context.context.DEPTH_TEST);

    }

    rock_the_boat() {
        this.boat2 = this.boat2.times(Mat4.rotation(0.1 - 0.25*Math.abs(Math.sin(this.t)**3),0,0,1));
        this.boat2 = this.boat2.times(Mat4.rotation(0.1 - 0.25*Math.abs(Math.cos(this.t*0.8)**2),1,0,0));
    }

    check_key_pressed(c) {
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

            let degree = -this.vel/0.25;
            if (this.RIGHT) {
                this.vel += 0.0075;
                this.boat2 = this.boat2.times(Mat4.rotation(degree * Math.PI/8, 0, -1, 1));
            }
            else if (this.LEFT) {
                this.vel -= 0.0075;
                this.boat2 = this.boat2.times(Mat4.rotation(degree * Math.PI/8, 0, -1, 1));
            }
            else if (this.stopL) {
                this.vel = Math.min(this.vel + 0.010, 0);
                this.boat2 = this.boat2.times(Mat4.rotation(degree * Math.PI/10, 0, -1, 1));
            }
            else if (this.stopR) {
                this.vel = Math.max(this.vel - 0.010, 0);
                this.boat2 = this.boat2.times(Mat4.rotation(degree * Math.PI/10, 0, -1, 1));
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
    }

    make_control_panel() {
        // check the left and right functions elsewhere, keep it here so you can technically press it on the website too

        this.controls = this.control_panel.appendChild(document.createElement("div"));
        this.controls.style.fontSize = "16px";
        this.controls.style["font-weight"] = "bold";
        this.controls.textContent = "Controls";

        this.key_triggered_button("Reset Game", ["p"], () => {
            this.startGame = true;
        })
        this.new_line();

        this.key_triggered_button("Go Left [←]", ["ArrowLeft"], () => {
            this.check_key_pressed('L');
        }); 

        this.key_triggered_button("Go Right [→]", ["ArrowRight"], () => {
            this.check_key_pressed('R');
        });

        this.new_line();

        this.cam = this.control_panel.appendChild(document.createElement("div"));
        this.cam.style.fontSize = "16px";
        this.cam.style["font-weight"] = "bold";
        this.cam.textContent = "Camera Settings";

        this.key_triggered_button("Change Camera Angle", ["c"], () => {
            this.cam_pos ^= 1;
        });
        this.key_triggered_button("Toggle Locked Camera", ["t"], () => {
            this.not_locked ^= 1;
        });

        this.new_line();

        this.cam = this.control_panel.appendChild(document.createElement("div"));
        this.cam.style.fontSize = "16px";
        this.cam.style["font-weight"] = "bold";
        this.cam.textContent = "Display Settings";

        this.key_triggered_button("Change Boat Texture", ["Shift", "A"], () => {
            this.boat_texture += 1;
        });
        this.key_triggered_button("Change Environment", ["Shift", "S"], () => {
            this.environment += 1;
        });

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

        let hour = this.t;
        let cycle = Math.cos(hour * Math.PI / 30);
        let abs_cycle = Math.abs(cycle);

        // default: day and night
        switch (this.environment % 4) {
            case 1:     // day only
                cycle = abs_cycle = 1;
                break;
            case 2:     // sunset only
                cycle = abs_cycle = 0.175;
                break;
            case 3:     // night only
                cycle = -1;
                abs_cycle = 1;
                break;
        }

        let main_light = (15**3) * abs_cycle;
        let boat_light = main_light / 10;
        let close_light_y = 20;
        let close_light_z = 0;
        let close_color = color(0.3, 0.3, 0.3, 1);
        let main_color = color(1,1,1,1);

        // when its sunset/sunrise/night-time
        if (cycle <= 0.175) {
            main_light /= 10;
            boat_light = 10;
            close_light_y = this.pre_position_y + 5;
            close_light_z = -10;
            close_color = color(1,1,1,1);
            main_color = color(0.7, 0.7, 0.7, 1);
        }

        // lights: one from sun/moon, one from boat
        program_state.lights = [new Light(vec4(0, Math.ceil(30*abs_cycle) - 5,-105,1), main_color, main_light), new Light(vec4(this.pre_position,close_light_y,close_light_z,1), close_color, boat_light)];

        let cycle_scale1 = Math.max(cycle, 0) * 1.5;
        let cycle_scale2 = Math.max(-cycle, 0) * 1.5;
        let sun_transform = model_transform.times(Mat4.translation(0,30*cycle - 5,-105)).times(Mat4.scale(3.5 + cycle_scale1, 3.5 + cycle_scale1, 3.5 + cycle_scale1));
        let moon_transform = model_transform.times(Mat4.translation(0,-30*cycle - 5,-105)).times(Mat4.scale(3.5 + cycle_scale2, 3.5 + cycle_scale2, 3.5 + cycle_scale2));

        // day-time (sun)
        this.shapes.sphere.draw(context, program_state, sun_transform, this.materials.sun.override({color: color(0.941*(cycle) + 0.992*(1-cycle), 0.902*(cycle) + 0.500*(1-cycle), 0.549*(cycle) + 0.369*(1-cycle), 1)}));
        this.shapes.moon.draw(context, program_state, moon_transform, this.materials.moon);

        // outside lighting/color
        let cycle_sky = Math.max(cycle, 0);
        this.shapes.cube.draw(context, program_state, model_transform.times(Mat4.translation(0,20,-40).times(Mat4.scale(45,75,75))),
            this.materials.sky.override({color: color(0.451*(abs_cycle) + 0.984*(1-abs_cycle), 0.761*(abs_cycle) + 0.812*(1-abs_cycle), 0.984*(abs_cycle) + 0.404*(1-abs_cycle), 1), ambient: cycle_sky}));

        // original algorithm for iceberg spawning
        // use modulus to make planets cycle back to initial position after 2, 3, 4 seconds
//         this.iceberg1 = model_transform.times(Mat4.translation(0, 0, -60)).times(Mat4.translation(0, 0, (this.t/3%2)*75 - 50)).times(Mat4.scale(3, 6, 1.5));
//         this.iceberg2 = model_transform.times(Mat4.translation(-12, 0, -60)).times(Mat4.translation(0, 0, (this.t/3%3 - 1)*75 - 50)).times(Mat4.scale(3, 6, 1.5));
//         this.iceberg3 = model_transform.times(Mat4.translation(12, 0, -60)).times(Mat4.translation(0, 0, (this.t/3%4 - 1)*75 - 50)).times(Mat4.scale(3, 6, 1.5));

       //NOTE: THIS.A MUST STAY ABOVE 0
        let time1 = ((this.t/this.a)%2)*75;
        let time2 = ((this.t/this.a)%3)*75;
        let time3 = ((this.t/this.a)%4)*75;

        if (time1 >= 130) 
        {
             this.x = (getRandomInt(-10,10));
             this.angle1 = (getRandomInt(0, 10));
        }
        if (time2 >= 130)
        {
            this.x2 = (getRandomInt(-10,10));
            this.angle2 = (getRandomInt(0, 10));
        }
        if (time3 >= 130)
        {
            this.x3 = (getRandomInt(-10,10));
            this.angle3 = (getRandomInt(0, 10));
        }

        if (this.alive) {
            this.iceberg1 = model_transform.times(Mat4.translation(this.x, 0, -60)).times(Mat4.translation(0, 0, time1-50)).times(Mat4.scale(2, 4, 5)).times(Mat4.rotation(this.angle1, 1, 0, 0));
            this.iceberg2 = model_transform.times(Mat4.translation(this.x2, 0, -60)).times(Mat4.translation(0, 0, time2-50)).times(Mat4.scale(3, 5, 5.5)).times(Mat4.rotation(this.angle2, 1, 0, 0));
            this.iceberg3 = model_transform.times(Mat4.translation(this.x3, 0, -60)).times(Mat4.translation(0, 0, time3-50)).times(Mat4.scale(3, 6, 4)).times(Mat4.rotation(this.angle3, 1, 0, 0))
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
            this.a = 3;
        }

        let iceberg1z = time1 - 50;
        let iceberg2z = time2 - 50;
        let iceberg3z = time3 - 50;

       // collision detection
       if (this.alive) {
            if ((Math.abs(iceberg1z - 57) < 3 && Math.abs(this.pre_position - this.x) < 3) || (Math.abs(iceberg2z - 57) < 3 && Math.abs(this.pre_position - this.x2) < 3) || (Math.abs(iceberg3z - 57) < 3 && Math.abs(this.pre_position - this.x3) < 3)) {  
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

        this.display_water(context, program_state);
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

        context.context.disable(context.context.DEPTH_TEST);
        switch (this.boat_texture % 3) {
            case 0:
                this.shapes.boat2.draw(context, program_state, this.boat2, this.materials.boat2_fa);
                break;
            case 1:
                this.shapes.boat2.draw(context, program_state, this.boat2, this.materials.boat2_fm);
                break;
            case 2:
                this.shapes.boat2.draw(context, program_state, this.boat2, this.materials.boat2_fm.override({color: color(Math.random(), Math.random(), Math.random(), 1)}));
                break;
        }
        context.context.enable(context.context.DEPTH_TEST);

        let points = this.pre_points;
        let highscore = this.pre_highscore;

        if (cycle > 0) {
            this.shapes.iceberg.draw(context, program_state, this.iceberg1, this.materials.ice.override({ambient: 0.8 - 0.2 * abs_cycle}));
            this.shapes.iceberg.draw(context, program_state, this.iceberg2, this.materials.ice.override({ambient: 0.8 - 0.2 * abs_cycle}));
            this.shapes.iceberg.draw(context, program_state, this.iceberg3, this.materials.ice.override({ambient: 0.8 - 0.2 * abs_cycle}));
        }
        else {
            this.shapes.iceberg.draw(context, program_state, this.iceberg1, this.materials.ice.override({ambient: 0.6 - 0.3 * abs_cycle}));
            this.shapes.iceberg.draw(context, program_state, this.iceberg2, this.materials.ice.override({ambient: 0.6 - 0.3 * abs_cycle}));
            this.shapes.iceberg.draw(context, program_state, this.iceberg3, this.materials.ice.override({ambient: 0.6 - 0.3 * abs_cycle}));
        }


        if (this.alive) { // Only increment points while player is alive
            points += 10;
            if (points > highscore) {
                highscore = points;
                this.new_highscore = true;
            }
        } else { // Game over screen upon losing
            this.shapes.text.set_string("GAME", context.context);
            context.context.disable(context.context.DEPTH_TEST);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-2.5, 7, -5 * Math.sin(this.t*5)/10)), this.materials.text_image);
            this.shapes.text.set_string("OVER", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-2.5, 5, -5 * Math.sin(this.t*5)/10)), this.materials.text_image);
            this.shapes.text.set_string("Press P to try again", context.context);
            this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-4.5, 3, -5 * Math.sin(this.t*5)/10)).times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);
            context.context.enable(context.context.DEPTH_TEST);
            if (this.new_highscore) {
                this.shapes.text.set_string("*NEW HIGHSCORE!*", context.context);
                this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-3.5, 2, -5 * Math.sin(this.t*5)/10)).times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);
            }
        }

        this.pre_points = points;
        this.pre_highscore = highscore;
        this.shapes.text.set_string("SCORE: " + points.toString(), context.context);
        this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-10.5, 11.5, 0)).times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);
        this.shapes.text.set_string("HIGHSCORE: " + highscore.toString(), context.context);
        this.shapes.text.draw(context, program_state, model_transform.times(Mat4.translation(-10.5, 10.5, 0)).times(Mat4.scale(0.3, 0.3, 0.3)), this.materials.text_image);

        if (points%50 == 0)
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

        // change camera positions and lock them
        if (this.cam_pos) {    // boat view
            let cam = model_transform.times(Mat4.translation(this.pre_position, 2.5, -2.5));
            program_state.set_camera(Mat4.inverse(cam));
        }
        else if (this.not_locked) {         // free moving camera
            program_state.set_camera(this.initial_camera_location);
        }
        else if (!this.cam_pos) {   // OG view
            let cam = model_transform.times(Mat4.translation(0,6,15));
            program_state.set_camera(Mat4.inverse(cam));
        }

      }
}


class Texture_Scroll_Water extends Textured_Phong {
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

class Texture_Scroll_Back_Water extends Textured_Phong {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Textured_Phong) for requirement #6.
    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            varying vec2 f_tex_coord;
            uniform sampler2D texture;
            uniform float animation_time;
            
            void main(){
                // Sample the texture image in the correct place:
                vec2 current_coord = f_tex_coord - 2.5 * animation_time;
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