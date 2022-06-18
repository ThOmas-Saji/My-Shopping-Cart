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
  },
  getProductDetails: (productId) => {
    return new Promise((reslove, reject) => {
      db.get().collection(PRODUCTS_COLLECTION).findOne({
        _id: objectId(productId)
      }).then((product) => {
        reslove(product);
      })
    })
  },
  updateProduct: (productId, productDetails) => {
    return new Promise((resolve, reject) => {
      db.get().collection(PRODUCTS_COLLECTION).findOneAndUpdate({ _id: objectId(productId) }, 
      {$set:{
        name: productDetails.name,
        description: productDetails.description,
        price: productDetails.price

      }}).then(() => {
        resolve();
      })
    })
  }
}
