import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AuthError from "../errors/authError";
import ConflictError from "../errors/conflictError";
import NotFound from "../errors/notFound";
import IncorrectData from "../errors/requestError";
import ServerError from "../errors/serverError";
import User from "../models/User";
import { OK_CODE, CODE_CREATED } from "../states/states";

import { forFunction, } from "./types";
import SupportRequests from "../models/SupportRequests";

// const getUsers: forFunction = async (req, res, next) => {
//   try {
//     const users = await User.find({});
//     if (!users) {
//       next(NotFound('There is no users'));
//       return;
//     }
//     res.status(OK_CODE).send(users);
//   } catch (e) {
//     next(ServerError('Some bugs on server'));
//   }
// };

// const login: forFunction = async (req, res, next) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email }).select('+password');
//     if (!user) {
//       next(AuthError('Invalid login or password'));
//       return;
//     }
//     const validUser = await bcrypt.compare(password, user.password);
//     if (!validUser) {
//       next(AuthError('Invalid login or password'));
//       return;
//     }
//     const token = jwt.sign({
//       _id: user._id,
//     }, process.env.NODE_ENV === 'production' ? process.env.JWT_SECRET : 'dev-secret');
//     res.status(OK_CODE).send({ data: user, token });
//   } catch (e) {
//     next(ServerError('Some bugs on server'));
//   }
// };

// const aboutMe: forFunction = async (req, res, next) => {
//   const myId = req.user._id;
//   try {
//     const me = await User.findById(myId);
//     if (!me) {
//       next(NotFound('No such user'));
//       return;
//     }
//     res.status(OK_CODE).send(me);
//   } catch (e) {
//     next(ServerError('Some bugs on server'));
//   }
// };  

interface UsersBody {
    email: string;
    password: string;
    name: string;
    lastName?: string;
    phoneNumber?: string;
    tgLink?: string;
    interestProjects?: object[]
    sendRequests?: string[];
    businessData?: string;
  }

const createUser: forFunction = async (req, res, next) => {
  const {
    email,
    password,
    name,
    lastName,
    phoneNumber,
    tgLink,
    interestProjects,
    businessData,
  } = req.body;
  
  const requestBody = req.body as unknown as UsersBody;
  if (
    typeof requestBody !== "object" ||
    typeof requestBody.email !== "string" ||
    typeof requestBody.password !== "string" ||
    typeof requestBody.name !== "string" ||
    (requestBody.lastName !== undefined && typeof requestBody.lastName !== "string") ||
    (requestBody.phoneNumber !== undefined && typeof requestBody.phoneNumber !== "string") ||
    (requestBody.tgLink !== undefined && typeof requestBody.tgLink !== "string") ||
    (requestBody.interestProjects !== undefined && !Array.isArray(requestBody.interestProjects)) ||
    (requestBody.businessData !== undefined && typeof requestBody.businessData !== "string")
  ) {
    next(
      IncorrectData(
        "The request body must be an object with email, password, name, optional lastName, phoneNumber, tgLink, optional interestProjects array, optional businessData"
      )
    );
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sendRequests = await SupportRequests.find(
      { clientEmail: email },
      { projection: { _id: 1 } },
    ).then((el) => el.map((el) => el._id.toString()));
    const user = await new User({
      email,
      password: hashedPassword,
      name,
      lastName,
      phoneNumber,
      tgLink,
      interestProjects,
      sendRequests,
      businessData,
    }).save();
    res.status(CODE_CREATED).send({ data: user });
  } catch (e: Error | any) {
    if (e.code === 11000) {
      next(ConflictError('Email or phone or tg already exists'));
      return;
    }
    // if (e.name === 'ValidatorError') {
    //   next(IncorrectData('Validation error'));
    //   return;
    // }
    console.log("cathed error", e);

    next(ServerError("Some bugs on server"));
  }
};


// const updateUser = (req, res, next) => {
//   const { email, name } = req.body;
//   User.findByIdAndUpdate(
//     req.user._id,
//     { email, name },
//     { new: true, runValidators: true },
//   )
//     .then((user) => {
//       if (!user) {
//         next(NotFound('No such user'));
//         return;
//       }
//       res.send(user);
//     })
//     .catch((e) => {
//       if (e.code === 11000) {
//         next(ConflictError('User with this email already exists'));
//         return;
//       }
//       if (e.name === 'ValidationError') {
//         next(IncorrectData('Invalid data'));
//         return;
//       }
//       next(ServerError('Some bugs on server'));
//     });
// };

export {
  // getUsers,
  // login,
  // aboutMe,
  createUser,
  // updateUser,
};
