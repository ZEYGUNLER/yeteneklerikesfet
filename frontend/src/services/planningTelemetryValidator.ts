import { PlanningTelemetry } from './planningTelemetry';

export interface TelemetryValidationResult {
  valid: boolean;
  quality: 'high' | 'medium' | 'low';
  errors: string[];
}

export const planningTelemetryValidator = {
  verifyTelemetry(telemetry: any): TelemetryValidationResult {
    const errors: string[] = [];
    if (!telemetry || typeof telemetry !== 'object') {
      return { valid: false, quality: 'low', errors: ['Telemetry data is missing or not an object.'] };
    }

    if (telemetry.version !== 1) {
      errors.push('Unsupported telemetry version.');
    }

    const requiredFields = [
      'routeEfficiency',
      'optimalPathRatio',
      'replanningQuality',
      'planningTimeMs',
      'deadEnds',
      'hints',
      'completionRate'
    ];

    let missingFields = 0;
    for (const field of requiredFields) {
      if (typeof telemetry[field] !== 'number' || isNaN(telemetry[field])) {
        errors.push(`Missing or invalid field: ${field}`);
        missingFields++;
      } else if (field !== 'planningTimeMs' && field !== 'deadEnds' && field !== 'hints' && telemetry.version === 1) {
        if (telemetry[field] < 0 || telemetry[field] > 1) {
          errors.push(`Field ${field} is out of bounds (must be 0-1).`);
          missingFields++;
        }
      }
    }

    // Determine quality based on completeness
    let quality: 'high' | 'medium' | 'low' = 'high';
    if (missingFields === 0 && errors.length === 0) {
      quality = 'high';
    } else if (missingFields <= 2 && telemetry.version === 1) {
      quality = 'medium';
    } else {
      quality = 'low';
    }

    return {
      valid: quality !== 'low',
      quality,
      errors
    };
  }
};
