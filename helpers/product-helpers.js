const db = require('../config/connect')
const { PRODUCTS_COLLECTION } = require('../config/collections')
const fs = require('fs')
const objectId = require('mongodb').ObjectId

module.exports = {
  addProducts: (product, callback) => {
    db.get().collection(PRODUCTS_COLLECTION).insertOne(product).then((data) => {
      let res = data.insertedId.toString()
      res = res.split('(')
      callback(res[0]);
    })

  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db.get().collection(PRODUCTS_COLLECTION).find().toArray();
      resolve(products);
    })
  },
  deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(PRODUCTS_COLLECTION).findOneAndDelete({ _id: objectId(productId) }).then((response) => {

        const path = './public/product-images/' + productId + '.jpg'
        try {
          fs.unlinkSync(path)
          console.log("Deleted")
        } catch (err) {
          console.error(err)
        }
        resolve(response);
      })
    })
  }
}
