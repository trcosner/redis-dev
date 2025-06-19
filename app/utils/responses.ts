import {response, type Response} from "express"

export function successResponse(res: Response, data: any, message = "Success"){
    return response.status(200).json({
        success: true,
        message,
        data
    })
}

export function errorResponse(res: Response, status: number, error: string) {
    return response.status(status).json({
        success: false,
        error
    })
}