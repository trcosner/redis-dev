import express from "express"
import type { Request, Response, NextFunction } from "express"
import { validate } from "../middlewares/validate.js"
import { RestaurantSchema, type Restaurant } from "../schemas/resaurant.js"
import { initializeRedisClient } from "../utils/client.js"
import { nanoid } from "nanoid"
import { restaurantKeyById } from "../utils/keys.js"
import { successResponse } from "../utils/responses.js"
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js"

const router = express.Router()

router.post("/", validate(RestaurantSchema), async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body as Restaurant

    try {
        const client = await initializeRedisClient()
        const id = nanoid()
        const restaurantKey = restaurantKeyById(id)
        const hashData = {
            id,
            name: data.name,
            location: data.location
        }
        const addResult = await client.hSet(restaurantKey, hashData)
        console.log(`Added ${addResult} fields`)
        successResponse(res, hashData, "Added new restaurant")
    } catch(err) {
        next(err)
    }
})

router.get("/:id", checkRestaurantExists, async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id
    if(!id){
        throw new Error("No id provided")
    }
    try {
        const client = await initializeRedisClient()
        const restaurantKey = restaurantKeyById(id)
        const [viewCount, restaurant] = await Promise.all([client.hIncrBy(restaurantKey, "viewCount", 1), client.hGetAll(restaurantKey)])
        successResponse(res, restaurant)
    } catch(err) {
        next(err)
    }
})

export default router