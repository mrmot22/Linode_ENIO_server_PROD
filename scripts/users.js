const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '../.env' });

const UserSchema = new mongoose.Schema({
  meno: { type: String, required: true },
  priezvisko: { type: String, required: true },
  email: { type: String, required: true },
  heslo: { type: String, required: true },
});

const userDbConnection = mongoose.createConnection(process.env.DODB2_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

userDbConnection.on('connected', () => {
  console.log('Connected to MongoDB');
});

userDbConnection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

userDbConnection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

const User = userDbConnection.model('User', UserSchema, 'EnioUsers');

async function ziskaj_data() {

  try {
    
    
    if (userDbConnection.readyState === 1) {
      const findResult = await User.find({});
      console.log(findResult);
    } else {
      console.log('Not connected to MongoDB');
      await userDbConnection;
      console.log('Reconnected to MongoDB');
      const findResult = await User.find({});
      console.log(findResult);
    }
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

async function vlozUsera() {
  try {
    let user = {
        "meno": "Veronika",
        "priezvisko": "Nahacka",
        "email":"nahacka@yahoo.com",
        "heslo":"Nahacka.123#"
    };

    const insertedUser = await User.create(user);
    console.log('User inserted:', insertedUser);
  } catch (err) {
    console.error('Error inserting user:', err);
  }
}

async function zasifrujUsera() {

    let heslo = "Nahacka.123#";

    try {
  
        const hashedPassword = await bcrypt.hash(heslo, 10)

        const updateUser = await User.updateOne(
            { email: "nahacka@yahoo.com" }, 
            { $set: { heslo: hashedPassword}},
        )

    console.log('User updated:', updateUser);
  } catch (err) {
    console.error('Error inserting user:', err);
  }
}

zasifrujUsera().then(() => {
  ziskaj_data();
});