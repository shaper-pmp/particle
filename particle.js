var Game = function(engine, renderer) {
  this.engine = engine;
  this.renderer = renderer;
  this.intervalTimer = null;
  this.tickLength = 100;
  
  this.renderer.render();
  
  this.renderer.attachEventHandler("cellClick", (function(game) {
    return function(x, y, renderer, engine, e) {
      if((!selectedMaterial || selectedMaterial === Materials.NONE) && !engine.emptyCell(x, y)) {
        var particle = engine.world[x][y];
        engine.deleteParticle(particle);
        if(!game.isRunning()) {
          renderer.render();
          game.copyWorldToOutput();
        }
      }
      if(selectedMaterial && selectedMaterial !== Materials.NONE && engine.emptyCell(x, y)) {
        var particle = new Particle(selectedMaterial, x, y);
        engine.addParticle(particle);
        if(!game.isRunning()) {
          renderer.render();
          game.copyWorldToOutput();
        }
      }
    };
  })(this));
  
  this.renderer.container.addEventListener("worldTick", (function(game) {
    return function(e) {
      game.copyWorldToOutput();
    };
  })(this));
  
  // Game object methods
  
  this.copyWorldToOutput = function() {
    document.getElementById("output").value = JSON.stringify(this.engine.particles);
  }
  
  this.tick = function() {
    this.engine.step();
    this.renderer.render();
    var tickEvent = new CustomEvent('worldTick', {
      detail: {
        game: this,
        renderer: this.renderer,
        engine: this.engine,
      }
    });
    this.renderer.container.dispatchEvent(tickEvent);
  };
  
  this.start = function() {
    if(this.intervalTimer == null) {
      this.intervalTimer = setInterval(
        (function(self) {
          return function() {
            self.tick();
          };
        })(this)
      , this.tickLength);
    }
  };
  
  this.pause = function() {
    if(this.intervalTimer != null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  };
  
  this.stop = function() {
    this.pause();
    this.engine.reset();
    this.renderer.render();
  };
  
  this.reset = function() {
    this.engine.reset();
    this.renderer.render();
  };
  
  this.isRunning = function() {
    return this.intervalTimer !== null;
  };
  
  this.loadWorld = function(newWorld) {
    if(typeof newWorld === "string") {
      newWorld = JSON.parse(newWorld);
    }
    
    if(!newWorld instanceof Array) {
      alert("Invalid world - must be an Array of Particle objects/hashes");
      return null;
    }
    
    this.reset();
    
    var inflatedParticles = [];
    for(var i=0; i<newWorld.length; i++) {
      var p = new Particle(newWorld[i]);
      inflatedParticles.push(p);
      this.engine.world[p.x][p.y] = p;
    }
    
    this.engine.particles = inflatedParticles;
    this.pause();
    this.renderer.render();
    this.copyWorldToOutput();
    
    return true;
  }
  
  
};

var Materials = {
  NONE: {
    name: "None",
    colour: "#ffffff",
    valueOf: function() { return 0; }
  },
  SAND: {
    name: "Sand",
    colour: "#f0e000",
    fluidity: 1,
    sticky: 0,
    density: 1,
    valueOf: function() { return 1; }
  },
  WATER: {
    name: "Water",
    colour: "#0080ff",
    fluidity: Infinity,
    sticky: 0,
    density: 0.1,
    valueOf: function() { return 2; }
  },
  SLIME: {
    name: "Slime",
    colour: "#00ff00",
    fluidity: 0.01,
    sticky: 0,
    density: 0.9,
    valueOf: function() { return 3; }
  },
  CLAY: {
    name: "Clay",
    colour: "#d06000",
    fluidity: 0,
    sticky: 2,
    density: 1,
    valueOf: function() { return 4; }
  },
  get: function(i) {
    for(property in this) {
      if(property === property.toUpperCase() && this[property].valueOf() === i) {
        return this[property];
      }
    }
    return null;
  },
  get length () {
    var count = 0;
    for(property in this) {
      if(property === property.toUpperCase()) {
        count++;
      }
    }
    return count; // Ignore length
  },
};

var ParticleEngine = function(w, h) {
  this.width = w;
  this.height = h;
  
  this.gravity = {
    x: 0,
    y: 1
  };
  
  this.world = [];
  this.particles = [];
  
  this.HORIZONTAL = 1;
  this.VERTICAL = 2;
  this.BOTH = 3;
  
  this.reset = function() {
    this.world = [];
    for (var i = 0; i < w; i++) {
      this.world.push([]);
      for (var j = 0; j < h; j++) {
        this.world[i][j] = null;
      }
    }
    
    this.particles = [];
    /*for(var i=0; i<20; i++) {
      this.particles.push(this.world[10][i] = new Particle(Materials.SAND, 10, i));
    }*/
    
  };
  this.reset();
  
  this.step = function() {
    for(var j=this.world[0].length-1; j>=0; j--) {
      for(var i=0; i<this.world.length; i++) {
        
        var p = this.getCell(i, j);
        
        if(p) {
          // Update momentum
          p.dx += this.gravity.x;
          p.dy += this.gravity.y;
          
          // Check for stickiness, and only move particle if not adjacent to any others or adjacent and dx/dy > stickiness
          if(p.dx != 0) { // If moving horizontally, check stickiness for vertically-adjacent particles
            var maxSticky = p.material.sticky;
            var adjacents = this.adjacentParticles(p.x, p.y, this.VERTICAL);  // Find any vertically adjacent particles
            if(adjacents.length) {
              for(var loop=0; loop<adjacents.length; loop++) {
                var minSticky = adjacents[loop].material.sticky < p.material.sticky ? adjacents[loop].material.sticky : p.material.sticky;  // Take the minimum stickiness value between the current particle and each adjacent one (because glue doesn't stick to Teflon)
                maxSticky = minSticky > maxSticky ? minSticky : maxSticky;  // Then record the *highest* value of each of these comparisons (because running water past clay doesn't unstick it form other clay)
              }
              p.dx += (p.dx > 0) ? -maxSticky : maxSticky;
            }
          }
          if(p.dy != 0) { // If moving vertically, check stickiness for horizontally-adjacent particles
            var maxSticky = 0;
            var adjacents = this.adjacentParticles(p.x, p.y, this.HORIZONTAL);  // Find any vertically adjacent particles
            if(adjacents.length) {
              for(var loop=0; loop<adjacents.length; loop++) {  // Compare stickiness between this particle and each adjacent particle in turn
                var minSticky = adjacents[loop].material.sticky < p.material.sticky ? adjacents[loop].material.sticky : p.material.sticky;  // Take the minimum stickiness value between the current particle and each adjacent one (because glue doesn't stick to Teflon)
                maxSticky = minSticky > maxSticky ? minSticky : maxSticky;  // Then record the *highest* value of each of these comparisons (because running water past clay doesn't unstick it form other clay)
              }
              p.dy += (p.dy > 0) ? -maxSticky : maxSticky;
            }
          }
          
          // Move particle as far towards new location as possible
          var oldX = p.x, oldY = p.y;
          if(!this.moveParticleToIntersection(p, p.x+p.dx, p.y+p.dy)) {
            p.adjustPosition(this);
            p.dx = (p.x == oldX) ? 0 : p.dx;
            p.dy = (p.y == oldY) ? 0 : p.dy;
          }
        }
      }
    }
  };
  
  this.addParticle = function(p, x, y) {
    x = x || p.x;
    y = y || p.y;
    p.x = x;
    p.y = y;
    
    if(this.emptyCell(p.x, p.y)) {
      this.particles.push(p);
      this.world[p.x][p.y] = p;
    }
    return false;
  };
  
  this.deleteParticle = function(p) {
    for(var i=0; i<this.particles.length; i++) {
      if(this.particles[i] === p) {
        this.world[p.x][p.y] = null;
        this.particles.splice(i, 1);
      }
    }
  };
  
  this.swapParticles = function(p, q) {
    var savedX = p.x, savedY = p.y;
    
    p.x = q.x; p.y = q.y;
    
    q.x = savedX; q.y = savedY;
    
    this.world[p.x][p.y] = p;
    this.world[q.x][q.y] = q;
  };
  
  this.moveParticleTo = function(p, x, y) {
    
    if(this.emptyCell(x, y)) {      // If moving to empty cell, just move it
      this.world[p.x][p.y] = null;
      this.world[x][y] = p;
      p.x = x;
      p.y = y;
    }
    else if(this.cellContentsIsMovableBy(p.material, x, y)) { // If moving to occupied cell and the particle in this position has a lower density than the one moving into it, swap the positions of particles
      this.swapParticles(p, this.world[x][y]);
    }
  };
  
  this.moveParticleToIntersection = function(p, targetX, targetY) {
    
    // Now calculate preliminary new position by iterating towards desired destination one unit vertically/horizontally at a time and checking for collisions
      
    var maxSteps = Math.max(p.dx, p.dy);
    
    var loopX = p.x;
    var loopY = p.y;
    
    var dx = 0, dy = 0;
    if(targetX != p.x) {
      dx = (targetX > p.x) ? 1 : -1;
    }
    if(targetY != p.y) {
      dy = (targetY > p.y) ? 1 : -1;
    }
    
    for(var i=0; i<maxSteps && this.emptyCell(loopX+dx, loopY+dy); i++) {
      if(loopX != targetX) {
        loopX += dx;
      }
      if(loopY != targetY) {
        loopY += dy;
      }
    }
    
    // And update position info in particle and world
    this.moveParticleTo(p, loopX, loopY);
    
    return (loopX == targetX && loopY == targetY);
  };
  
  this.emptyCell = function(x, y) {
    if(x < 0 || y < 0 || x >= this.width || y >= this.height) { // Check edges of world
      return false;
    }
    if(this.world[x][y]) {  // Check other particles in world
      return false;
    }
    return true;
  };
  
  this.cellContentsIsMovableBy = function(material, x, y) {
    return !this.world[x][y] || this.world[x][y].material.density < material.density;
  };
  
  this.getCell = function(x, y) {
    if(x < 0 || y < 0 || x >= this.width || y >= this.height) { // Check edges of world
      return null;
    }
    return this.world[x][y];
  };
  
  this.adjacentParticles = function(x, y, dir) {
    dir = dir || this.BOTH;
    var particles = [];
    
    if(dir & this.HORIZONTAL) {
      var left = this.getCell(x-1,y);
      var right = this.getCell(x+1,y);
      if(left) { particles.push(left); }
      if(right) { particles.push(right); }
    }
    if(dir & this.VERTICAL) {
      var top = this.getCell(x,y-1);
      var bottom = this.getCell(x,y+1);
      if(top) { particles.push(top); }
      if(bottom) { particles.push(bottom); }
    }
    
    return particles;
  };
  
};

/**
 * Particle class/constructor
 * @example new Particle(Materials.SAND, 100, 50)
 * @example new Particle(1, 100, 50)  // Material #1 is SAND
 * @example new Particle("1", 100, 50)
 * @example new Particle(someOtherParticleObject) // Copy all member values from this Particle (INCLUDING x/y coordinates) or hash
 * @example new Particle(someOtherParticleObject, 100, 50) // Copy all member values from this particle (overriding position with new x/y coordinates)
 */
var Particle = function(material, x, y) {
  
  // Set up basic details
  this.dx = 0;
  this.dy = 0;
  
  /* Treat material param differently, as it may contain:
   * A material object
   * A string or number value representing a material's numeric ID, or
   * A complete Particle object to copy members' values from
   */
  if(typeof material === "object" && material.material) { // material is another Particle to copy values from
    for(property in material) {
      this[property] = material[property];
    }
  }
  else {  // material is a material object, number or string
    this.material = material;
  }

  if(typeof this.material === "string" || typeof this.material === "number") {
    this.material = Materials.get(Number(this.material));
  }

  // Finally, allow passed-in x/y values to override any values passed in in a Particle object or hash
  this.x = x || this.x;
  this.y = y || this.y;
  
  this.adjustPosition = function(engine) {
    if(!engine.emptyCell(this.x, this.y+1)) {
      var checkingLeft = true, checkingRight = true;
      var offsetLeft = 0, offsetRight = 0;
      var passedEdgeLeft = false, passedEdgeRight = false;
      
      var nextParticle = engine.getCell(this.x, this.y+1);
      if(!nextParticle) {
        return;
      }
      
      //console.log(this, nextParticle);
      
      // Particle lands on another material of higher density, so flow over it
      if(nextParticle.material.density >= this.material.density) {
        // Start at the particle position and work outwards left and right one cell at a time, looking for the first hole(s) in the next row down
        for(var distance = 0;
          (
            distance <= this.material.fluidity ||
            (this.material.fluidity < 1 && Math.random() < this.material.fluidity)  // Random effect only kicks in for fluidity values < 1
          )
          && (checkingLeft || checkingRight); distance++) {
          
          var emptyLeft = engine.cellContentsIsMovableBy(this.material, this.x-distance, this.y+1);
          var emptyRight = engine.cellContentsIsMovableBy(this.material, this.x+distance, this.y+1);
          
          // Keep searching in each direction until we hit either:
          
          // 1. An empty cell on the level below the current one, or
          if(checkingLeft) {
            var p = engine.getCell(this.x-distance, this.y+1);
            if(p && p.material.fluidity < this.material.fluidity) { // Any material with lower fluidity can form a basin containing higher-fluidity materials
              passedEdgeLeft = true;
            }
            if(emptyLeft) {
              offsetLeft = distance;
              checkingLeft = false;
            }
          }
          if(checkingRight) {
            var p = engine.getCell(this.x+distance, this.y+1);
            if(p && p.material.fluidity < this.material.fluidity) { // Any material with lower fluidity can form a basin containing higher-fluidity materials
              passedEdgeRight = true;
            }
            if(emptyRight) {
              offsetRight = distance;
              checkingRight = false;
            }
          }
          
          // 2. A non-empty cell on the same level as the current particle (ie, the edge of any "container" the water's dropped into)
          if(distance > 0 && !engine.cellContentsIsMovableBy(this.material, this.x-distance, this.y)) {
            checkingLeft = false;
          }
          if(distance > 0 && !engine.cellContentsIsMovableBy(this.material, this.x+distance, this.y)) {
            checkingRight = false;
          }
  
        }
        
        // If we find a hole on both sides, choose one
        if(offsetLeft && offsetRight) {
          
          // Cosmetic hack: if we had to cross over a solid boundary to find one hole but not the other, prefer the hole where we didn't have to cross a solid boundary.  This avoids the "overspilling out of a basin when there's still spaces left in the top row of the basin" issue.
          if(passedEdgeRight && !passedEdgeLeft) {
            offsetRight = 0;
          }
          else if(passedEdgeLeft && !passedEdgeRight) {
            offsetLeft = 0;
          }
          
          // Otherwise if both are equally good choices (both in a basin, or both outside of one), randomly choose between them
          if(Math.round(Math.random(), 0) == 0) {
            offsetRight = 0;
          }
          else {
            offsetLeft = 0;
          }
        }
        
        // And now if we've found (and/or chosen) a hole, move the particle into it.
        if(offsetLeft) {
          engine.moveParticleTo(this, this.x-offsetLeft, this.y+1);
          //console.log(this, this.x, "left", offsetLeft, this.x-offsetLeft);
        }
        else if(offsetRight) {
          engine.moveParticleTo(this, this.x+offsetRight, this.y+1);
          //console.log(this, this.x, "right", offsetRight, this.x+offsetRight);
        }
      }
      // Landed on a particle with lower density, so sink through the substance
      else if(nextParticle.material.density < this.material.density && nextParticle.material.fluidity > 0) {
        engine.swapParticles(this, nextParticle);
      }
    }
  };

  /**
   * Serialise a simplified, less-redundant version ofthe Particle object (mterial object converted to Material ID, methods missing, etc) suitable for reinflating by being passed to the Particle constructor
   */
  this.toJSON = function() {
    var simplified = {};
    for(property in this) {
      if(property === "material") { // Convert redundant material objects into corresponding numerical ID
        simplified[property] = this[property].valueOf();
      }
      else if(typeof this[property] !== "function") {
        simplified[property] = this[property];
      }
    }
    
    return simplified;
  };
}

var CanvasRenderer = function(engine, id) {
  
  this.container = document.getElementById(id);
  if(!this.container || this.container.tagName.toLowerCase() != "canvas") {
    var cv = document.createElement("canvas");
    cv.id = id;
    cv.width = engine.width * 10;
    cv.height = engine.height * 10;
    this.container = document.body.appendChild(cv);
  }
  this.ctx = this.container.getContext('2d');
  
  //console.log("Container (px)", this.container.width, this.container.height);
  
  this.engine = engine;
  
  //console.log("World (cells)", engine.width, engine.height);
  
  this.particleWidth = this.container.width / this.engine.width;
  this.particleHeight = this.container.height / this.engine.height;
  
  //console.log("Particles", this.particleWidth, this.particleHeight);
  
  this.render = function() {
    this.ctx.clearRect(0, 0, this.container.width, this.container.height);
    
    for(var i=0; i<this.engine.width; i++) {
      for(var j=0; j<this.engine.height; j++) {
        var p = this.engine.getCell(i, j);
        if(p) {
          this.renderParticle(p);
        }
      }
    }
  };
  
  this.renderParticle = function(p) {
    //console.log("Drawing ", p.material.name, "particle at ", p.x*this.particleWidth, p.y*this.particleHeight);
    this.ctx.fillStyle = p.material.colour;
    this.ctx.fillRect(p.x*this.particleWidth, p.y*this.particleHeight, this.particleWidth, this.particleHeight);
  };
  
  this.attachEventHandler = function(event, handler) {
    switch(event) {
      case 'cellClick':
        this.container.addEventListener('click', (function(renderer, engine) {
          return function(e) {
            var elementX = e.currentTarget.offsetLeft-document.documentElement.scrollLeft;
            var elementY = e.currentTarget.offsetTop-document.documentElement.scrollTop;
            var canvasX = e.clientX-elementX, canvasY = e.clientY-elementY;
            var cellX = Math.floor(canvasX/renderer.particleWidth);
            var cellY = Math.floor(canvasY/renderer.particleHeight);
            handler(cellX, cellY, renderer, engine, e);
          };
        })(this, this.engine)
        );
        break;
    }
    
  }
};