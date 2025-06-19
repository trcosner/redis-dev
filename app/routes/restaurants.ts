import express from "express"
import type { Request, Response, NextFunction } from "express"
import { validate } from "../middlewares/validate.js"
import { RestaurantDetailsSchema, RestaurantSchema, type Restaurant, type RestaurantDetails } from "../schemas/resaurant.js"
import { initializeRedisClient } from "../utils/client.js"
import { nanoid } from "nanoid"
import { cuisineKey, restaurantCuisinesKeyById, restaurantDetailsKeyById, restaurantKeyById, restaurantsByRatingKey, reviewDetailsKeyById, reviewKeyById, weatherKeyById } from "../utils/keys.js"
import { successResponse, errorResponse } from "../utils/responses.js"
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js"
import { ReviewSchema, type Review } from "../schemas/reviews.js"

const router = express.Router()

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    const {page = 1, limit = 10}= req.query as {page: string, limit: string}

    const start = (Number(page) - 1) * Number(limit)
    const end = start + Number(limit)

    try{
        const client = await initializeRedisClient()
        const restaurantIds = await client.zRange(restaurantsByRatingKey, start, end, {REV: true})
        const restaurants = await Promise.all(restaurantIds.map(async id => client.hGetAll(restaurantKeyById(id))))
        successResponse(res, restaurants, "gottem!")
    }catch(err){
        next(err)
    }
})

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
                client.sAdd(restaurantCuisinesKeyById(id), cuisine),
                client.zAdd(restaurantsByRatingKey, {score: 0, value: id})
            ])),
            client.hSet(restaurantKey, hashData)
        ])
        console.log(`Added ${addResult} fields`)
        successResponse(res, hashData, "Added new restaurant")
    } catch(err) {
        next(err)
    }
})

router.post("/:restaurantId/details", checkRestaurantExists, validate(RestaurantDetailsSchema), async (req: Request, res: Response, next: NextFunction) => {
    const {restaurantId} = req.params as { restaurantId: string }
    const data = req.body as RestaurantDetails

    try {
        const client = await initializeRedisClient()
        const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId)
       await client.json.set(restaurantDetailsKey, ".", data)
        successResponse(res, data, "Added new restaurant details")
        return
    } catch(err) {
        next(err)
    }
})

router.get("/:restaurantId/details", checkRestaurantExists, async (req: Request, res: Response, next: NextFunction) => {
    const {restaurantId} = req.params as { restaurantId: string }
    const data = req.body as RestaurantDetails

    try {
        const client = await initializeRedisClient()
        const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId)
       const details = await client.json.get(restaurantDetailsKey)
        successResponse(res, details, "got restaurant details")
        return
    } catch(err) {
        next(err)
    }
})

router.get("/:restaurantId/weather", checkRestaurantExists, async (req: Request, res: Response, next: NextFunction) => {
    const {restaurantId} = req.params as { restaurantId: string }
    try {
        const client = await initializeRedisClient()
        const weatherKey = weatherKeyById(restaurantId)
        const cachedWeather = await client.get(weatherKey)
        if(cachedWeather) {
            console.log("from cache", cachedWeather)
            successResponse(res, JSON.parse(cachedWeather))
            return
        }

        const restaurantKey = restaurantKeyById(restaurantId)
        const coords = await client.hGet(restaurantKey, "location")

        if(!coords) {
             errorResponse(res,404, "Restaurant has no location")
             return
        }
        const [lat,lon] = coords.split(",")
        const apiResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=imperial&lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`)
        if(apiResponse.status === 200) {
            const json = await apiResponse.json()
             await client.set(weatherKey, JSON.stringify(json), {EX: 60 * 60})
            successResponse(res, json)
        }
        else{
            console.log(apiResponse)
        }
       errorResponse(res, 500, "Couldn't get weather information")
       return
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
        const restaurantKey = restaurantKeyById(restaurantId)
        const reviewData = {
            id: reviewId,
            ...data,
            timestamp: Date.now(),
            restaurantId,
        }
        const [reviewCount, setResult, totalStars] = await Promise.all([
            client.lPush(reviewKey, reviewId),
            client.hSet(reviewDetailsKey, reviewData),
            client.hIncrByFloat(restaurantKey, "totalStars", data.rating)
        ])

        const averageRating = Number((Number(totalStars)/reviewCount).toFixed(1))
        await Promise.all([
            client.zAdd(restaurantsByRatingKey, {score: averageRating, value: restaurantId}),
            client.hSet(restaurantKey, "averageRating", averageRating)
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