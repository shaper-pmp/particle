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
      
      var nextParticle = engine.getCell(this.x, this.y+1);
      if(!nextParticle) {
        return;
      }
      
      //console.log(this, nextParticle);
      
      // Particle lands on another material of higher or equal density, so flow over it
      if(nextParticle.material.density >= this.material.density) {
        var hole = engine.findNextHoleInRow(this, this.x, this.y+1, this.y)
        if(hole) {
          engine.moveParticleTo(this, hole.x, hole.y);
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

