const lpsolver = require('./LPSolver.js');
const colors = require('colors/safe');
const sha256 = require('js-sha256').sha256

let Coordinate = class {
  constructor(lat, long)
  {
    this.latitude = lat;
    this.longitude = long;
  }
  set = function(lat, long) {
    this.latitude = lat;
    this.longitude = long;
  }
  /**
   * @param {Coordinate} coordinate - Coordinate
  */
  set = function(coordinate) {
    this.latitude = coordinate.latitude;
    this.longitude = coordinate.longitude;
  }  
}

Coordinate.prototype.toString = function coordinateToString() {
  if(typeof this.latitude === 'undefined' || typeof this.longitude === 'undefined')
    return 'uncalculated';
  return this.latitude + ", " + this.longitude;
}
  
let Position = class {
  constructor()
  {
    this.coordinate = new Coordinate();
  } 
}

let FoodPresentation = class {
  constructor()
  {
    this.food = null;
    this.name = '';
    this.presentationName = '';
    this.presentation = null;
    this.sort = 0;
  }

  text(){
    return this.presentationName+' ('+this.presentation+')';
  }
}

let DisplayFood = class {
  constructor() {
    this.name = '';
    this.unit = '';
    this.presentation = '';
    this.quantity = 0;
  }

  hash(){
    return sha256(this.name+this.unit+parseFloat(this.presentation).toFixed(2)+this.quantity);
  }

  static fromPresentation(p) {
    //console.log(p.foodPresentation);
    let entry = new DisplayFood();
    entry.name = p.foodPresentation.presentationName;    
    entry.presentation = p.foodPresentation.presentation;
    entry.quantity = p.quantity;
    entry.unit = p.foodPresentation.food.unit;
    return entry;
  }
}

DisplayFood.prototype.toString = function coordinateToString() {
  if(typeof this.n === 'undefined' || typeof this.q === 'undefined')
    return '';
  return 'n : '+this.n+" p: "+this.p+' q : '+this.q;
}

let FoodShopping = class {
  constructor()
  {
    this.food = '';
    this.quantity = 0;
    this.volumen = 0;
  }
}

let Package = class {
  constructor()
  {
    this.foodPackageMap = new Map();
    this.foodDisplayArray = new Array();
  }

  hash(){
    let buffer = '';
    for (var i = 0; i < this.foodDisplayArray.length; i++) {    
      buffer += this.foodDisplayArray[i].hash();
    }

    return sha256(buffer);
  }
}

let Shopping = class {
  constructor()
  {
    this.foodShoppingMap = new Map();
  }
}

