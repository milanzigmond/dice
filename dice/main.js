/* eslint-env browser */
/* global THREE, CANNON, Stats */

class Roller {
  constructor() {
    this.use_true_random = true;
    this.frame_rate = 1 / 60;
    this.label_color = '#aaaaaa';
    this.dice_color = '#202020';
    this.spot_light_color = 'white';
    this.selector_back_colors = {
      color: 0x404040,
      shininess: 0,
      emissive: 0x858787,
    };
    this.dice_mass = {
      d4: 300,
      d6: 350,
      d8: 340,
      d10: 350,
      d12: 350,
      d20: 400,
      d100: 350 };
    this.dice_inertia = {
      d4: 5,
      d6: 13,
      d8: 10,
      d10: 9,
      d12: 8,
      d20: 6,
      d100: 9 };
    this.scale = 100;
    this.random_storage = [];
    this.diceThrownIncorrectly = false;
    this.throwData = {};
    this.throwVector = {};
    this.boost = 0;

    this.create_d6_geometry = function (radius) {
      const vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      const faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
        [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
      return Roller.create_geom(vertices, faces, radius, -0.2, Math.PI / 4, 0.9);
    };

    this.create_d6 = function () {
      if (!this.d6_geometry) this.d6_geometry = this.create_d6_geometry(this.scale);

      const specularColor = 'brown';
      const shineness = 5;
      const shading = THREE.FlatShading;

      const materials = [
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/material.png'),
          // color: 0x000000,
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          color: 0x00ff00,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/1.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/2.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/3.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/4.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/5.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/6.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),

      ];

      return new THREE.Mesh(this.d6_geometry, materials);
    };
  }


  static bind(sel, eventname, func, bubble) {
    if (eventname.constructor === Array) {
      eventname.forEach((ev) => {
        sel.addEventListener(ev, func, bubble || false);
      });

      // for (const i in eventname) { 
      //   sel.addEventListener(eventname[i], func, bubble || false); 
      // }
    } else { sel.addEventListener(eventname, func, bubble || false); }
  }

  static get_mouse_coords(ev) {
    const touches = ev.changedTouches;
    if (touches) return { x: touches[0].clientX, y: touches[0].clientY };
    return { x: ev.clientX, y: ev.clientY };
  }

  rnd() {
    return this.random_storage.length ? this.random_storage.pop() : Math.random();
  }

  static create_cannon_shape(vertices, faces, radius) {
    const cv = new Array(vertices.length);
    const cf = new Array(faces.length);
    for (let i = 0; i < vertices.length; ++i) {
      const v = vertices[i];
      cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
    }
    for (let i = 0; i < faces.length; ++i) {
      cf[i] = faces[i].slice(0, faces[i].length - 1);
    }
    return new CANNON.ConvexPolyhedron(cv, cf);
  }

