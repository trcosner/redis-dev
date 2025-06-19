export function getKeyName(...args: string[]){
    return `app:${args.join(":")}`
}

export const restaurantKeyById = (id: string) => getKeyName("restaurants", id)