import { default as AnsiUp } from 'ansi_up';

// Patterns for sensitive data redaction
const SENSITIVE_PATTERNS = [
    // SSH keys
    { pattern: /(ssh-rsa\s+[A-Za-z0-9+/]+[=]{0,3}\s+[^\n]+?)/, replacement: 'ssh-rsa ***REDACTED SSH KEY***' },
    // Subscription IDs
    { pattern: /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/, replacement: '***REDACTED-SUBSCRIPTION-ID***' },
    // IP addresses
    { pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/, replacement: '***REDACTED-IP***' },
    // Passwords in clear text
    { pattern: /"password":\s*"([^"]+)"/, replacement: '"password": "***REDACTED***"' },
    // Admin passwords
    { pattern: /"admin_password":\s*"([^"]+)"/, replacement: '"admin_password": "***REDACTED***"' },
    // Access keys and tokens
    { pattern: /"(access_key|secret_key|token|api_key)":\s*"([^"]+)"/, replacement: '"$1": "***REDACTED***"' },
    // Client secrets
    { pattern: /"(client_secret)":\s*"([^"]+)"/, replacement: '"$1": "***REDACTED***"' },
];

/**
 * Redacts sensitive information from text
 */
export function redactSensitiveInfo(text: string): string {
    let redactedText = text;
    
    // Apply all patterns for redaction
    SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
        redactedText = redactedText.replace(new RegExp(pattern, 'g'), replacement);
    });
    
    return redactedText;
}

/**
 * Determines if the plan is in JSON format
 */
export function isJsonPlan(plan: string): boolean {
    try {
        const trimmed = plan.trim();
        return trimmed.startsWith('{') && trimmed.endsWith('}');
    } catch {
        return false;
    }
}

/**
 * Formats a plan as pretty-printed JSON with syntax highlighting
 */
export function formatJsonPlan(plan: string): string {
    try {
        const planObj = JSON.parse(plan);
        
        // Check if this is a terraform plan
        if (planObj.format_version && planObj.terraform_version) {
            return redactSensitiveInfo(formatTerraformPlan(planObj));
        }
        
        // Generic JSON formatting
        return `<div class="json-plan">
            <pre>${redactSensitiveInfo(JSON.stringify(planObj, null, 2))}</pre>
        </div>`;
    } catch (e) {
        console.error('Error parsing JSON plan:', e);
        // If we can't parse as JSON, return the original text
        return plan;
    }
}

/**
 * Formats a Terraform plan with custom HTML and styling
 */
