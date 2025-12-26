import * as dotenv from "dotenv";
import { buildMongoDbUri, connectToDatabase } from "./database";
import { employeeRouter } from "./employee.routes";
import express from "express";
import cors from "cors";

dotenv.config()

const { MONGO_DB_HOST, MONGO_DB_USERNAME, MONGO_DB_PASSWORD, MONGO_DB_OPTIONS } = process.env;

if (!MONGO_DB_HOST || !MONGO_DB_USERNAME || !MONGO_DB_PASSWORD) {
    console.error("No required environments variable defined in config.env")
    process.exit(1);
}

const uri = buildMongoDbUri(MONGO_DB_HOST, MONGO_DB_USERNAME!, MONGO_DB_PASSWORD!, MONGO_DB_OPTIONS)
connectToDatabase(uri)
.then(() => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get("/", (_req, res) => {
        res.status(200).send({
            ok: true,
            routes: {
                employees: "/employees",
                employeeById: "/employees/:id",
            },
        });
    });

    app.use("/employees", employeeRouter);

    app.listen(5200, () => {
        console.log("Server running on localhost:5200")
    })
})
.catch((error) => console.error(error));