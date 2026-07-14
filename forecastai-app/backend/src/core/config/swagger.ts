import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import logger from '../logging/logger';

const options: swaggerJsdoc.Options = {
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
  apis: [
    './src/features/*/controllers/*.ts',
    './src/routes/*.ts',
  ],
};

export function setupSwagger(app: Express) {
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
  logger.info('Swagger docs available at /api-docs');
}
