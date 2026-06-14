export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    fixedIssues: string[];
    dataQuality: {
        completeness: number;
        consistency: number;
        accuracy: number;
    };
}
export declare class DataValidator {
    validateCampaignConsistency(data: any[]): ValidationResult;
    generateQualityReport(validation: ValidationResult): string;
}
export declare const dataValidator: DataValidator;
//# sourceMappingURL=dataValidator.d.ts.map