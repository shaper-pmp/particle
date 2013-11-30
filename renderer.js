var CanvasRenderer = function(engine, container) {
  
  this.engine = engine;
  
  this.init = function(container) {
    this.container = container && container.nodeType ? container : document.getElementById(container);  // If element given use that, otherwise assume it's the ID of an element to load
    
    if(this.container && this.container.tagName && this.container.tagName.toLowerCase() !== "canvas") { // If it's an ID but not of  canvas element, deleted it and replace the element with a canvas element with that ID
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
    if(!this.container) {
      var cv = document.createElement("canvas");
      cv.id = container;
      cv.width = engine.width * 10;
      cv.height = engine.height * 10;
      this.container = document.body.appendChild(cv);
    }
    this.ctx = this.container.getContext('2d');
    
    this.particleWidth = this.container.width / this.engine.width;
    this.particleHeight = this.container.height / this.engine.height;
    
    this.setUpEvents();
  };
  
  this.setUpEvents = function() {
    
    // Respond to worldUpdated and worldTick events by repainting the canvas element
    this.engine.on('worldUpdated worldTick', (function(renderer) {
      return function(e) {
        renderer.render();
      };
    })(this));
    
    // Convert DOM clicks on the canvas element into game cellClick events
    this.container.addEventListener('click', (function(renderer, engine) {
      return function(e) {
        var elementX = e.currentTarget.offsetLeft-document.documentElement.scrollLeft;
        var elementY = e.currentTarget.offsetTop-document.documentElement.scrollTop;
        var canvasX = e.clientX-elementX, canvasY = e.clientY-elementY;
        var cellX = Math.floor(canvasX/renderer.particleWidth);
        var cellY = Math.floor(canvasY/renderer.particleHeight);
        engine.fireEvent('cellClick', {x:cellX, y:cellY, renderer:renderer, originalClickEvent:e});
      };
    })(this, this.engine)
    );
  };

  
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
  
  this.init(container);
};