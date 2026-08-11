const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const logger = require("./middleware/logger");
const webController = require("./controllers/webController");

const webRoutes = require("./routes/webRoutes");
const apiRoutes = require("./routes/apiRoutes");
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(logger);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root route should show login instead of index
app.get("/", webController.login);

// Static
app.use(express.static(path.join(__dirname, "public")));


// Routes
app.use("/", webRoutes);
app.use("/api", apiRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
