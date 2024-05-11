const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app =express();
const port=process.env.PORT || 1000;
app.use(
    cors({
      origin: [
        "http://localhost:5174",
        "http://localhost:5173",
      ],
    })
  );
  app.use(express.json());
app.get("/",(req,res)=>{
    res.send('assignment-11 server is running')
})
app.listen(port, () => {
    console.log(`server is running at port ${port}`);
  });