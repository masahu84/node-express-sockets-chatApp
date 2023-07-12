import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import { jwt } from "../utils/index.js";

function register(req, res) {
  const { email, password } = req.body;

  const user = new User({
    email: email.toLowerCase(),
  });

  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);
  user.password = hashPassword;

  user
    .save()
    .then((userStorage) => {
      res.status(201).send(userStorage);
    })
    .catch((err) => {
      res.status(400).send({ msg: "Error al registrar el usuario" });
    });
}

function login(req, res) {
  const { email, password } = req.body;

  const emailLowerCase = email;

  User.findOne({ email: emailLowerCase })
    .then((userStorage) => {
      bcrypt.compare(password, userStorage.password, (bcryptError, check) => {
        if (bcryptError) {
          res.status(500).send({ msg: "Error en el servidor" });
        } else if (!check) {
          res.status(400).send({ msg: "Contraseña incorrecta" });
        } else {
          res.status(200).send({
            access: jwt.createAccessToken(userStorage),
            refresh: jwt.createRefreshToken(userStorage),
          });
        }
      });
    })
    .catch((error) => {
      res.status(500).send({ msg: "Error del servidor" });
    });
}

function refreshAccessToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) res.status(400).send({ msg: "Token requerido" });

  const hasExpired = jwt.hasExpiredToken(refreshToken);

  if (hasExpired) {
    res.status(400).send({ msg: "Token Expirado" });
  }

  const { user_id } = jwt.decoded(refreshToken);

  User.findById(user_id, (error, userStorage) => {
    if (error) {
      res.status(500).send({ msg: "Error del servidor" });
    } else {
      res.status(200).send({
        accessToken: jwt.createAccessToken(userStorage),
      });
    }
  });
}

export const AuthController = {
  register,
  login,
  refreshAccessToken,
};