  static make_geom(vertices, faces, radius, tab, af) {
    const geom = new THREE.Geometry();
    for (let i = 0; i < vertices.length; ++i) {
      const vertex = vertices[i].multiplyScalar(radius);
      vertex.index = geom.vertices.push(vertex) - 1;
    }
    for (let i = 0; i < faces.length; ++i) {
      const ii = faces[i];
      const fl = ii.length - 1;
      const aa = (Math.PI * 2) / fl;
      for (let j = 0; j < fl - 2; ++j) {
        geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
          geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], 0, ii[fl] + 1));
        geom.faceVertexUvs[0].push([
          new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
          new THREE.Vector2((Math.cos((aa * (j + 1)) + af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin((aa * (j + 1)) + af) + 1 + tab) / 2 / (1 + tab)),
          new THREE.Vector2((Math.cos((aa * (j + 2)) + af) + 1 + tab) / 2 / (1 + tab),
            (Math.sin((aa * (j + 2)) + af) + 1 + tab) / 2 / (1 + tab))]);
      }
    }
    geom.computeFaceNormals();
    geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
    return geom;
  }

  static chamfer_geom(vectors, faces, chamfer) {
    const chamfer_vectors = [];
    const chamfer_faces = [];
    const corner_faces = new Array(vectors.length);
    for (let i = 0; i < vectors.length; ++i) corner_faces[i] = [];
    for (let i = 0; i < faces.length; ++i) {
      const ii = faces[i];
      const fl = ii.length - 1;
      const center_point = new THREE.Vector3();
      const face = new Array(fl);
      for (let j = 0; j < fl; ++j) {
        const vv = vectors[ii[j]].clone();
        center_point.add(vv);
        corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
      }
      center_point.divideScalar(fl);
      for (let j = 0; j < fl; ++j) {
        const vv = chamfer_vectors[face[j]];
        vv.subVectors(vv, center_point).multiplyScalar(chamfer).addVectors(vv, center_point);
      }
      face.push(ii[fl]);
      chamfer_faces.push(face);
    }
    for (let i = 0; i < faces.length - 1; ++i) {
      for (let j = i + 1; j < faces.length; ++j) {
        const pairs = [];
        let lastm = -1;
        for (let m = 0; m < faces[i].length - 1; ++m) {
          const n = faces[j].indexOf(faces[i][m]);
          if (n >= 0 && n < faces[j].length - 1) {
            if (lastm >= 0 && m !== lastm + 1) pairs.unshift([i, m], [j, n]);
            else pairs.push([i, m], [j, n]);
            lastm = m;
          }
        }
        // if (pairs.length !== 4) continue;
        if (pairs.length === 4) {
          chamfer_faces.push([chamfer_faces[pairs[0][0]][pairs[0][1]],
            chamfer_faces[pairs[1][0]][pairs[1][1]],
            chamfer_faces[pairs[3][0]][pairs[3][1]],
            chamfer_faces[pairs[2][0]][pairs[2][1]], -1]);
        }
      }
    }
    for (let i = 0; i < corner_faces.length; ++i) {
      const cf = corner_faces[i];
      const face = [cf[0]];
      let count = cf.length - 1;
      while (count) {
        for (let m = faces.length; m < chamfer_faces.length; ++m) {
          let index = chamfer_faces[m].indexOf(face[face.length - 1]);
          if (index >= 0 && index < 4) {
            if (--index === -1) index = 3;
            const next_vertex = chamfer_faces[m][index];
            if (cf.indexOf(next_vertex) >= 0) {
              face.push(next_vertex);
              break;
            }
          }
        }
        --count;
      }
      face.push(-1);
      chamfer_faces.push(face);
    }
    return { vectors: chamfer_vectors, faces: chamfer_faces };
  }

  static create_geom(vertices, faces, radius, tab, af, chamfer) {
    const vectors = new Array(vertices.length);
    for (let i = 0; i < vertices.length; ++i) {
      vectors[i] = (new THREE.Vector3()).fromArray(vertices[i]).normalize();
    }

    const cg = Roller.chamfer_geom(vectors, faces, chamfer);

    const geom = Roller.make_geom(cg.vectors, cg.faces, radius, tab, af);
    geom.cannon_shape = Roller.create_cannon_shape(vectors, faces, radius);
    return geom;
  }

  make_random_vector(vector) {
    const random_angle = ((this.rnd() * Math.PI) / 5) - (Math.PI / 5 / 2);
    const vec = {
      x: (vector.x * Math.cos(random_angle)) - (vector.y * Math.sin(random_angle)),
      y: (vector.x * Math.sin(random_angle)) + (vector.y * Math.cos(random_angle)),
    };
    if (vec.x === 0) vec.x = 0.01;
    if (vec.y === 0) vec.y = 0.01;
    return vec;
  }

  static get_dice_value(dice) {
    const vector = new THREE.Vector3(0, 0, 1);
    let closest_face;
    let closest_angle = Math.PI * 2;
    for (let i = 0, l = dice.geometry.faces.length; i < l; ++i) {
      const face = dice.geometry.faces[i];
      if (face.materialIndex !== 0) {
        const angle = face.normal.clone().applyQuaternion(dice.body.quaternion).angleTo(vector);
        if (angle < closest_angle) {
          closest_angle = angle;
          closest_face = face;
        }
      }
    }
    const matindex = closest_face.materialIndex - 1;
    return matindex;
  }

  static get_dice_values(dices) {
    const values = [];
    for (let i = 0, l = dices.length; i < l; ++i) {
      values.push(Roller.get_dice_value(dices[i]));
    }
    return values;
  }

  // dice is mesh
  static shift_dice_faces(dice, value, res) {
    // console.log('shift_dice_faces');
    // console.log(dice);
    // console.log(value);
    // console.log(res);

    const r = [1, 6];
    if (!(value >= r[0] && value <= r[1])) return;
    const num = value - res;
    const geom = dice.geometry.clone();
    for (let i = 0, l = geom.faces.length; i < l; ++i) {
      let matindex = geom.faces[i].materialIndex;
      if (matindex !== 0) {
        matindex += num - 1;
        while (matindex > r[1]) matindex -= r[1];
        while (matindex < r[0]) matindex += r[1];
        geom.faces[i].materialIndex = matindex + 1;
      }
    }
    dice.geometry = geom;
  }

  throw_dices(vector, boost, dist, throw_data, before_roll, after_roll) {
    console.log('-----throw_dices');
    console.log(`vector = ${vector.x}, ${vector.y}`);
    console.log(`dist = ${dist}`);
    console.log(`boost = ${boost}`);
    console.log(`throw_data.set = ${throw_data.set}`);
    console.log(`throw_data.result = ${throw_data.result}`);


    vector.x /= dist;
    vector.y /= dist;
    this.throwData = throw_data;
    this.boost = boost;
    this.throwVector = vector;

    if (throw_data.set.length === 0) return;
    const vectors = this.generate_vectors(throw_data, vector, boost);
    this.rolling = true;

    // const uat = roller.dice.use_adapvite_timestep;
    const roll = (request_results) => {
      if (after_roll) {
        this.clear();
        this.roll(vectors, request_results || throw_data.result, (result) => {
          if (after_roll) after_roll.call(this, throw_data, result);
          this.rolling = false;
          // roller.dice.use_adapvite_timestep = uat;
        });
      }
    };

    if (before_roll) before_roll.call(this, vectors, throw_data, roll);
    else roll();

    const snd = new Audio('./sound/die.wav');
    snd.play();
  }

  reinit(container, dimensions) {
    // console.log(`${dimensions.w}, ${dimensions.h}`);

    this.stats = new Stats();
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.bottom = '0px';
    document.body.appendChild(this.stats.domElement);

    this.cw = container.clientWidth / 2;
    this.ch = container.clientHeight / 2;
    if (dimensions) {
      this.w = dimensions.w;
      this.h = dimensions.h;
    } else {
      this.w = this.cw;
      this.h = this.ch;
    }

    this.aspect = Math.min(this.cw / this.w, this.ch / this.h);
    this.scale = Math.sqrt((this.w * this.w) + (this.h * this.h)) / 8;


    if (this.desk) this.scene.remove(this.desk);

    this.deskGeometry = new THREE.PlaneGeometry(this.w * 2, this.h * 2, 1, 1);


    const deskTexture = new THREE.TextureLoader().load('./img/pattern.png', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 40);
    });

    this.deskMaterial = new THREE.MeshPhongMaterial({

      color: 'green',
      specular: 'red',
      shininess: 5,
      map: deskTexture,

    });


    this.desk = new THREE.Mesh(this.deskGeometry, this.deskMaterial);
    // new THREE.MeshPhongMaterial({ color: that.desk_color }));
    this.desk.receiveShadow = true;
    this.scene.add(this.desk);


    this.wh = this.ch / this.aspect / Math.tan((10 * Math.PI) / 180);

    if (this.camera) this.scene.remove(this.camera);
    this.camera = new THREE.PerspectiveCamera(20, this.cw / this.ch, 1, this.wh * 1.3);
    this.camera.position.z = this.wh;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.cw * 2, this.ch * 2);

    const mw = Math.max(this.w, this.h);
    if (this.light) this.scene.remove(this.light);
    this.light = new THREE.SpotLight(this.spot_light_color, 1.5);
    this.light.position.set(-mw / 2, mw / 2, mw * 2);
    this.light.target.position.set(0, 0, 0);
    this.light.distance = mw * 3;
    this.light.castShadow = true;
    this.light.shadow.camera.near = mw / 10;
    this.light.shadow.camera.far = mw * 5;
    this.light.shadow.camera.fov = 50;
    this.light.shadow.camera.visible = true;
    this.light.shadow.bias = 0.001;
    this.light.shadow.mapSize.width = 2048;
    this.light.shadow.mapSize.height = 2048;
    this.scene.add(this.light);

    // this.controls = new THREE.OrbitControls(this.camera);
    // this.controls.addEventListener('change', this.renderer.render);

    // this.axis = new THREE.AxisHelper(10);
    // this.scene.add(this.axis);


    // if (this.light2) this.scene.remove(this.light2);
    // this.light2 = new THREE.SpotLight(0x8f8f8f, 0);
    // this.light2.position.set(mw, -mw, mw * 2);
    // this.light2.target.position.set(0, 0, 0);
    // this.light2.distance = mw * 10;
    // this.light2.castShadow = false;
    // this.light2.shadow.camera.near = mw / 10;
    // this.light2.shadow.camera.far = mw * 5;
    // this.light2.shadow.camera.fov = 50;
    // this.light2.shadow.bias = 0.001;
    // this.light2.shadow.mapSize.width = 1024;
    // this.light2.shadow.mapSize.height = 1024;
    // this.scene.add(this.light2);


    // Create a helper for the shadow camera (optional)
    // this.helper = new THREE.CameraHelper( this.light.shadow.camera );
    // this.scene.add( this.helper );


    this.renderer.render(this.scene, this.camera);
  }

  generate_vectors() {
    // console.log('----generate_vectors');
    const vectors = [];

    this.throwData.set.forEach((item) => {
      const vec = this.make_random_vector(this.throwVector);
      const pos = {
        x: this.w * (vec.x > 0 ? -1 : 1) * 0.9,
        y: this.h * (vec.y > 0 ? -1 : 1) * 0.9,
        z: (this.rnd() * 200) + 200,
      };
      const projector = Math.abs(vec.x / vec.y);
      if (projector > 1.0) pos.y /= projector; else pos.x *= projector;
      const velvec = this.make_random_vector(this.throwVector);
      const velocity = { x: velvec.x * this.boost, y: velvec.y * this.boost, z: -10 };
      const inertia = this.dice_inertia[item];
      const angle = {
        x: -((this.rnd() * vec.y * 5) + (inertia * vec.y)),
        y: (this.rnd() * vec.x * 5) + (inertia * vec.x),
        z: 0,
      };
      const axis = { x: this.rnd(), y: this.rnd(), z: this.rnd(), a: this.rnd() };
      vectors.push({ set: item, pos, velocity, angle, axis });
    });

    return vectors;
  }

  create_dice(type, pos, velocity, angle, axis) {
    const dice = this[`create_${type}`]();
    dice.castShadow = true;
    dice.receiveShadow = true;
    dice.dice_type = type;
    dice.body = new CANNON.RigidBody(this.dice_mass[type],
      dice.geometry.cannon_shape, this.dice_body_material);
    dice.body.position.set(pos.x, pos.y, pos.z);
    dice.body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(axis.x, axis.y, axis.z), axis.a * Math.PI * 2,
    );
    dice.body.angularVelocity.set(angle.x, angle.y, angle.z);
    dice.body.velocity.set(velocity.x, velocity.y, velocity.z);
    dice.body.linearDamping = 0.01;
    dice.body.angularDamping = 0.01;
    // console.log(dice);
    this.scene.add(dice);
    this.dices.push(dice);
    this.world.add(dice.body);
  }

  check_if_throw_finished() {
    let res = true;
    const e = 2;
    if (this.iteration < 10 / this.frame_rate) {
      for (let i = 0; i < this.dices.length; ++i) {
        const dice = this.dices[i];
        if (dice.dice_stopped !== true) {
          const a = dice.body.angularVelocity;
          const v = dice.body.velocity;

          // console.log(Math.abs(a.x), Math.abs(a.y), Math.abs(a.z),
          //   Math.abs(v.x), Math.abs(v.y), Math.abs(v.z));
          if (Math.abs(a.x) < e && Math.abs(a.y) < e && Math.abs(a.z) < e &&
            Math.abs(v.x) < e && Math.abs(v.y) < e && Math.abs(v.z) < e) {
            if (dice.dice_stopped) {
              if (this.iteration - dice.dice_stopped > 3) {
                // console.log(dice.rotation);
                // console.log(dice.body.quaternion.toString());
                console.log(dice.body.position.z);
                if (dice.body.position.z >= 31) {
                  console.log(`${dice.body.position.z} ---------------------------- ALERT`);
                  this.diceThrownIncorrectly = true;
                }
                dice.dice_stopped = true;
              }
            } else dice.dice_stopped = this.iteration;
            res = false;
          } else {
            dice.dice_stopped = undefined;
            res = false;
          }
        }
      }
    }
    return res;
  }

  emulate_throw() {
    while (!this.check_if_throw_finished()) {
      ++this.iteration;
      this.world.step(this.frame_rate);
    }
    if (this.diceThrownIncorrectly === true) {
      this.diceThrownIncorrectly = false;
      console.log('diceThrownIncorrectly');
      // emulate_throw()§
    } else {
    }
    return Roller.get_dice_values(this.dices);
  }

  __animate(threadid) {
    const time = (new Date()).getTime();
    let time_diff = (time - this.last_time) / 1000;
    if (time_diff > 3) time_diff = this.frame_rate;
    ++this.iteration;
    if (this.use_adapvite_timestep) {
      while (time_diff > this.frame_rate * 1.1) {
        this.world.step(this.frame_rate);
        time_diff -= this.frame_rate;
      }
      this.world.step(time_diff);
    } else {
      this.world.step(this.frame_rate);
    }

    this.scene.children.forEach((child) => {
      if (child.body !== undefined) {
        child.position.copy(child.body.position);
        child.quaternion.copy(child.body.quaternion);
      }
    });

    this.renderer.render(this.scene, this.camera);
    this.last_time = this.last_time ? time : (new Date()).getTime();
    if (this.running === threadid && this.check_if_throw_finished()) {
      this.running = false;
      if (this.callback) this.callback.call(this, Roller.get_dice_values(this.dices));
    }
    const that = this;
    if (this.running === threadid) {
      (function (t, tid, uat) {
        if (!uat && time_diff < that.frame_rate) {
          setTimeout(() => {
            requestAnimationFrame(() => {
              t.__animate(tid);
              that.stats.update();
              // update stats
            });
          }, (that.frame_rate - time_diff) * 1000);
        } else {
          requestAnimationFrame(() => {
            t.__animate(tid);
            // update stats
            that.stats.update();
          });
        }
      }(this, threadid, this.use_adapvite_timestep));
    }
  }

  clear() {
    this.running = false;
    while (this.dices.length !== 0) {
      const dice = this.dices.pop();
      this.scene.remove(dice);
      if (dice.body) this.world.remove(dice.body);
    }
    if (this.pane) this.scene.remove(this.pane);
    this.renderer.render(this.scene, this.camera);
    const box = this;
    setTimeout(() => { box.renderer.render(box.scene, box.camera); }, 100);
  }

  prepare_dices_for_roll(vectors) {
    // console.log('prepare_dices_for_roll');
    // console.log(vectors);
    this.clear();
    this.iteration = 0;
    vectors.forEach((vector) => {
      this.create_dice(vector.set, vector.pos, vector.velocity,
        vector.angle, vector.axis);
    });

    // for (const i in vectors) {
    //   this.create_dice(vectors[i].set, vectors[i].pos, vectors[i].velocity,
    //     vectors[i].angle, vectors[i].axis);
    // }
  }

  checkDicePosition() {
    // get average y
    const values = [];
    this.dices.forEach((dice) => {
      values.push(dice.body.position.z);
    });
    const sum = values.reduce((previous, current) => current += previous);
    const avg = sum / values.length;
    console.log('checkDicePosition');
    console.log(avg);
    console.log('checkDicePosition');
    // check if any dice is above the avg
    this.dices.forEach((dice) => {
      console.log(`dice.body.position.z:${dice.body.position.z}`);
      if (dice.body.position.z > avg) {
        console.log('this dice has\'t rolled properly');
        return false;
      }
    });
    return true;
  }

  roll(vectors, values, callback) {
    // console.log('roll');
    // console.log(vectors);
    // console.log(values);

    this.prepare_dices_for_roll(vectors);

    if (values != undefined && values.length) {
      this.use_adapvite_timestep = false;
      // console.log('-------- emulating throw');
      const res = this.emulate_throw();
      console.log(this.checkDicePosition());


      // check if any dice is higher 
      // generate new vectors
      // const vectors = this.generate_vectors(throw_data, vector, boost);
      // emulate again

      // console.log('-------- finished emulating throw');
      // console.log(res);
      this.prepare_dices_for_roll(vectors);

      for (let i = 0; i < res.length; i++) {
        Roller.shift_dice_faces(this.dices[i], values[i], res[i]);
      }
    }

    this.callback = callback;
    this.running = (new Date()).getTime();
    this.last_time = 0;
    this.__animate(this.running);
  }

  bind_mouse(container, throw_data, before_roll, after_roll) {
    Roller.bind(container, ['mousedown', 'touchstart'], (ev) => {
      ev.preventDefault();
      this.mouse_time = (new Date()).getTime();
      this.mouse_start = Roller.get_mouse_coords(ev);
    });
    Roller.bind(container, 'mousemove', (ev) => {
      ev.stopPropagation();
      const m = Roller.get_mouse_coords(ev);
      // console.log('mouse coords: ' + m.x + ' : ' + m.y);
      // console.log('this.mouse_start coords: ' + this.mouse_start.x + ' : ' + this.mouse_start.y);
    });
    Roller.bind(container, ['mouseup', 'touchend'], (ev) => {
      if (this.rolling) return;
      if (this.mouse_start == undefined) return;
      ev.stopPropagation();
      const m = Roller.get_mouse_coords(ev);
      const vector = { x: m.x - this.mouse_start.x, y: -(m.y - this.mouse_start.y) };
      this.mouse_start = undefined;
      const dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      if (dist < Math.sqrt(this.w * this.h * 0.01)) {
        // console.log("you didn't drag long enough");
        return;
      }
      let time_int = (new Date()).getTime() - this.mouse_time;
      if (time_int > 2000) time_int = 2000;
      const boost = Math.sqrt((2500 - time_int) / 2500) * dist * 2;

      this.throw_dices(vector, boost, dist, throw_data, before_roll, after_roll);
    });
  }

  start_throw(throw_data, before_roll, after_roll) {
    if (this.rolling) return;

    const vector = { x: (this.rnd() * 2 - 1) * this.w, y: -(this.rnd() * 2 - 1) * this.h };
    const dist = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    const boost = (this.rnd() + 3) * dist;

    this.throw_dices(vector, boost, dist, throw_data, before_roll, after_roll);
  }

  dice_box(container, dimensions) {
    this.use_adapvite_timestep = true;
    // this.animate_selector = true;

    this.dices = [];
    this.scene = new THREE.Scene();
    window.scene = this.scene;
    this.world = new CANNON.World();

    this.renderer = window.WebGLRenderingContext
      ? new THREE.WebGLRenderer({ antialias: true })
      : new THREE.CanvasRenderer({ antialias: true });
    container.appendChild(this.renderer.domElement);
    this.renderer.shadowMap.enabled = true;
    this.renderer.render.shadowMapSoft = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    // this.renderer.setClearColor(0xff00ff);

    this.reinit(container, dimensions);

    this.world.gravity.set(0, 0, -9.8 * 800);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 16;

    const ambientLight = new THREE.AmbientLight(0xd7ad59);
    this.scene.add(ambientLight);

    this.dice_body_material = new CANNON.Material();
    const desk_body_material = new CANNON.Material();
    const barrier_body_material = new CANNON.Material();
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      desk_body_material, this.dice_body_material, 0.01, 0.5));
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      barrier_body_material, this.dice_body_material, 0, 1.0));
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.dice_body_material, this.dice_body_material, 0, 0.5));

    this.world.add(new CANNON.RigidBody(0, new CANNON.Plane(), desk_body_material));
    let barrier;
    barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    barrier.position.set(0, this.h * 0.93, 0);
    this.world.add(barrier);

    barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    barrier.position.set(0, -this.h * 0.93, 0);
    this.world.add(barrier);

    barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    barrier.position.set(this.w * 0.93, 0, 0);
    this.world.add(barrier);

    barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    barrier.position.set(-this.w * 0.93, 0, 0);
    this.world.add(barrier);

    this.last_time = 0;
    this.running = false;

    this.renderer.render(this.scene, this.camera);
  }
}

