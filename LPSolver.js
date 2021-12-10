var solver = require("javascript-lp-solver");

function perform(optimization, constraints, variables, ints) {
  var map = new Map(optimization)

  map.set('constraints', Object.fromEntries(constraints));
  map.set('variables', Object.fromEntries(variables));
  
  if(typeof ints === 'undefined') {
    ints = new Map();
    for (const [key, value] of variables.entries()) { 
      ints.set(key, 1);  
    }
  }

  map.set('ints', Object.fromEntries(ints));

  model = Object.fromEntries(map);

  //console.log('model =>');
  //console.log(model);

  mapresult = new Map(Object.entries(solver.Solve(model)));

  // {  feasible: true,  result: 1.1,  bounded: true,  isIntegral: true,  item3: 1}
  /*
  for (const [key, value] of mapresult.entries()) { 
    console.log('key : '+key+'=>'+value);
  }
  */
  
  return mapresult;
}

module.exports = { perform };