function formatTerraformPlan(plan: any): string {
    // Find all sensitive values in the plan
    const sensitiveFields = findSensitiveFields(plan);
    
    // Create a summary section
    let html = `<div class="tf-plan-summary">
        <h3>Terraform Plan</h3>
        <div class="tf-plan-info">
            <p><strong>Terraform Version:</strong> ${plan.terraform_version}</p>
            <p><strong>Format Version:</strong> ${plan.format_version}</p>
            <p><strong>Timestamp:</strong> ${plan.timestamp || 'N/A'}</p>
        </div>
    `;
    
    // Add resource changes summary if available
    if (plan.resource_changes && plan.resource_changes.length > 0) {
        // Count resources by action
        const actionCounts: Record<string, number> = {};
        plan.resource_changes.forEach((change: any) => {
            if (change.change && change.change.actions) {
                const actions = change.change.actions.join(',');
                actionCounts[actions] = (actionCounts[actions] || 0) + 1;
            }
        });
        
        // Count sensitive values
        const sensitiveCount = Object.keys(sensitiveFields).length;
        
        // Create summary of actions
        html += `<div class="tf-plan-actions">
            <h4>Resource Changes:</h4>
            <ul>`;
        
        for (const [action, count] of Object.entries(actionCounts)) {
            const actionClass = action.includes('delete') ? 'delete' : 
                              action.includes('create') ? 'create' : 
                              action.includes('update') ? 'update' : '';
            
            html += `<li class="tf-action-${actionClass}">
                ${action}: ${count} resource${count > 1 ? 's' : ''}
            </li>`;
        }
        
        if (sensitiveCount > 0) {
            html += `<li class="tf-sensitive-info">
                <strong>Contains ${sensitiveCount} sensitive value${sensitiveCount !== 1 ? 's' : ''}</strong>
            </li>`;
        }
        
        html += `</ul>
        </div>`;
    }
    
    // Close the summary section
    html += `</div>`;
    
    // Add the raw plan data in a collapsible section with sensitive values redacted
    const redactedPlan = redactSensitiveFields(JSON.parse(JSON.stringify(plan)), sensitiveFields);
    
    html += `<details class="tf-plan-details">
        <summary>View Complete Plan</summary>
        <pre>${JSON.stringify(redactedPlan, null, 2)}</pre>
    </details>`;
    
    // Add resource changes in formatted sections
    if (plan.resource_changes && plan.resource_changes.length > 0) {
        html += `<div class="tf-resource-changes">
            <h4>Resource Change Details:</h4>`;
        
        plan.resource_changes.forEach((change: any) => {
            if (!change.address) return;
            
            const actions = change.change?.actions || [];
            const actionClass = actions.includes('delete') ? 'delete' : 
                            actions.includes('create') ? 'create' : 
                            actions.includes('update') ? 'update' : '';
            
            // Check if this resource has sensitive values
            const resourceKey = `resource_changes.${change.address}`;
            const hasSensitiveValues = Object.keys(sensitiveFields).some(key => key.startsWith(resourceKey));
            
            html += `<details class="tf-resource-detail tf-action-${actionClass}${hasSensitiveValues ? ' has-sensitive' : ''}">
                <summary>
                    <span class="tf-resource-address">${change.address}</span>
                    <span class="tf-resource-actions">[${actions.join(', ')}]</span>
                    ${hasSensitiveValues ? '<span class="tf-sensitive-badge">Contains sensitive data</span>' : ''}
                </summary>
                <div class="tf-resource-content">`;
            
            // Show before/after for resource with sensitive values redacted
            if (change.change) {
                // Create redacted copies
                const redactedBefore = change.change.before ? 
                    redactSensitiveFields(JSON.parse(JSON.stringify(change.change.before)), 
                        filterSensitiveFieldsByPrefix(sensitiveFields, `${resourceKey}.before`)) : null;
                
                const redactedAfter = change.change.after ? 
                    redactSensitiveFields(JSON.parse(JSON.stringify(change.change.after)), 
                        filterSensitiveFieldsByPrefix(sensitiveFields, `${resourceKey}.after`)) : null;
                
                if (redactedBefore && Object.keys(redactedBefore).length > 0) {
                    html += `<div class="tf-resource-before">
                        <h5>Before:</h5>
                        <pre>${JSON.stringify(redactedBefore, null, 2)}</pre>
                    </div>`;
                }
                
                if (redactedAfter && Object.keys(redactedAfter).length > 0) {
                    html += `<div class="tf-resource-after">
                        <h5>After:</h5>
                        <pre>${JSON.stringify(redactedAfter, null, 2)}</pre>
                    </div>`;
                }
            }
            
            html += `</div>
            </details>`;
        });
        
        html += `</div>`;
    }
    
    return html;
}

/**
 * Find all sensitive fields in the plan
 * Returns a map of paths to true
 */
function findSensitiveFields(obj: any, path: string = '', result: Record<string, boolean> = {}): Record<string, boolean> {
    if (!obj || typeof obj !== 'object') {
        return result;
    }
    
    // Check if this object has sensitive_values
    if (obj.sensitive_values && typeof obj.sensitive_values === 'object') {
        walkSensitiveValues(obj.sensitive_values, path, result);
    }
    
    // Check if this object has before_sensitive or after_sensitive
    if (obj.before_sensitive && typeof obj.before_sensitive === 'object') {
        walkSensitiveValues(obj.before_sensitive, `${path}.before`, result);
    }
    
    if (obj.after_sensitive && typeof obj.after_sensitive === 'object') {
        walkSensitiveValues(obj.after_sensitive, `${path}.after`, result);
    }
    
    // Also check explicitly marked sensitive fields in the values
    if (obj.before && typeof obj.before === 'object') {
        findExplicitSensitiveFields(obj.before, `${path}.before`, result);
    }
    
    if (obj.after && typeof obj.after === 'object') {
        findExplicitSensitiveFields(obj.after, `${path}.after`, result);
    }
    
    // Recursively check all arrays and objects
    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            if (item && typeof item === 'object') {
                findSensitiveFields(item, `${path}[${index}]`, result);
            }
        });
    } else if (typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value && typeof value === 'object') {
                const newPath = path ? `${path}.${key}` : key;
                findSensitiveFields(value, newPath, result);
            }
        });
    }
    
    return result;
}

