const db = require('../config/connect')
const { USERS_COLLECTION, CART_COLLECTION, PRODUCTS_COLLECTION } = require('../config/collections')
const bcrypt = require('bcrypt')
const objectId = require('mongodb').ObjectId

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 8);
      db.get().collection(USERS_COLLECTION).insertOne(userData).then((data) => {
        let res = data.insertedId.toString()
        res = res.split('(')
        resolve(res[0]);
      })
    })
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db.get().collection(USERS_COLLECTION).findOne({ email: userData.email })
      if (!user) {
        return console.log('Login Failed')
      } else {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({ status: false })
          }
        })
      }
    })
  },
  getOneUser: (userId) => {
    return new Promise((resolve, reject) => {
      db.get().collection(USERS_COLLECTION).findOne({ _id: objectId(userId) }).then((response) => {
        resolve(response);
      })
    })
  },
  addToCart: (productId, userId) => {
    let productObj = {
      item: objectId(productId),
      quantity: 1
    }
    return new Promise(async (resolve, reject) => {
      let userCart = await db.get().collection(CART_COLLECTION).findOne({ user: objectId(userId) })
      if (userCart) {
        let productExist = userCart.products.findIndex(product => product.item == productId)
        if (productExist != -1) {
          db.get().collection(CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(productId) }, {
            $inc: {
              'products.$.quantity': 1
            }
          }).then(() => {
            resolve();
          })
        }
        else {
          db.get().collection(CART_COLLECTION).updateOne({ user: objectId(userId) }, {
            $push: { products: productObj }
          }).then(() => {
            resolve();
          })
        }
      } else {
        let cart = {
          user: objectId(userId),
          products: [productObj]
        }
        db.get().collection(CART_COLLECTION).insertOne(cart).then(() => {
          resolve();
        })
      }
    })
  },
  getAllCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db.get().collection(CART_COLLECTION).aggregate([
        {
          $match: {
            user: objectId(userId)
          }
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: '$products.item',
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: PRODUCTS_COLLECTION,
            localField: 'item',
            foreignField: '_id',
            as: "product"

          },
        }, {
          $project: {
            item: 1,
            quantity: 1,
            product: {
              $arrayElemAt: ['$product', 0]
            }
          }
        }
      ]).toArray()
      resolve(cartItems);
    })
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0
      let user = await db.get().collection(CART_COLLECTION).findOne({ user: objectId(userId) })
      if (user) {
        count = user.products.length;
      }
      resolve(count);
    })
  },
  changeProductQuantity: ({ cartId, productId, count }) => {
    count = Number(count)
    return new Promise((resolve, reject) => {
      db.get().collection(CART_COLLECTION).updateOne({ _id: objectId(cartId), 'products.item': objectId(productId) }, {
        $inc: {
          'products.$.quantity': count
        }
      }).then(() => {
        resolve();
      })
    })
  }
}