let Modular = class {
  constructor()
  {
    this.code = null;
    this.name = '';
    this.users = 0;
    this.position = new Position();
    // CareType map
    this.careTypeMap = new Map();
  }

  defaultPresentation(caretype, delivery, foodpresentationarray) {

    if(!this.careTypeMap.has(caretype))
      throw new Error('Invalid caretype');

    caretypeitem = this.careTypeMap.get(caretype);

    if(!caretypeitem.deliveryMap.has(delivery))
      throw new Error('Invalid delivery');

    deliveryitem = caretypeitem.deliveryMap.get(delivery);

    for (const [key, value] of deliveryitem.foodDeliveryMap.entries()) {
      let fdp = new FoodPresentation();
      fdp.food = value.food;
      fdp.name = value.food.name;
      // presentation
      fdp.presentation = value.presentation;
      // this value could change
      fdp.presentationName = value.food.name;

      foodpresentationarray.push(fdp);
    }
  }

  async performDelivery(caretype, delivery, foodpresentationarray){

    if(!this.careTypeMap.has(caretype))
      throw new Error('Invalid caretype');

    let caretypeitem = this.careTypeMap.get(caretype);

    if(!caretypeitem.deliveryMap.has(delivery))
      throw new Error('Invalid delivery');

    //console.log(colors.bold('Package content <'+this.code+'> [S:'+this.users+'] for <'+caretype+'> delivery <'+delivery+'>'));
    //console.log('coordinate : '+this.position.coordinate);
    
    let deliveryitem = caretypeitem.deliveryMap.get(delivery);

    let packageitem = new Package();
    let shopping = new Shopping();
    
    for (const [key, value] of deliveryitem.foodDeliveryMap.entries()) {
      shopping.foodShoppingMap.set(key, new FoodShopping());
      let foodshoppingitem = shopping.foodShoppingMap.get(key);
      foodshoppingitem.food = value.food;
      foodshoppingitem.quantity = this.users * value.quantity;
      foodshoppingitem.volumen = parseFloat(foodshoppingitem.quantity*value.presentation);

      //console.log(foodshoppingitem.food.name+' q : '+foodshoppingitem.quantity+' v: '+foodshoppingitem.volumen);
    }

    // ...FoodPackage
    for (const [key, value] of deliveryitem.foodDeliveryMap.entries()) {
      packageitem.foodPackageMap.set(key, new FoodPackage());
      let foodpackageitem = packageitem.foodPackageMap.get(key);
      foodpackageitem.food = value.food;
      foodpackageitem.quantity = value.quantity;
      foodpackageitem.volumen = parseFloat(foodpackageitem.quantity*value.presentation);
      //console.log(foodpackageitem.food.name+' q : '+foodpackageitem.quantity+' v: '+foodpackageitem.volumen);
    }

    let optimization = new Map();
    optimization.set('optimize','profit');
    optimization.set('opType','max');

    for (const [key, value] of packageitem.foodPackageMap.entries()) {
      // each food
      //console.log(colors.red('calculating <'+key+'>'));
      // create a map with food
      let fpack = 0;
      let premap = new Map();

      // to calculate a max
      let delta = 999999.0;
      for(const fpre of foodpresentationarray) {
        //console.log('['+fpre.name+'/'+key+']');
        if(fpre.name.localeCompare(key) == 0) {
          if(fpre.food == null)
          fpre.food = value.food;
          premap.set(fpack++, fpre);
          if(delta > fpre.presentation)
            delta = fpre.presentation;
        }
      }

      // foodpackageitem
      let foodpackageentry = value;

      if(premap.size == 0)
      {
        console.log('No presentation configured for <'+key+'>');
        continue;
      }

      // just display
      /*
      console.log('Presentation [S:'+premap.size+']');      
      for (const [key, value] of premap.entries()) {
        console.log('key ['+key+'] : '+value.presentationName+' => '+value.presentation);
      }
      */

      let volumen = new Map();
      let min = parseFloat(packageitem.foodPackageMap.get(key).volumen);
      let max = parseFloat(packageitem.foodPackageMap.get(key).volumen+delta/2);
      volumen.set('min', min);
      volumen.set('max', max);
    
      let constraints = new Map();
      constraints.set('volumen', Object.fromEntries(volumen));

      let sortedpremap = new Map([...premap].sort((a, b) => {
        return a[1].presentation - b[1].presentation;
      }));
   
      let variables = new Map();
      let first = sortedpremap.entries().next().value;
      let profitfactor = first[1].presentation;

      let itemmap = new Map();

      for (const [key, value] of sortedpremap.entries()) {
        //console.log('key ['+key+'] : '+value.presentationName+' => '+value.presentation);
        let item = new Map();
        item.set('volumen', value.presentation);
        item.set('profit', Math.pow(2, value.presentation/profitfactor));
        itemmap.set(key, item);
      }

      let sortedim = new Map([...itemmap].sort((a, b) => {
        return b[1].get('volumen') - a[1].get('volumen');
      }));

      // premap
      /*
      console.log('premap : '+typeof premap);
      for (const [key, value] of premap.entries()) {
        console.log('key A ['+key+'] type : '+typeof key);
        console.log(premap.get(key));
      }*/

      let varindex = 0;
      for (const [key, value] of sortedim.entries()) {
        //console.log('key B ['+key+'] type : '+typeof key+' => '+value.get('volumen'));
        premap.get(key).sort = varindex;
        variables.set(varindex++, Object.fromEntries(value));
      }

      let lpresult = lpsolver.perform(optimization, constraints, variables);
      //console.log(lpresult);
      if(!(lpresult.has('feasible') && lpresult.get('feasible'))){
        console.log('No possible calculation');
        continue;
      }
      //console.log('feasible : '+f);

      // LF entries then add
      let index = 0;
      for (const [key, value] of premap.entries()) {
        // sorted index
        let ks = value.sort.toString();
        if(lpresult.has(ks)) {
          foodpackageentry.packagePresentationMap.set(index, new PackagePresentation());
          let ppentry = foodpackageentry.packagePresentationMap.get(index++);
          ppentry.foodPresentation = value;
          // calculated quantity
          ppentry.quantity = lpresult.get(ks);
        }
      }

      for (const [key, value] of foodpackageentry.packagePresentationMap.entries()) {
        let displayfood = DisplayFood.fromPresentation(value);
        foodpackageentry.displayArray.push();
        packageitem.foodDisplayArray.push(displayfood);
      }

      //console.log('items : ');
      //console.table(foodpackageentry.displayArray);
      /*
      for (const [key, value] of foodpackageentry.packagePresentationMap.entries()) {
        console.log('['+key+'] '+value.foodPresentation.text()+'=>'+value.quantity);
      }
      */
    }

    return {package : packageitem, shopping : shopping};
  }
}

