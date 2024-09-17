const express = require("express");
const { engine } = require("express-handlebars");
const myconnection = require("express-myconnection");
const session = require("express-session");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const loginRoutes = require("./routes/login");
const { verifyToken } = require("./controllers/loginController");

//coneccion a bd azure
const sql = require("mssql");

// Configuración de la conexión
const config = {
  user: "administrador", // Tu nombre de usuario de la base de datos
  password: "admin123^", // Tu contraseña
  server: "srautenticator.database.windows.net", // El nombre de tu servidor en Azure
  database: "AutenticatorAPP", // El nombre de tu base de datos
  options: {
    encrypt: true, // Usar cifrado para la conexión en Azure
    enableArithAbort: true,
  },
};

// Conectar a la base de datos
sql
  .connect(config)
  .then((pool) => {
    return pool.request().query("SELECT 1 AS value");
  })
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.error("Error al conectar a la base de datos: ", err);
  });


const app = express();
app.set("port", 4000);

app.listen(app.get("port"), () => {
  console.log("Escuchando por el puerto", app.get("port"));
});

app.use(cookieParser());

app.set("views", __dirname + "/views");
app.engine(
  ".hbs",
  engine({
    extname: "hbs",
  })
);

app.set("view engine", "hbs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());

/* app.use(
  myconnection(mysql, {
    host: "localhost",
    user: "root",
    password: "",
    port: "3306",
    database: "login",
  })
);
 */
app.use(
  session({
    secret: "secret",
    resave: "true",
    saveUninitialized: "true",
  })
);

app.use("/", loginRoutes);

app.get("/", (req, res) => {
  if (req.session.loggedin == true) {
    res.render("home", { name: req.session.name });
  } else {
    res.redirect("./login");
  }
});


app.get("/", verifyToken, (req, res) => {
  if (req.session.loggedin == true) {
    res.render("home", { name: req.session.name });
  }
});
