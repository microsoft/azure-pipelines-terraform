import { default as AnsiUp } from 'ansi_up';

// Patterns for sensitive data redaction. These must run against raw JSON, before HTML
// escaping turns every `"` into `&quot;` and stops the quote-anchored patterns matching.
const SENSITIVE_PATTERNS = [
    // Trailing comment is optional; the length floor avoids matching a bare "ssh-rsa".
    { pattern: /ssh-rsa\s+[A-Za-z0-9+/]{20,}={0,3}/, replacement: 'ssh-rsa ***REDACTED SSH KEY***' },
    { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/, replacement: '***REDACTED PRIVATE KEY***' },
    // Azure subscription IDs, matched only in the contexts where a GUID actually is
    // one. A bare GUID pattern also hits resource, tenant, VM and vnet IDs, which are
    // needed to review a plan.
    { pattern: /\/subscriptions\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/, replacement: '/subscriptions/***REDACTED-SUBSCRIPTION-ID***' },
    { pattern: /"(subscription_id)":\s*"[0-9a-fA-F-]{36}"/, replacement: '"$1": "***REDACTED-SUBSCRIPTION-ID***"' },
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
            // Returns finished HTML; it redacts each fragment itself before escaping.
            return formatTerraformPlan(planObj);
        }

        // Generic JSON formatting
        return `<div class="json-plan">
            <pre>${renderJson(planObj)}</pre>
        </div>`;
    } catch (e) {
        console.error('Error parsing JSON plan:', e);
        // Must still be escaped: the result goes into dangerouslySetInnerHTML.
        return `<pre>${escapeHtml(redactSensitiveInfo(plan))}</pre>`;
    }
}

/**
 * Serialize a plan fragment for display. Path-based redaction has already run; this
 * applies the pattern sweep while the JSON quotes are intact, then escapes. Redacting
 * after escaping matches nothing, so the order is load-bearing.
 */
function renderJson(value: unknown): string {
    return escapeHtml(redactSensitiveInfo(JSON.stringify(value, null, 2)));
}

/**
 * Escape a value for interpolation into HTML.
 *
 * The plan is pipeline-controlled input and the formatted result is injected with
 * dangerouslySetInnerHTML, so every plan-derived value must go through this. A
 * resource name or attribute containing `</pre><img onerror=...>` would otherwise
 * execute in the extension iframe.
 */
export function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Formats a Terraform plan with custom HTML and styling
 */