let Item = class {
  constructor()
  {
    this.name = '';
    this.modularMap = new Map();
  }

  // read all food
  defaultPresentation(caretype, delivery, foodpresentationarray) {

    if(typeof caretype === 'undefined')
      throw new Error('Invalid caretype');

    if(typeof delivery === 'undefined')
      throw new Error('Invalid delivery');

    /*
    let modulartest = this.modularMap.get('0237404');
    console.log('BBBB');
    console.log(modulartest.careTypeMap.get('DESAYUNO').deliveryMap.get(1));
    */

    let fpmap = new Map();

    for (const [key, value] of this.modularMap.entries()) {
      let modular = value;

      if(!modular.careTypeMap.has(caretype))
        continue;

      let caretypeitem = modular.careTypeMap.get(caretype);

      if(!caretypeitem.deliveryMap.has(delivery))
        continue;

      let deliveryitem = caretypeitem.deliveryMap.get(delivery);

      for (const [key, value] of deliveryitem.foodDeliveryMap.entries()) {
        if(fpmap.has(value.food.name)){
          let food = fpmap.get(value.food.name);
          if((food.presentation-value.food.presentacion ) < 0.001)
            continue;
        }
        let fdp = new FoodPresentation();
        fdp.food = value.food;
        fdp.name = value.food.name;
        // presentation
        fdp.presentation = value.presentation;
        // this value could change
        fdp.presentationName = value.food.name;

        //foodpresentationarray.push(fdp);
        fpmap.set(value.food.name, fdp);
      }      
    }

    for (const [key, value] of fpmap.entries()) {
      foodpresentationarray.push(value);
    }
  }

  async performBuildPackage(caretype, delivery, foodpresentationarray) {
    if(typeof caretype === 'undefined')
      throw new Error('Invalid caretype');

    if(typeof delivery === 'undefined')
      throw new Error('Invalid delivery');

    let packagemap = new Map();
    let modularmap = new Map();

    let totalpackages = 0;
    let modulequantity;

    for (const [key, value] of this.modularMap.entries()) {
      let modular = value;

      let modularresult = await modular.performDelivery(caretype, delivery, foodpresentationarray);
      
      let hash = modularresult.package.hash();
      
      let packagedetail = null;
      if(!packagemap.has(hash)) {
        packagemap.set(hash, new PackageDetail(0, modularresult.package));
        packagedetail = packagemap.get(hash);
      }
      else
        packagedetail = packagemap.get(hash);

      modulequantity = parseInt(modular.users);
      packagedetail.quantity += modulequantity;
      totalpackages += modulequantity;

      modularmap.set(key, hash);
      //console.log(modularresult.package.hash());
    }

    //console.log(totalpackages);

    return {modular : modularmap, package : packagemap};
  }

  perforDelivery() {

  }
}

let PackageDetail = class {
  constructor(q, p)
  {
    this.quantity = q;
    this.detail = p;
  }
}

let Food = class {
  constructor(n, u)
  {
    this.name = n;
    this.unit = u;
  }
}

let FoodDelivery = class {
  constructor()
  {
    this.food = null;
    this.presentation = null;
    this.quantity = null;
  }
}

let Delivery = class {
  constructor()
  {
    // FoodDelivery map
    this.foodDeliveryMap = new Map();
  }
}

let CareType = class {
  constructor()
  {
    // Delivery map
    this.deliveryMap = new Map();
  } 
}

let PackagePresentation = class {
  constructor()
  {
    this.foodPresentation = null;
    this.quantity = 0;
  }
}

let FoodPackage = class {
  constructor()
  {
    this.food = null;
    this.quantity = 0;
    this.volume = 0;
    this.packagePresentationMap = new Map();
    this.displayArray = new Array();
  }
}

module.exports = {Modular, Coordinate, Position, Item, 
  Food, FoodDelivery, Delivery, CareType, 
  FoodPresentation, Package, FoodPackage, PackagePresentation}
