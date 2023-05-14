const findUserByEmail = (email, database) => {
  for (let userId in database) {
    const user = database[userId];
    if (user.email === email)
      return user;
  }
  return null;
};

module.exports = { findUserByEmail };