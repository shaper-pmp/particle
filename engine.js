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
        
        if(p && !p.material.fixed) {
          // Sum forces acting on particle, and add result to dx & dy
          
            // Add active forces:
            
              // Gravity
              p.dx += this.gravity.x;
              p.dy += this.gravity.y;
          
            // NOT SURE ABOUT THIS ONE: If less-dense material beneath, add upward force of (difference in density - fluidity of material above)
            
            // If dx or dy > 0, subtract passive forces down as far as 0 (no further - friction can stop you, but it can't make you go back the other way)
              // *** FRICTION/Stickiness (solids only) ***
              // Subtract friction/stickiness (calculate lowest friction value of each particle-adjacent particle pair, then choose highest friction value and subtract from dx/dy) - separate calculations for dx and dy, or combine together?
              var maxStickyForce = this.calculateStickinessForce(p, this.BOTH);
              if(p.dx > 0)      { p.dx -= Math.min(p.dx, maxStickyForce); }   // If dx positive, apply force the other, way up to maxStickyForce or the particle reaches standstill
              else if(p.dx < 0) { p.dx += Math.min(-p.dx, maxStickyForce); }  // Ditto if dx negative
              if(p.dy > 0)      { p.dy -= Math.min(p.dy, maxStickyForce); }   // If dy positive, apply force the other, way up to maxStickyForce or the particle reaches standstill
              else if(p.dy < 0) { p.dy += Math.min(-p.dy, maxStickyForce); }  // Ditto if dy negative
              
              // If particle(s) in dx/dy direction, subtract inverse of fluidity (viscosity)?
              
          // Add dx & dy to current position to establish target
          // Move towards target until target or intersection
          
          // Move particle as far towards new location as possible
          
          
          // ***** OLD STEP FUNCTION CODE (temporarily transplanted to test the force-resolution code above) *****
          var oldX = p.x, oldY = p.y;
          var reachedTarget = this.moveParticleToIntersection(p, p.x+p.dx, p.y+p.dy);
          var dx_dir = p.dx == 0 ? 0 : (p.dx/Math.abs(p.dx)); // Convert positive/negative dx and dy values to +/-1
          var dy_dir = p.dy == 0 ? 0 : (p.dy/Math.abs(p.dy));
          var q = this.getCell(p.x+dx_dir, p.y+dy_dir); // Particle (if any) in the place we're trying to move into
          if(p.material.fluidity > 0 && q && p.material.density === q.material.density) {  // Haven't moved, but liquid sitting on liquid of same density
            // Landed on a particle of the same density, so flow through/into it
            var hole = this.findNextHoleInRow(p, q.x, q.y, q.y);
            if(hole) {
              this.moveParticleTo(p, hole.x, hole.y);
            }
            p.dx = 0;
            p.dy = 0;
          }
          else if(!reachedTarget) {  // If not reached destination but have moved, adjust position
            p.adjustPosition(this);
            p.dx = 0;
            p.dy = 0;
          }
          
        }
      }
    }
  };
  
  /*this.step = function() {
    for(var j=this.world[0].length-1; j>=0; j--) {
      for(var i=0; i<this.world.length; i++) {
        
        var p = this.getCell(i, j);
        
        if(p && !p.material.fixed) {
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
          var reachedTarget = this.moveParticleToIntersection(p, p.x+p.dx, p.y+p.dy);
          var dx_dir = p.dx == 0 ? 0 : (p.dx/Math.abs(p.dx)); // Convert positive/negative dx and dy values to +/-1
          var dy_dir = p.dy == 0 ? 0 : (p.dy/Math.abs(p.dy));
          var q = this.getCell(p.x+dx_dir, p.y+dy_dir); // Particle (if any) in the place we're trying to move into
          if(p.material.fluidity > 0 && q && p.material.density === q.material.density) {  // Haven't moved, but liquid sitting on liquid of same density
            // Landed on a particle of the same density, so flow through/into it
            var hole = this.findNextHoleInRow(p, q.x, q.y, q.y);
            if(hole) {
              this.moveParticleTo(p, hole.x, hole.y);
            }
            p.dx = 0;
            p.dy = 0;
          }
          else if(!reachedTarget) {  // If not reached destination but have moved, adjust position
            p.adjustPosition(this);
            p.dx = 0;
            p.dy = 0;
          }
        }
      }
    }
  };*/
  
  this.addParticle = function(p, x, y) {
    x = x >= 0 ? x : p.x;
    y = y >= 0 ? y : p.y;
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
    if(x < 0 || y < 0 || x >= this.width || y >= this.height) { // Check edges of world (treat edges as immovable)
      return false;
    }
    return !this.world[x][y] || (this.world[x][y].material.density < material.density && !this.world[x][y].material.fixed);  // Check empty cell or cell occupied by a less-dense, non-fixed material than the current particle
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
  
  /**
   * Given the particle and its surrounding particles, calculate lowest friction (stickiness) value of each particle-adjacent particle pair, then choose highest friction value.
   * Only solids contribute friction by stickiness - liquids use viscosity (-fluidity) instead.
   * @argument {Particle} p Particle to determine frictional forces for
   *
   * @returns (int) Maximum frictional force exerted by surrounding particles stickiness. Scalar, not vector - always positive (or 0), and should be applied in *opposition* to any movement of the particle.
   */
  this.calculateStickinessForce = function(p, dir) {
    
    if(p.material.fluidity <= 1) {  // Only consider stickiness for solids
      var adjacents = this.adjacentParticles(p.x, p.y, dir);  // Find any adjacent particles in one or both dimensions
      if(adjacents.length) {
        var maxSticky = 0;
        for(var loop=0; loop<adjacents.length; loop++) {
          var minSticky = Math.min(adjacents[loop].material.sticky, p.material.sticky);  // Take the minimum stickiness value between the current particle and each adjacent one (because glue doesn't stick to Teflon)
          if(adjacents[loop].material.fluidity > 1) {
            minSticky = 0;
          }
          maxSticky = minSticky > maxSticky ? minSticky : maxSticky;  // Then record the *highest* value of each of these comparisons (because running water past clay doesn't unstick it form other clay)
        }
        return maxSticky;
      }
    }
    
    return 0;
  };
  
  this.findNextHoleInRow = function(p, startX, startY, barrierY) {
    
    var checkingLeft = true, checkingRight = true;
    var offsetLeft = 0, offsetRight = 0;
    var passedEdgeLeft = false, passedEdgeRight = false;
      
    // Start at the particle position and work outwards left and right one cell at a time, looking for the first hole(s) in the next row down
    for(var distance = 0;
      (
        distance <= p.material.fluidity ||
        (p.material.fluidity < 1 && Math.random() < p.material.fluidity)  // Random effect only kicks in for fluidity values < 1
      )
      && (checkingLeft || checkingRight); distance++) {
      
      var emptyLeft = this.cellContentsIsMovableBy(p.material, startX-distance, startY);
      var emptyRight = this.cellContentsIsMovableBy(p.material, startX+distance, startY);
      
      // Keep searching in each direction until we hit either:
      
      // 1. An empty cell on the level below the current one, or
      var leftCell = this.getCell(startX-distance, startY);
      if(checkingLeft) {
        if(leftCell && leftCell.material.fluidity < p.material.fluidity) { // Any material with lower fluidity can form a basin containing higher-fluidity materials
          passedEdgeLeft = true;
        }
        if(emptyLeft) {
          offsetLeft = distance;
          checkingLeft = false;
        }
      }
      var rightCell = this.getCell(startX+distance, startY);
      if(checkingRight) {
        if(rightCell && rightCell.material.fluidity < p.material.fluidity) { // Any material with lower fluidity can form a basin containing higher-fluidity materials
          passedEdgeRight = true;
        }
        if(emptyRight) {
          offsetRight = distance;
          checkingRight = false;
        }
      }
      
      // 2. A non-empty cell on the same level as the current particle (ie, the edge of any "container" the water's dropped into)
      var leftBarrier = this.getCell(startX-distance, barrierY);
      if(distance > 0 && leftBarrier && !this.cellContentsIsMovableBy(p.material, leftBarrier.x, leftBarrier.y) && p.material !== leftBarrier.material) {
        checkingLeft = false;
      }
      var rightBarrier = this.getCell(startX+distance, barrierY);
      if(distance > 0 && rightBarrier && !this.cellContentsIsMovableBy(p.material, rightBarrier.x, rightBarrier.y) && p.material !== rightBarrier.material) {
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
      //engine.moveParticleTo(p, startX-offsetLeft, startY);
      //console.log(p, startX, "left", offsetLeft, startX-offsetLeft);
      return {x:startX-offsetLeft, y:startY};
    }
    else if(offsetRight) {
      //engine.moveParticleTo(p, startX+offsetRight, startY);
      //console.log(p, startX, "right", offsetRight, startX+offsetRight);
      return {x:startX+offsetRight, y:startY};
    }
    
    return null;
  };
  
  this.fireEvent = function(type, detail) {
    detail.engine = detail.engine || this;
    
    var customEvent = new CustomEvent(type, { detail: detail });
    document.dispatchEvent(customEvent);
  };
  
  this.on = function(types, callback) {
    types = types.split(" "); // Allow passing in of multiple events using "event1 event2 event3" syntax
    for(var i=0; i<types.length;i++) {
      document.addEventListener(types[i], callback);
    }
    
  };
  
};
