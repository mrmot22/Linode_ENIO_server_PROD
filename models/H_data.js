const mongoose = require('mongoose');

const H_Data_Schema = new mongoose.Schema({
  oh_perioda: String,                       // Format: 2025-01-01-01
  DT_SK_cena: Number,
  DT_DE_cena: Number,
  DT_CZ_cena: Number,
  DT_PL_cena: Number,
  DT_HU_cena: Number,
  utc_cas: Date
});

const H_Data = mongoose.model('H_Data', H_Data_Schema, 'hodinove_data');

module.exports = H_Data; // Export the model


