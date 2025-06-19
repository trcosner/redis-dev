import express from "express"
import type { Request, Response, NextFunction } from "express"
import { validate } from "../middlewares/validate.js"
import { RestaurantSchema, type Restaurant } from "../schemas/resaurant.js"
import { initializeRedisClient } from "../utils/client.js"
import { nanoid } from "nanoid"
import { cuisineKey, restaurantCuisinesKeyById, restaurantKeyById, reviewDetailsKeyById, reviewKeyById } from "../utils/keys.js"
import { successResponse, errorResponse } from "../utils/responses.js"
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js"
import { ReviewSchema, type Review } from "../schemas/reviews.js"

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
        const addResult = await Promise.all([ 
            ...data.cuisines.map((cuisine) => Promise.all([
                client.sAdd(cuisineKey(cuisine), id),
                client.sAdd(restaurantCuisinesKeyById(id), cuisine)
            ])),
            client.hSet(restaurantKey, hashData)
        ])
        console.log(`Added ${addResult} fields`)
        successResponse(res, hashData, "Added new restaurant")
    } catch(err) {
        next(err)
    }
})

router.post("/:restaurantId/reviews", checkRestaurantExists, validate(ReviewSchema), async (req: Request, res: Response, next: NextFunction) => {
    const {restaurantId} = req.params as { restaurantId: string }
 
    const data = req.body as Review
    try {
        const client = await initializeRedisClient()
        const reviewId = nanoid()
        const reviewKey = reviewKeyById(restaurantId)
        const reviewDetailsKey = reviewDetailsKeyById(reviewId)
        const reviewData = {
            id: reviewId,
            ...data,
            timestamp: Date.now(),
            restaurantId,
        }
        await Promise.all([
            client.lPush(reviewKey, reviewId),
            client.hSet(reviewDetailsKey, reviewData)
        ])
        successResponse(res, reviewData, "Added new review")
    }catch(err){
        next(err)
    }
})

router.get("/:restaurantId/reviews", checkRestaurantExists, async (req: Request, res: Response, next: NextFunction) => {
    const {restaurantId} = req.params as { restaurantId: string }
    const {page = 1, limit = 10} = req.query
    const start = (Number(page) - 1) * Number(limit)
    const end = start + Number(limit) - 1

    try {
        const client = await initializeRedisClient()
        const reviewKey = reviewKeyById(restaurantId)
        const reviewIds = await client.lRange(reviewKey, start, end)
        const reviews = await Promise.all(reviewIds.map(async id => client.hGetAll(reviewDetailsKeyById(id))))
        successResponse(res, reviews)
    } catch(err) {
        next(err)
    }
})

router.delete("/:restaurantId/reviews/:reviewId", checkRestaurantExists, async (req: Request, res: Response, next: NextFunction) => {
    const {restaurantId, reviewId} = req.params as { restaurantId: string, reviewId: string }
    try {
        const client = await initializeRedisClient()
        const reviewKey = reviewKeyById(restaurantId)
        const reviewDetailsKey = reviewDetailsKeyById(reviewId)
        const [removeResult, deleteResult] = await Promise.all([
            client.lRem(reviewKey, 1, reviewId),
            client.del(reviewDetailsKey)
        ])
        if(removeResult === 0 && deleteResult === 0){
             errorResponse(res, 404, "Review not found")
             return
        }
        successResponse(res, removeResult, "Review deleted")
    } catch(err) {
        next(err)
    }
})

router.get("/:restaurantId", checkRestaurantExists, async (req: Request, res: Response, next: NextFunction) => {
    const {restaurantId} = req.params as { restaurantId: string }
    try {
        const client = await initializeRedisClient()
        const restaurantKey = restaurantKeyById(restaurantId)
        const [viewCount, restaurant] = await Promise.all([client.hIncrBy(restaurantKey, "viewCount", 1), client.hGetAll(restaurantKey)])
        successResponse(res, restaurant)
    } catch(err) {
        next(err)
    }
})



export default router