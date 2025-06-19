import express from "express"
import { validate } from "../middlewares/validate.js"
import { RestaurantSchema, type Restaurant } from "../schemas/resaurant.js"

const router = express.Router()

router.post("/", validate(RestaurantSchema), async (req, res) => {
    const data = req.body as Restaurant
    res.send("Restaurant created!")
})

export default router