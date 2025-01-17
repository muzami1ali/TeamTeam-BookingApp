// LOGIN CONTROLLER
const prisma = require('../../prisma/prisma.ts');
const auth = require('../utils/jwt_auth.ts');
const {randomString} = require('../utils/random.ts');
const {mail} = require('../utils/emails.ts');
const bcrypt = require('../utils/bcrypt.ts');

/**
 * This function is used to login a user
 * @param {Request} req The request object
 * @param {Response} res The response object
 * @return {Response} The response object
 */
async function login(req, res) {
  if (req.body.email === undefined || req.body.password === undefined) {
    return res
        .status(409)
        .send({token: null, message: 'Request body cannot be empty'});
  }

  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (user) {
    if (bcrypt.comparePassword(req.body.password, user.password)) {
      const token = await auth.generateToken(user);
      res.status(200).send({token: token, message: 'Login successful'});
    } else {
      res.status(401).send({token: null, message: 'Invalid password'});
    }
  } else {
    res.status(404).send({token: null, message: 'User not found'});
  }
}

/**
 * This function is used to logout a user
 * @param {Request} req The request object
 * @param {Respon} res The response object
 */
async function logout(req, res) {

  // Try to verify the token using the auth.authenticate function
  try {
    const authResponse = await auth.authenticate(req);
    if (authResponse) {
      // release token
      res.status(200).send({message: 'Logout successful'});
    } else {
      res.status(401).send({message: 'Unauthorized'});
    }
  } catch (err) {
    res.status(401).send({message: 'Unauthorized'});
  }
}

/**
 * This function is used to reset a user's password
 * @param {Request} req The request object
 * @param {Respon} res The response object
 */
async function reset(req, res) {
  if (
    req.body === undefined ||
    req.body.verificationCode === undefined ||
    req.body.userId === undefined ||
    req.body.new_password === undefined
  ) {
    console.log(req.body);
    return res
        .status(409)
        .send({token: null, message: 'Request body cannot be empty'});
  }

  const verification = await prisma.verifications.findFirst({
    where: {
      verificationCode: req.body.verificationCode,
      userId: req.body.userId,
      verificationType: 'forgotPassword',
    },
  });

  // Verify the verification code
  if (verification) {
    // If the users password is the same as the old password, return an error
    let user = await prisma.user.findUnique({
      where: {
        id: req.body.userId,
      },
    });
    if (bcrypt.comparePassword(req.body.new_password, user.password)) {
      return res
          .status(409)
          .send({
            token: null,
            message: 'New password cannot be the same as the old password',
          });
    }

    // If the new password is empty, return an error
    if (req.body.new_password === '') {
      return res
          .status(409)
          .send({token: null, message: 'New password cannot be empty'});
    }

    // If the new password does not meet the password requirements, return an
    // error
    if (req.body.new_password.length < 8) {
      return res
          .status(409)
          .send({
            token: null,
            message: 'New password must be at least 8 characters',
          });
    }

    // Update the user's password
    user = await prisma.user.update({
      where: {
        id: req.body.userId,
      },
      data: {
        password: bcrypt.hashPassword(req.body.new_password),
      },
    });
    // Delete forget password request
    await prisma.verifications.delete({
      where: {
        id: verification.id,
      },
    });

    // Create a new JWT token
    const token = await auth.generateToken(user);
    res.status(200).send({token: token});
  } else {
    res.status(401).send({token: null, message: 'Unauthorized'});
  }
}

/**
 * This function is used to signup a user
 * @param {Request} req The request object
 * @param {Respon} res The response object
 */
