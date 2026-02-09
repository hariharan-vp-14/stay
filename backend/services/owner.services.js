const ownerModel = require('../models/owner.model');

module.exports.createOwner = async ({ name, email, password, contactNumber }) => {
  if (!name || !email || !password) {
    throw new Error('All fields are required');
  }

  const owner = await ownerModel.create({
    name,
    email,
    password,
    contactNumber,
  });

  return owner;
};
