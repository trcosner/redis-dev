import express from "express"
import restaurants from "./routes/restaurants.js"
import cuisines from "./routes/cuisines.js"
import { errorHandler } from "./middlewares/errorhandler.js"

const PORT = process.env.port || 3000

const app = express()
app.use(express.json())

app.use("/restaurants", restaurants)
app.use("/cuisines", cuisines)
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}).on("error", (error) => { throw new Error(error.message)})