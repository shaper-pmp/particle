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
    fixed: false,
    valueOf: function() { return 1; }
  },
  WATER: {
    name: "Water",
    colour: "#0080ff",
    fluidity: Infinity,
    sticky: 0,
    density: 0.1,
    fixed: false,
    valueOf: function() { return 2; }
  },
  SLIME: {
    name: "Slime",
    colour: "#00ff00",
    fluidity: 0.01,
    sticky: 0,
    density: 0.9,
    fixed: false,
    valueOf: function() { return 3; }
  },
  CLAY: {
    name: "Clay",
    colour: "#d06000",
    fluidity: 0,
    sticky: 2,
    density: 1,
    fixed: false,
    valueOf: function() { return 4; }
  },
  CONCRETE: {
    name: "Concrete",
    colour: "#c0c0c0",
    fluidity: 0,
    sticky: 0,
    density: 10,
    fixed: true,
    valueOf: function() { return 5; }
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
