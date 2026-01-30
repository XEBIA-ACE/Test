import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IntegrationService } from '../../application/services/IntegrationService';
import { Logger } from '../../utils/logger';
import { ValidationError } from '../../utils/errors';

/**
 * Integration Controller
 * Handles HTTP requests for integration endpoints
 */
export class IntegrationController {
  private readonly logger: Logger;

  constructor(private readonly integrationService: IntegrationService) {
    this.logger = new Logger({ controller: 'IntegrationController' });
  }

  /**
   * Creates a new integration request
   * POST /api/v1/integrations
   */
  createIntegration = async (req: Request, res: Response): Promise<void> => {
    const { sourceSystem, targetSystem, operation, payload, metadata } = req.body;

    this.logger.info('Creating integration', { sourceSystem, targetSystem, operation });

    const integration = await this.integrationService.createIntegration({
      sourceSystem,
      targetSystem,
      operation,
      payload,
      metadata,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: integration,
      message: 'Integration created successfully',
    });
  };

  /**
   * Gets integration by ID
   * GET /api/v1/integrations/:id
   */
  getIntegration = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    this.logger.info('Getting integration', { id });

    const integration = await this.integrationService.getIntegration(id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: integration,
    });
  };

  /**
   * Lists all integrations with optional filtering
   * GET /api/v1/integrations
   */
  listIntegrations = async (req: Request, res: Response): Promise<void> => {
    const { sourceSystem, targetSystem, status, startDate, endDate, limit, offset } = req.query;

    this.logger.info('Listing integrations', { filters: req.query });

    const filters = {
      sourceSystem: sourceSystem as string,
      targetSystem: targetSystem as string,
      status: status as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    };

    const integrations = await this.integrationService.listIntegrations(filters);

    res.status(StatusCodes.OK).json({
      success: true,
      data: integrations,
      count: integrations.length,
    });
  };

  /**
   * Processes an integration request
   * POST /api/v1/integrations/:id/process
   */
  processIntegration = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    this.logger.info('Processing integration', { id });

    const result = await this.integrationService.processIntegration(id);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
      message: 'Integration processed successfully',
    });
  };
}
