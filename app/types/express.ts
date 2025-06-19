import type { Request, Response, NextFunction } from "express"

// Custom handler type that allows returning Response objects
export type CustomRequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<Response | void> | Response | void

// Custom router type
export interface CustomRouter {
    post(path: string, ...handlers: CustomRequestHandler[]): void
    get(path: string, ...handlers: CustomRequestHandler[]): void
    put(path: string, ...handlers: CustomRequestHandler[]): void
    delete(path: string, ...handlers: CustomRequestHandler[]): void
}