/**
 * Walk the sensitive_values object and mark all true values as sensitive
 */
function walkSensitiveValues(obj: any, path: string, result: Record<string, boolean>): void {
    if (!obj || typeof obj !== 'object') {
        return;
    }
    
    // For each key in the sensitive values object
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;
        
        if (typeof value === 'boolean' && value === true) {
            // This is a sensitive value
            result[newPath] = true;
        } else if (Array.isArray(value)) {
            // Process arrays
            value.forEach((item, index) => {
                if (typeof item === 'boolean' && item === true) {
                    result[`${newPath}[${index}]`] = true;
                } else if (typeof item === 'object' && item !== null) {
                    walkSensitiveValues(item, `${newPath}[${index}]`, result);
                }
            });
        } else if (typeof value === 'object' && value !== null) {
            // Recursively process objects
            walkSensitiveValues(value, newPath, result);
        }
    });
}

/**
 * Look for explicitly marked sensitive fields in values
 */
function findExplicitSensitiveFields(obj: any, path: string, result: Record<string, boolean>): void {
    // Common sensitive field names
    const sensitiveKeys = [
        'password', 'secret', 'token', 'key', 'private_key', 'ssh_key', 'cert', 'certificate'
    ];
    
    if (!obj || typeof obj !== 'object') {
        return;
    }
    
    // For each key in the object
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;
        
        // Check if this key is typically sensitive
        if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
            result[newPath] = true;
        }
        
        // Recursively process objects and arrays
        if (typeof value === 'object' && value !== null) {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        findExplicitSensitiveFields(item, `${newPath}[${index}]`, result);
                    }
                });
            } else {
                findExplicitSensitiveFields(value, newPath, result);
            }
        }
    });
}

/**
 * Filter sensitive fields by a prefix
 */
function filterSensitiveFieldsByPrefix(sensitiveFields: Record<string, boolean>, prefix: string): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    
    Object.keys(sensitiveFields).forEach(key => {
        if (key.startsWith(prefix)) {
            const newKey = key.slice(prefix.length + 1); // +1 for the dot
            if (newKey) {
                result[newKey] = true;
            }
        }
    });
    
    return result;
}

/**
 * Redact sensitive fields in an object
 */
function redactSensitiveFields(obj: any, sensitiveFields: Record<string, boolean>, path: string = ''): any {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    
    // If this is a string and the path is in sensitiveFields, redact it
    if (typeof obj === 'string' && sensitiveFields[path]) {
        return '***REDACTED***';
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map((item, index) => {
            const newPath = `${path}[${index}]`;
            return redactSensitiveFields(item, sensitiveFields, newPath);
        });
    }
    
    // Handle objects
    const result: any = {};
    Object.keys(obj).forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        result[key] = redactSensitiveFields(obj[key], sensitiveFields, newPath);
    });
    
    return result;
}

/**
 * Formats a plan for display
 * Detects JSON vs text format and applies appropriate formatting
 */
export function formatPlanForDisplay(planText: string): string {
    // Try to detect if this is JSON
    if (isJsonPlan(planText)) {
        return formatJsonPlan(planText);
    }
    
    // For non-JSON format, use AnsiUp for terminal color codes
    const ansi_up = new AnsiUp();
    return `<pre>${ansi_up.ansi_to_html(redactSensitiveInfo(planText))}</pre>`;
}
