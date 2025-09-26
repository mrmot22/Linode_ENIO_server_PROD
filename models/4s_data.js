const mongoose = require('mongoose');


const DISP_calc_Schema = new mongoose.Schema({

    FCR_disp_max: Number,
    FCR_disp_min: Number,
    FCR_disp_sum_offers: Number,
    FCR_disp_wavg: Number,
    aFRRp_disp_max: Number,
    aFRRp_disp_min: Number,
    aFRRp_disp_sum_offers: Number,
    aFRRp_disp_wavg: Number,
    aFRRn_disp_max: Number,
    aFRRn_disp_min: Number,
    aFRRn_disp_sum_offers: Number,
    aFRRn_disp_wavg: Number,
    mFRRp_disp_max: Number,
    mFRRp_disp_min: Number,
    mFRRp_disp_sum_offers: Number,
    mFRRp_disp_wavg: Number,
    mFRRn_disp_max: Number,
    mFRRn_disp_min: Number,
    mFRRn_disp_sum_offers: Number,
    mFRRn_disp_wavg: Number


});

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
    DISP_calc:{
        type: DISP_calc_Schema,
        default: {}
    }

});

const S4_picasso = mongoose.model('4s_picasso', S4_picasso_Schema, '4s_data');

module.exports = S4_picasso; // Export the model
