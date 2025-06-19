import express from "express"

const router = express.Router()

router.get("/", async (require, res) => {
    res.send("Hello World!")
})

export default router