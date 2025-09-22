const mongoose = require('mongoose');

const DT_data_Schema = new mongoose.Schema({

  DT_SK_cena: Number,
  DT_DE_cena: Number,
  DT_CZ_cena: Number,
  DT_PL_cena: Number,
  DT_HU_cena: Number,

});

const vdt_data_Schema = new mongoose.Schema({
  OKTE_VDT_price_wavg: Number,
  OKTE_VDT_predaj_obj: Number,
  OKTE_VDT_nakup_obj: Number,
  OKTE_VDT_price_min: Number,
  OKTE_VDT_price_max: Number
});

const H_Data_Schema = new mongoose.Schema({
  oh_perioda: String,                     // Format: 2025-01-01-01
  utc_cas: Date,
  vdt_data: {
    type: vdt_data_Schema,
    default: {}
  },
  DT_data:{
      type: DT_data_Schema,
    default: {}
  }
});

const H_Data = mongoose.model('H_Data', H_Data_Schema, 'hodinove_data');
module.exports = H_Data; // Export the model


