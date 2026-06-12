const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const logger = require("./middleware/logger");

const webRoutes = require("./routes/webRoutes");
const apiRoutes = require("./routes/apiRoutes");
const cors = require('cors');


const app = express();
const PORT = 3000;

app.use(logger);
app.use(express.json());
app.use(cors());

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Static
app.use(express.static(path.join(__dirname, "public")));


// Routes
app.use("/", webRoutes);
app.use("/api", apiRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
