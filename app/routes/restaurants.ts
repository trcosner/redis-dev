import express from "express"
import { validate } from "../middlewares/validate.js"
import { RestaurantSchema, type Restaurant } from "../schemas/resaurant.js"
import { initializeRedisClient } from "../utils/client.js"

const router = express.Router()

router.post("/", validate(RestaurantSchema), async (req, res) => {
    const data = req.body as Restaurant
    const client = await initializeRedisClient()
    res.send("Restaurant created!")
})

export default router