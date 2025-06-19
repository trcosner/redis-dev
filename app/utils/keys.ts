export function getKeyName(...args: string[]){
    return `app:${args.join(":")}`
}