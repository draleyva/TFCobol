'use strict';
// check TURF geo
const colors = require('colors/safe');
const { FoodPresentation, FoodDelivery, Food} = require('./base.js');
const fs = require('fs');
const process = require("./DeliveryProcess.js");
const filename = 'C:/TEMP/ABANCAY1_APURIMAC3_APURIMAC_P1.xlsx'
const streamfilename = 'C:/TEMP/ABANCAY1_APURIMAC3_APURIMAC_P1.json'

//const stream = fs.createWriteStream(streamfilename, {flags: 'w'});

//stream.write('year, territorial unit, committee, item, product, presentation, unit, volumen\n');

function customPresentation(foodpresentationarray) {
   // presentation
   var arrozp1 = new FoodPresentation();
   arrozp1.name = 'ARROZ';
   arrozp1.presentation = 0.5;
   arrozp1.presentationName = 'ARROZ (0.5)';
   foodpresentationarray.push(arrozp1);
   
   var lechep2 = new FoodPresentation();
   lechep2.name = 'LECHE EVAPORADA ENTERA';
   lechep2.presentation = 0.5;
   lechep2.presentationName = 'La Vaca Lola';
   foodpresentationarray.push(lechep2);
}

function main() {
  process.perform(filename, 'Detalle', false, function (item) {
    itemTest(item);
  });
}

function itemTest(item){
  let foodpresentationarray = new Array();
  
  let caretype = 'DESAYUNO';
  let delivery = 1;

  item.defaultPresentation(caretype, delivery, foodpresentationarray);

  customPresentation(foodpresentationarray);

  item.performBuildPackage(caretype, delivery, foodpresentationarray).then((result) => {
    //console.log(result);

    console.log(colors.blue('Item box [S:'+result.package.size+']'));

    for (const [key, value] of result.package.entries()) {
      console.log(value.detail.hash());
      console.log('quantity : '+value.quantity);
      console.table(value.detail.foodDisplayArray);
    }
  });
}

function moduleTest(item){
  let foodpresentationarray = new Array();

  let caretype = 'DESAYUNO';
  let delivery = 1;
  let modularcode = '0237404';

  if(item.modularMap.has(modularcode)) {

    customPresentation(foodpresentationarray);

    item.modularMap.get(modularcode).defaultPresentation(caretype, delivery, foodpresentationarray)
      
    item.modularMap.get(modularcode).performDelivery(caretype, delivery, foodpresentationarray);
  }
}

main();