async function signup(req, res) {
  // Check that the request body is not empty and contains the correct
  // properties
  if (
    req.body === undefined ||
    req.body.email === undefined ||
    req.body.password === undefined ||
    req.body.name === undefined
  ) {
    return res
        .status(409)
        .send({token: null, message: 'Request body cannot be empty'});
  }

  // Check if the user already exists
  let user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (user) {
    return res
        .status(409)
        .send({token: null, message: 'User already exists'});
  }

  // Check that name, email and password are not empty
  if (
    req.body.name === '' ||
    req.body.email === '' ||
    req.body.password === ''
  ) {
    return res
        .status(409)
        .send({
          token: null,
          message: 'Name, email and password cannot be empty',
        });
  }

  // Create a new user
  user = await prisma.user.create({
    data: {
      email: req.body.email,
      password: bcrypt.hashPassword(req.body.password),
      name: req.body.name,
      type: {
        connect: {
          id: 2,
        },
      },
    },
  });

  // Create verification code
  verifyCode = randomString();
  verification = await prisma.verifications.create({
    data: {
      verificationCode: verifyCode,
      verificationType: 'newUser',
      userId: user.id,
    },
  });

  // Mail the verification code

  url = 'http://localhost:3000/';

  mail(to=user.email, subject='Signup Confirmation', body=`
  <h2>Sign Up Confirmation</h2><br />
  <br />
  <h4> Hi ` + user.name + `</h4><br />
  <p><br />
  Welcome to Ticketopia!<br />
  <br />
  Click the link to verify your account!<br />
  <br />
  ` + url + `login?verify=` +
    verification.verificationCode + `&type=newuser&userId=` + user.id + `<br />
  <br />
  Don't share this email!
  </p>
  `, qrYes=false);

  // Send the JWT token in the response
  res.status(200).send();
}

/**
 *This function is used when a user forgets their password.
 * @param {Request} req The request object
 * @param {Respon} res The response object
 */
async function forgotPassword(req, res) {
  if (
    req.body.email === undefined ||
    req.body.email === undefined ||
    req.body.email === ''
  ) {
    return res
        .status(409)
        .send({token: null, message: 'Request body cannot be empty'});
  }

  // Check if the user already exists
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
  });

  if (user) {
    // Add code to table
    // Email link with code to user

    // Create verification code
    verifyCode = randomString();
    verification = await prisma.verifications.create({
      data: {
        verificationCode: verifyCode,
        verificationType: 'forgotPassword',
        userId: user.id,
      },
    });

    // Mail the verification code

    url = 'http://localhost:3000/';

    mail(to=user.email, subject='Forgot Password', body=`
  <h4> Hi ` + user.name + `</h4><br />
  <p><br />
  Forgot Your Password?<br />
  <br />
  Click the link to change it!<br />
  <br />
  ` + url + `login?forgot=` +
      verification.verificationCode + `&type=forgot&userId=` + user.id + `<br />
  <br />
  Don't share this email!
  Wasn't you? Reset your password on our site!
  </p>
  `, qrYes=false);

    return res.status(200).send();
  }

  res.status(404).send({message: 'User Not Found'});
}

/**
 * This function is used to verify a user
 * @param {Request} req The request object
 * @param {Respon} res The response object
 */
async function verify(req, res) {
  if (
    req.body === undefined ||
    req.body.verificationCode === undefined ||
    req.body.verificationType === undefined ||
    req.body.userId === undefined
  ) {
    return res.status(409).send({message: 'Request body cannot be empty'});
  }

  const verification = await prisma.verifications.findFirst({
    where: {
      verificationCode: req.body.verificationCode,
      userId: req.body.userId,
      verificationType: 'newUser',
    },
  });

  if (!verification) {
    return res
        .status(404)
        .send({token: null, message: 'Verification Code not found'});
  }

  // Delete verification request
  await prisma.verifications.delete({
    where: {
      id: verification.id,
    },
  });

  return res.status(200).send();
}

/**
 *  This function is used to check if a user is logged in
 * @param {Request} req The request object
 * @param {Respon} res The response object
 */
async function checkUserLoggedIn(req, res) {
  if (!req.headers.authorization) {
    return res.status(401).send();
  }

  const token = req.headers.authorization.split(' ')[1];

  if (token == '' || token == null || token == 'null') {
    return res.status(401).send();
  } else {
    try {
      const decoded = await auth.authenticate(req);
      if (Date.now() >= decoded.exp * 1000) {
        return res.status(401).send();
      }
      return res.status(200).send();
    } catch (err) {
      return res.status(401).send();
    }
  }
}


module.exports = {
  login,
  logout,
  reset,
  signup,
  forgotPassword,
  verify,
  checkUserLoggedIn,
};
