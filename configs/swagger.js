const { swaggerTheme } = require("./swaggerTheme");
const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");

const swaggerDefinition = {
  openapi: "3.0.1",
  info: {
    title: "Me va Be", // Title of the documentation
    version: "1.0.0", // Version of the app
    description: "Document RestAPI", // short description of the app
    termsOfService: "http://swagger.io/terms",
    contact: {
      email: "apiteam@swagger.io",
    },
  },
  servers: [
    {
      url: `http://localhost:5000/api`,
      description: "Local (Development) Server",
    },
    {
      url: `https://datn-me-va-be-server-prod.herokuapp.com/api`,
      description: "Development Server",
    },
  ],
};

const options = {
  // import swaggerDefinitions
  swaggerDefinition,
  // path to the API docs
  apis: [path.join(__dirname, "/../docs/**/*.yaml")],
};

const swaggerSpec = swaggerJSDoc(options);

exports.swaggerSpec = swaggerSpec;
exports.swaggerTheme = swaggerTheme;
