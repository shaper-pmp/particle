var GUI = function(game, world_element) {
  
  this.game = game;
  this.world_element = (world_element && world_element.nodeType) ? world_element : document.getElementById(world_element);
  
  this.init = function() {
    
    // Set up materials UI
    var matsSelect = document.getElementById("materialtypes");
    for(var i=0; i<Materials.length; i++) {
      var opt = document.createElement("option");
      var material = Materials.get(i);
      opt.value=material.valueOf();
      opt.text = material.name;
      opt.style.backgroundColor = material.colour;
      matsSelect.add(opt);
    }
    matsSelect.onchange = (function(gui) {
      return function() {
        gui.game.selectedMaterial = Materials.get(Number(this.options[this.selectedIndex].value));
      };
    })(this);
    
    
    // Set up world-state UI
    this.game.engine.on('worldUpdated worldTick', (function(gui) {
      return function(e) {
        gui.copyWorldToUI();
      };
    })(this));
    
    // Set up engine interaction events
    
    this.game.start();
  };
  
  this.copyWorldToUI = function() {
    document.getElementById("output").value = JSON.stringify(this.game.engine.particles);
  };
  
  this.pause = function() {
    this.game.pause();
    document.getElementById('simstate').innerHTML='Paused';
  };
  
  this.start = function() {
    this.game.start();
    document.getElementById('simstate').innerHTML='Running';
  };
  
  this.step = function() {
    this.game.tick();
    document.getElementById('simstate').innerHTML='Paused';
  };
  
  this.reset = function() {
    this.game.reset();
  };
}