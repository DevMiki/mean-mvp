import * as mongodb from "mongodb";
import { Employee } from "./employee";
import { MongoClient, ServerApiVersion } from "mongodb";

export const collections: {
  employees?: mongodb.Collection<Employee>;
} = {};

export function buildMongoDbUri(host: string, username: string, password: string, options?: string) {
  username = encodeURIComponent(username)
  password = encodeURIComponent(password)
  const db = "dev-test"
  return `mongodb+srv://${username}:${password}@${host}/${db}?${options}`;
}

export async function connectToDatabase(uri:string) {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await client.connect();

  const db = client.db("dev-test");
  await db.command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");

  await applySchemaValidation(db);

  const employees = db.collection<Employee>("employees");
  collections.employees = employees;
}

// Update our existing collection with JSON schema validation so we know our documents will always match the shape of our Employee model, even if added elsewhere.
async function applySchemaValidation(db: mongodb.Db) {
  const jsonSchema = {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "position", "level"],
      additionalProperties: false,
      properties: {
        _id: {},
        name: {
          bsonType: "string",
          description: "'name' is required and is a string",
        },
        position: {
          bsonType: "string",
          description: "'position' is required and is a string",
          minLength: 5,
        },
        level: {
          bsonType: "string",
          description:
            "'level' is required and is one of 'junior', 'mid', or 'senior'",
          enum: ["junior", "mid", "senior"],
        },
      },
    },
  };

  // Try applying the modification to the collection, if the collection doesn't exist, create it
  await db
    .command({
      collMod: "employees",
      validator: jsonSchema,
    })
    .catch(async (error: mongodb.MongoServerError) => {
      if (error.codeName === "NamespaceNotFound") {
        await db.createCollection("employees", { validator: jsonSchema });
      }
    });
}
