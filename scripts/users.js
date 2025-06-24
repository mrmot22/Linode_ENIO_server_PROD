const Datastore = require('nedb');
const bcrypt = require('bcrypt');
const db = new Datastore({ filename: './users.db', autoload: true });

async function vlozUsera(req,res){

 let user = [
  {
    "meno":"Paľko",
    "priezvisko":"Urbanek",
    "email":"palkourbanek45@gmail.com",
    "heslo":"suljpa.222"
  }]; 

db.insert(user);

}

async function zasifruj(req,res){

    let heslo = "v9s|zG21h";

    try {


        const hashedPassword = await bcrypt.hash(heslo, 10)

        db.update(
            { email: "palkourbanek45@gmail.com" }, 
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


/*

heslo tomasove je:  tomas.ivicic@enio.sk | Heslo.Je123
heslo moje je: igor.sulc@enio.sk | Nemam.222


*/