function dice_initialize(container) {
  const canvas = document.getElementById('canvas');

  canvas.style.width = `${window.innerWidth - 1}px`;
  canvas.style.height = `${window.innerHeight - 1}px`;

  function getSet() {
    // get random number of dice 1 - 6
    const numberOfDice = Math.floor(Math.random() * 6 + 1);
    const set = [];
    for (let i = numberOfDice - 1; i >= 0; i--) {
      set.push('d6');
    }
    return set;
  }

  const throw_data = {
    set: ['d6', 'd6', 'd6', 'd6', 'd6', 'd6'],
    // set: getSet(),
    result: [1, 2, 3, 4, 5, 6],
    // result: [ 1, 1, 1, 1, 1, 1],
    // result: [],
  };

  function before_roll(vectors, notation, callback) {
    callback();
  }

  function after_roll(notation, result) {}

  const w = window.innerWidth / 4;
  const h = window.innerHeight / 4;
  const roller = new Roller();
  roller.dice_box(canvas, { w, h });

  window.addEventListener('resize', () => {
    const newW = `${window.innerWidth - 1}px`;
    const newH = `${window.innerHeight - 1}px`;
    canvas.style.width = newW;
    canvas.style.height = newH;
    roller.reinit(canvas, { w, h });
  });

  roller.bind_mouse(container, throw_data, before_roll, after_roll);
  roller.start_throw(throw_data, before_roll, after_roll);
}
