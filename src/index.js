require("dotenv").config();
const connectDB = require("./db/index");
const app = require("./app");

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Connection failed to MongoDB : ", err);
  });
