const Datastore = require('nedb');
const bcrypt = require('bcrypt');
const db = new Datastore({ filename: './users.db', autoload: true });

async function vlozUsera(req,res){

 let user = [
  {
    "meno":"Evgeny",
    "priezvisko":"Korotenko",
    "email":"evgeny.korotenko@encare.sk",
    "heslo":"Evgeny.654"
  }]; 

db.insert(user);

}

async function zasifruj(req,res){

    let heslo = "Evgeny.654";

    try {


        const hashedPassword = await bcrypt.hash(heslo, 10)

        db.update(
            { email: "evgeny.korotenko@encare.sk" }, 
            { $set: { heslo: hashedPassword}},
            {},// this argument was missing
            function (err, numReplaced) {
              console.log("replaced---->" + numReplaced);
            }
            );

      } catch {
       console.log(e)
      }

}

//vlozUsera();
zasifruj();

