var Game = function(engine, renderer) {
  this.engine = engine;
  this.renderer = renderer;
  this.intervalTimer = null;
  this.tickLength = 100;
  this.selectedMaterial = null;
  
  this.renderer.render();
  
  this.engine.on("cellClick", (function(game) {
    return function(e) {
      var x = e.detail.x, y = e.detail.y, renderer = e.detail.renderer, engine = e.detail.engine;
      if((!game.selectedMaterial || game.selectedMaterial === Materials.NONE) && !engine.emptyCell(x, y)) {
        var particle = engine.world[x][y];
        engine.deleteParticle(particle);
        game.engine.fireEvent('worldUpdated', {
          game: game,
          renderer: game.renderer
        });
      }
      if(game.selectedMaterial && game.selectedMaterial !== Materials.NONE && engine.emptyCell(x, y)) {
        var particle = new Particle(game.selectedMaterial, x, y);
        engine.addParticle(particle);
        game.engine.fireEvent('worldUpdated', {
          game: game,
          renderer: game.renderer
        });
      }
    };
  })(this));
  
  // Game object methods
  
  this.tick = function() {
    this.engine.step();
    this.engine.fireEvent('worldTick', {
      game: this,
      renderer: this.renderer
    });
    this.renderer.render();
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
    
    this.engine.fireEvent('worldUpdated', {
      game: this,
      renderer: this.renderer
    });
    
    return true;
  }
  
  
};