function formatTerraformPlan(plan: any): string {
    // Find all sensitive values in the plan
    const sensitiveFields = findSensitiveFields(plan);

    // Terraform emits root input variables with no sensitivity metadata at all, so
    // nothing above marks them. Name matching is the only available signal.
    if (plan.variables && typeof plan.variables === 'object') {
        findExplicitSensitiveFields(plan.variables, 'variables', sensitiveFields);
    }

    // Create a summary section
    let html = `<div class="tf-plan-summary">
        <h3>Terraform Plan</h3>
        <div class="tf-plan-info">
            <p><strong>Terraform Version:</strong> ${escapeHtml(plan.terraform_version)}</p>
            <p><strong>Format Version:</strong> ${escapeHtml(plan.format_version)}</p>
            <p><strong>Timestamp:</strong> ${escapeHtml(plan.timestamp || 'N/A')}</p>
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
                ${escapeHtml(action)}: ${count} resource${count > 1 ? 's' : ''}
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
        <pre>${renderJson(redactedPlan)}</pre>
    </details>`;
    
    // Add resource changes in formatted sections
    if (plan.resource_changes && plan.resource_changes.length > 0) {
        html += `<div class="tf-resource-changes">
            <h4>Resource Change Details:</h4>`;
        
        plan.resource_changes.forEach((change: any, index: number) => {
            if (!change.address) return;
            
            const actions = change.change?.actions || [];
            const actionClass = actions.includes('delete') ? 'delete' : 
                            actions.includes('create') ? 'create' : 
                            actions.includes('update') ? 'update' : '';
            
            // Check if this resource has sensitive values. findSensitiveFields walks
            // arrays by index and records the `change` segment, so the key must be
            // built the same way -- an address-based prefix never matches.
            const resourceKey = `resource_changes[${index}].change`;
            const hasSensitiveValues = Object.keys(sensitiveFields).some(key => key.startsWith(resourceKey));
            
            html += `<details class="tf-resource-detail tf-action-${actionClass}${hasSensitiveValues ? ' has-sensitive' : ''}">
                <summary>
                    <span class="tf-resource-address">${escapeHtml(change.address)}</span>
                    <span class="tf-resource-actions">[${escapeHtml(actions.join(', '))}]</span>
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
                
                if (hasRenderableContent(redactedBefore)) {
                    html += `<div class="tf-resource-before">
                        <h5>Before:</h5>
                        <pre>${renderJson(redactedBefore)}</pre>
                    </div>`;
                }

                if (hasRenderableContent(redactedAfter)) {
                    html += `<div class="tf-resource-after">
                        <h5>After:</h5>
                        <pre>${renderJson(redactedAfter)}</pre>
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
    
    // Terraform emits these in two shapes: an object mirroring the value structure
    // (resource changes), or a bare `true` meaning the whole side is sensitive
    // (output changes, and any wholly-sensitive value).
    if (obj.before_sensitive === true) {
        result[`${path}.before`] = true;
    } else if (obj.before_sensitive && typeof obj.before_sensitive === 'object') {
        walkSensitiveValues(obj.before_sensitive, `${path}.before`, result);
    }

    if (obj.after_sensitive === true) {
        result[`${path}.after`] = true;
    } else if (obj.after_sensitive && typeof obj.after_sensitive === 'object') {
        walkSensitiveValues(obj.after_sensitive, `${path}.after`, result);
    }

    // Outputs in planned_values and prior_state use a third marker shape.
    if (obj.sensitive === true && Object.prototype.hasOwnProperty.call(obj, 'value')) {
        result[`${path}.value`] = true;
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

// Matched as substrings. This is a fallback for blocks terraform ships without any
// sensitivity metadata; sensitive_values remains the primary signal.
const SENSITIVE_KEY_FRAGMENTS = [
    'password', 'passwd', 'passphrase', 'secret', 'credential',
    'private_key', 'access_key', 'secret_key', 'api_key', 'token',
    // Named key material. A bare 'key' fragment is deliberately absent: it hits
    // public_key, key_vault_id and admin_ssh_key, which a reviewer needs to see.
    'primary_key', 'secondary_key', 'encryption_key', 'connection_string'
];

// Names containing a fragment above that identify a secret rather than being one.
// Redacting these costs review value and protects nothing.
const READABLE_KEY_NAMES = [
    'key_vault_secret_id', 'secret_id', 'secret_name', 'token_endpoint'
];

function isSensitiveKeyName(key: string): boolean {
    const lowerKey = key.toLowerCase();

    if (READABLE_KEY_NAMES.includes(lowerKey)) {
        return false;
    }

    return SENSITIVE_KEY_FRAGMENTS.some(fragment => lowerKey.includes(fragment));
}

/**
 * Look for explicitly marked sensitive fields in values
 */
function findExplicitSensitiveFields(obj: any, path: string, result: Record<string, boolean>): void {
    if (!obj || typeof obj !== 'object') {
        return;
    }

    // For each key in the object
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newPath = path ? `${path}.${key}` : key;

        if (isSensitiveKeyName(key)) {
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
        if (key === prefix) {
            // The whole subtree is sensitive, not a field within it. The root path makes
            // redactSensitiveFields replace the entire value.
            result[''] = true;
        } else if (key.startsWith(`${prefix}.`)) {
            result[key.slice(prefix.length + 1)] = true; // +1 for the dot
        } else if (key.startsWith(`${prefix}[`)) {
            // Array indices carry no dot separator, so the bracket has to survive.
            result[key.slice(prefix.length)] = true;
        }
    });

    return result;
}

/**
 * Whether a redacted before/after side is worth rendering a block for. Redaction can
 * collapse a whole side to the scalar '***REDACTED***', so keys cannot simply be counted.
 */
function hasRenderableContent(value: any): boolean {
    if (value === null || value === undefined) {
        return false;
    }

    return typeof value !== 'object' || Object.keys(value).length > 0;
}

/**
 * Redact sensitive fields in an object
 */
function redactSensitiveFields(obj: any, sensitiveFields: Record<string, boolean>, path: string = ''): any {
    // Check the path first, for values of any type. Terraform marks numbers and
    // booleans sensitive too, and a primitive guard placed above this check would
    // return every string before it could run.
    if (sensitiveFields[path]) {
        return '***REDACTED***';
    }

    if (!obj || typeof obj !== 'object') {
        return obj;
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
