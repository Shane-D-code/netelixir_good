"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ForecastAI API',
            version: '1.0.0',
            description: 'Enterprise-grade e-commerce revenue forecasting API with ensemble ML, budget optimization, and causal inference.',
            contact: { name: 'ForecastAI Support', email: 'support@forecastai.com' },
        },
        servers: [
            { url: 'http://localhost:3001/api', description: 'Development server' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            },
        },
        tags: [
            { name: 'Forecast', description: 'Forecast generation and export' },
            { name: 'Budget', description: 'Budget simulation and optimization' },
            { name: 'Analytics', description: 'Metrics, anomalies, causal analysis' },
            { name: 'Upload', description: 'CSV file upload' },
            { name: 'Health', description: 'Health check endpoints' },
        ],
    },
    apis: ['./src/controllers/*.ts'],
};
function setupSwagger(app) {
    const specs = (0, swagger_jsdoc_1.default)(options);
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs, { explorer: true }));
    console.log('Swagger docs available at /api-docs');
}
//# sourceMappingURL=swagger.js.map