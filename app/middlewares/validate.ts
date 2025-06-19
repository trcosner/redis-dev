import type {Request, Response, NextFunction} from "express"
import {ZodSchema} from "zod"

export const validate = <T>(schema: ZodSchema<T>) => (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body)
    if(!result.success){
        return response.status(400).json({
            success: false,
            errors: result.error.errors
        }) as any
    }
    next()
}