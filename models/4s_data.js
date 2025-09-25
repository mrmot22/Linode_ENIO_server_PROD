const mongoose = require('mongoose');

const S4_picasso_Schema = new mongoose.Schema({
    qh_perioda: String,
    cas_zaciatok: String,                              // Format: 2025-01-01-01
    qh_num_year: Number,
    qh_num: Number,
    Cena_SEPS_POS_avg: Number,
    Cena_SEPS_POS_max: Number,
    Cena_SEPS_POS_min: Number,
    Cena_SEPS_NEG_avg: Number,
    Cena_SEPS_NEG_max: Number,
    Cena_SEPS_NEG_min: Number,
    ceny_SEPS: Array,
    aFRR_POS: Array,
    aFRR_NEG: Array,
    SEPS_FCR_disp: Array,

});

const S4_picasso = mongoose.model('4s_picasso', S4_picasso_Schema, '4s_data');

module.exports = S4_picasso; // Export the model
