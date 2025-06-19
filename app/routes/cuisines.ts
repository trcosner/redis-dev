import express from "express"
import type { Request, Response, NextFunction } from "express"
import { initializeRedisClient } from "../utils/client.js"
import { cuisineKey, restaurantKeyById } from "../utils/keys.js"
import { successResponse } from "../utils/responses.js"

const router = express.Router()

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client = await initializeRedisClient()
        const cuisineKeys = await client.keys("app:cuisine:*")
        const cuisines = cuisineKeys.map(key => key.replace("app:cuisine:", ""))
        console.log({cuisines})
        successResponse(res, cuisines, "Added new cuisines")
    } catch(err) {
        next(err)
    }
})

router.get("/:cuisine", async (req: Request, res: Response, next: NextFunction) => {
    const {cuisine} = req.params as { cuisine: string }
    try {
        const client = await initializeRedisClient()
        const restaurantIds = await client.sMembers(cuisineKey(cuisine))
        const restaurants = await Promise.all(restaurantIds.map(async id => client.hGetAll(restaurantKeyById(id))))
        successResponse(res, restaurants, "Added new cuisines")
    } catch(err) {
        next(err)
    }
})

export default router