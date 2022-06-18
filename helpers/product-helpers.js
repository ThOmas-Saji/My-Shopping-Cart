const db = require('../config/connect')
const {PRODUCTS_COLLECTION} = require('../config/collections')
module.exports = {
  addProducts: (product, callback) => {
    db.get().collection(PRODUCTS_COLLECTION).insertOne(product).then((data) => {
     let res = data.insertedId.toString()
     res = res.split('(')
      callback(res[0]);
    })

  },
  getAllProducts : () => {
    return new Promise( async (resolve, reject)=>{
      let products = await db.get().collection(PRODUCTS_COLLECTION).find().toArray();
      resolve(products);
    })
  }
}
