import { initializeRedisClient } from "../utils/client.js";
import {restaurantsIndexKey, getKeyName} from "../utils/keys.js"

async function createIndex() {
    const client = await initializeRedisClient()

    try {
        await client.ft.dropIndex(restaurantsIndexKey)
    }catch(err){
        console.log("no index to delete")
    }

    await client.ft.create(restaurantsIndexKey, {
        id: {
            type: "TEXT",
            AS: "id"
        },
        name: {
            type:"TEXT",
            AS: "name"
        },
        avgStars: {
            type: "NUMERIC",
            AS: "avgStars",
            SORTABLE: true
        },
    }, {
            ON: "HASH",
            PREFIX: getKeyName("restaurants"),
        }
    )
}

await createIndex()
process.exit()