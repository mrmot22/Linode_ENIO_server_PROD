const mongoose = require('mongoose');

const vdt_data_Schema = new mongoose.Schema({
   
    OKTE_VDT_price_wavg: Number,
    OKTE_VDT_predaj_obj: Number,
    OKTE_VDT_nakup_obj: Number,
    OKTE_VDT_price_min: Number,
    OKTE_VDT_price_max: Number,


});

const dt_data_Schema = new mongoose.Schema({
   
    DT_SK_cena: Number,
    DT_DE_cena: Number,
    DT_CZ_cena: Number,
    DT_HU_cena: Number,
    DT_PL_cena: Number,
    flow_CZ_SK: Number,
    flow_HU_SK: Number,
    flow_PL_SK: Number,
    flow_SK_CZ: Number,
    flow_SK_HU: Number,
    flow_SK_PL: Number,

});

const QH_OKTE_Schema = new mongoose.Schema({
    qh_perioda: String,       // Format: 2025-01-01-01
    qh_num: Number,
    IDA1_cena:  Number,
    IDA2_cena:  Number,
    IDA3_cena:  Number,
    DT_cena_DE15:  Number,
    IDA1_nakup_SK_MW:  Number,
    IDA1_predaj_SK_MW:  Number,
    IDA2_nakup_SK_MW:  Number,
    IDA2_predaj_SK_MW:  Number,
    IDA3_nakup_SK_MW:  Number,
    IDA3_predaj_SK_MW:  Number, 
    aFRRP_RE_akt: Number,
    aFRRN_RE_akt: Number,  
    aFRRP_PpS_tot: Number,
    aFRRN_PpS_tot: Number,
    TRV3P_PpS_tot: Number,
    TRV3N_PpS_tot: Number,
    TRV3P_RE_akt: Number,
    TRV3N_RE_akt: Number,
    mFRRN_PpS_tot: Number,
    mFRRN_PpS_una: Number,
    mFRRP_PpS_tot: Number,
    mFRRP_PpS_una: Number,
    mFRRN_DA_RE_akt: Number,
    mFRRP_DA_RE_akt: Number,
    mFRRN_SA_RE_akt: Number,
    mFRRP_SA_RE_akt: Number,
    cena_odch: Number,
    sys_odch: Number,
    vdt_data: {
            type: vdt_data_Schema,
            default: {}
    },
        dt_data: {
            type: dt_data_Schema,
            default: {}
    },
    utc_cas: Date
});

const QH_OKTE_odch = mongoose.model('QH_OKTE_odch', QH_OKTE_Schema, 'qh_data');

module.exports = QH_OKTE_odch; // Export the model
