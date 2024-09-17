const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function login(req, res) {
  if (req.session.loggedin != true) {
    res.render("login/index");
  } else {
    res.redirect("/");
  }
}

function register(req, res) {
  if (req.session.loggedin != true) {
    res.render("login/register");
  } else {
    res.redirect("/");
  }
}

function auth(req, res) {
  const data = req.body;
  req.getConnection((err, conn) => {
    if (err) {
      return res.render("login/index", {
        error: "Error en la conexión con la base de datos",
      });
    }

    conn.query(
      "SELECT email, name, password FROM users WHERE email = ?",
      [data.email],
      (err, userdata) => {
        if (err) {
          return res.render("login/index", {
            error: "Error en la consulta a la base de datos",
          });
        }

        if (userdata.length === 0) {
          return res.render("login/index", {
            error: "Error: el usuario no existe",
          });
        }

        const user = userdata[0]; // Accede al primer usuario

        bcrypt.compare(data.password, user.password, (err, isMatch) => {
          if (!isMatch) {
            return res.render("login/index", {
              error: "Error: contraseña incorrecta",
            });
          } else {
            const token = jwt.sign(
              { name: user.name, email: user.email },
              "your_secret_key",
              { expiresIn: "1d" }
            );
            res.cookie("authToken", token);
            req.session.loggedin = true;
            req.session.name = user.name;
            res.redirect("/");
          }
        });
      }
    );
  });
}

function storeUser(req, res) {
  const data = req.body;

  req.getConnection((err, conn) => {
    conn.query(
      "SELECT * FROM users WHERE email =?",
      [data.email],
      (err, userdata) => {
        if (userdata.length > 0) {
          res.render("login/register", {
            error: "Error: el usuario ya existe",
          });
        } else {
          bcrypt.hash(data.password, 12).then((hash) => {
            data.password = hash;
            req.getConnection((err, conn) => {
              conn.query("INSERT INTO users SET ?", [data], (err, rows) => {
                const token = jwt.sign(
                  { name: data.name, email: data.email },
                  "your_secret_key",
                  { expiresIn: "1d" }
                );
                res.cookie("authToken", token);
                req.session.loggedin = true;
                req.session.name = data.name;
                res.redirect("/");
              });
            });
          });
        }
      }
    );
  });
}

function verifyToken(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.redirect("/login");
  }
  jwt.verify(token, "your_secret_key", (err, decoded) => {
    if (err) {
      return res.redirect("/");
    }
    req.user = decoded;
    next();
  });
}

function logout(req, res) {
  if (req.session.loggedin == true) {
    req.session.destroy();
    res.clearCookie("authToken");
    res.redirect("/login");
  }
}
module.exports = {
  login,
  register,
  storeUser,
  auth,
  logout,
  verifyToken,
};
