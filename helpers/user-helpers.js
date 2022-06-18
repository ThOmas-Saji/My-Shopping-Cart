const db = require('../config/connect')
const { USERS_COLLECTION } = require('../config/collections')
const bcrypt = require('bcrypt')

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = await bcrypt.hash(userData.password, 8);
      db.get().collection(USERS_COLLECTION).insertOne(userData).then((data) => {
        resolve(data);
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
          if(status){
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            resolve({status: false})
          }
        })
      }
    })
  }
}