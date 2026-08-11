import * as assert from 'assert';
import { formatPlanForDisplay, escapeHtml, redactSensitiveInfo } from '../src/services/plan-formatter';

/**
 * The formatted plan is built from pipeline-controlled input and injected with
 * dangerouslySetInnerHTML, so two properties must hold: secrets never reach the page,
 * and plan-derived text can never become markup.
 */

/** A plan exercising every sensitivity marker shape terraform emits. */
function buildPlan(): any {
    return {
        format_version: '1.2',
        terraform_version: '1.12.1',
        timestamp: '2025-05-31T18:14:16Z',
        // Root input variables carry no sensitivity metadata of any kind.
        variables: {
            db_password: { value: 'VARIABLE_SECRET' },
            region: { value: 'westeurope' }
        },
        resource_changes: [
            {
                address: 'azurerm_linux_virtual_machine.vm',
                change: {
                    actions: ['create'],
                    before: null,
                    after: {
                        admin_username: 'adminuser',
                        admin_password: 'RESOURCE_SECRET',
                        public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQEXAMPLEEXAMPLEEXAMPLE'
                    },
                    before_sensitive: false,
                    // Object form: individual attributes are sensitive.
                    after_sensitive: { admin_password: true }
                }
            },
            {
                address: 'random_password.generated',
                change: {
                    actions: ['create'],
                    before: null,
                    after: { result: 'WHOLE_SIDE_SECRET' },
                    before_sensitive: false,
                    // Bare-boolean form: the entire side is sensitive.
                    after_sensitive: true
                }
            }
        ],
        // Output changes always use the bare-boolean form.
        output_changes: {
            connection_string: {
                actions: ['update'],
                before: 'OUTPUT_BEFORE_SECRET',
                after: 'OUTPUT_AFTER_SECRET',
                before_sensitive: true,
                after_sensitive: true
            }
        },
        // Outputs in prior_state/planned_values use { sensitive: true, value: ... }.
        prior_state: {
            values: {
                outputs: {
                    connection_string: { sensitive: true, value: 'PRIOR_STATE_SECRET', type: 'string' }
                }
            }
        },
        // Reachable by no path-based marker; only the pattern sweep can catch this.
        configuration: {
            root_module: {
                resources: [
                    { address: 'x', expressions: { legacy: { constant_value: { password: 'CONFIG_SECRET' } } } }
                ]
            }
        }
    };
}

describe('plan-formatter', () => {

    describe('redaction of sensitive values', () => {
        let html: string;

        before(() => {
            html = formatPlanForDisplay(JSON.stringify(buildPlan()));
        });

        it('redacts output values marked with after_sensitive: true', () => {
            assert.ok(!html.includes('OUTPUT_AFTER_SECRET'));
        });

        it('redacts output values marked with before_sensitive: true', () => {
            assert.ok(!html.includes('OUTPUT_BEFORE_SECRET'));
        });

        it('redacts prior_state outputs marked with { sensitive: true }', () => {
            assert.ok(!html.includes('PRIOR_STATE_SECRET'));
        });

        it('redacts a resource change whose entire side is sensitive', () => {
            assert.ok(!html.includes('WHOLE_SIDE_SECRET'));
        });

        it('redacts attributes marked via a sensitive_values object', () => {
            assert.ok(!html.includes('RESOURCE_SECRET'));
        });

        it('redacts root input variables by name, since terraform marks nothing there', () => {
            assert.ok(!html.includes('VARIABLE_SECRET'));
        });

        it('applies the pattern sweep to values no path marker covers', () => {
            assert.ok(!html.includes('CONFIG_SECRET'));
        });

        it('redacts an ssh key body that has no trailing comment', () => {
            assert.ok(!html.includes('AAAAB3NzaC1yc2EAAAADAQABAAABAQEXAMPLE'));
        });

        it('leaves non-sensitive content readable', () => {
            assert.ok(html.includes('westeurope'));
            assert.ok(html.includes('azurerm_linux_virtual_machine.vm'));
            assert.ok(html.includes('adminuser'));
        });
    });

    describe('name-based matching for blocks terraform does not mark', () => {
        let html: string;

        before(() => {
            // variables is the one block with no sensitivity metadata, so names are the
            // only available signal here.
            const plan = {
                format_version: '1.2',
                terraform_version: '1.0',
                variables: {
                    db_password: { value: 'NAMED_PASSWORD' },
                    client_secret: { value: 'NAMED_CLIENT_SECRET' },
                    api_key: { value: 'NAMED_API_KEY' },
                    primary_key: { value: 'NAMED_PRIMARY_KEY' },
                    connection_string: { value: 'NAMED_CONNECTION_STRING' },
                    public_key: { value: 'PUBLIC_KEY_MATERIAL' },
                    key_vault_id: { value: 'vault-resource-id' },
                    secret_name: { value: 'my-secret-name' },
                    admin_ssh_key: { value: 'ADMIN_SSH_KEY_BLOCK' },
                    keyboard_layout: { value: 'en-US' }
                }
            };

            html = formatPlanForDisplay(JSON.stringify(plan));
        });

        it('redacts names that denote a secret', () => {
            assert.ok(!html.includes('NAMED_PASSWORD'));
            assert.ok(!html.includes('NAMED_CLIENT_SECRET'));
            assert.ok(!html.includes('NAMED_API_KEY'));
        });

        it('redacts named key material and connection strings', () => {
            assert.ok(!html.includes('NAMED_PRIMARY_KEY'));
            assert.ok(!html.includes('NAMED_CONNECTION_STRING'));
        });

        it('leaves public key material readable', () => {
            assert.ok(html.includes('PUBLIC_KEY_MATERIAL'));
            assert.ok(html.includes('ADMIN_SSH_KEY_BLOCK'));
        });

        it('leaves references to a secret readable', () => {
            assert.ok(html.includes('vault-resource-id'));
            assert.ok(html.includes('my-secret-name'));
        });

        it('does not match unrelated names containing a fragment', () => {
            assert.ok(html.includes('en-US'));
        });
    });

    describe('redactSensitiveInfo', () => {
        it('matches quote-anchored patterns on raw JSON', () => {
            const raw = JSON.stringify({ password: 'hunter2', access_key: 'AKIA123' }, null, 2);
            const redacted = redactSensitiveInfo(raw);

            assert.ok(!redacted.includes('hunter2'));
            assert.ok(!redacted.includes('AKIA123'));
        });

        it('cannot match once the text has been HTML-escaped', () => {
            // Pins the ordering constraint renderJson() depends on.
            const escaped = escapeHtml(JSON.stringify({ password: 'hunter2' }, null, 2));

            assert.ok(redactSensitiveInfo(escaped).includes('hunter2'));
        });

        it('redacts PEM private key blocks', () => {
            const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA\n-----END RSA PRIVATE KEY-----';

            assert.ok(!redactSensitiveInfo(pem).includes('MIIEowIBAAKCAQEA'));
        });
    });

    describe('escaping of plan-derived text', () => {
        it('escapes markup in a resource address', () => {
            const plan = {
                format_version: '1.2',
                terraform_version: '1.0',
                resource_changes: [{
                    address: 'evil</pre><img src=x onerror=alert(1)>',
                    change: { actions: ['create'], before: null, after: { a: 1 } }
                }]
            };

            const html = formatPlanForDisplay(JSON.stringify(plan));

            assert.ok(!html.includes('<img src=x'));
        });

        it('escapes a plan that looks like JSON but does not parse', () => {
            const broken = '{"format_version":"1.2", <img src=x onerror=alert(1)> "password": "FALLBACK_SECRET"}';
            const html = formatPlanForDisplay(broken);

            assert.ok(!html.includes('<img src=x'));
            assert.ok(!html.includes('FALLBACK_SECRET'));
        });

        it('escapes ansi-formatted plain text output', () => {
            const html = formatPlanForDisplay('plain text <script>alert(1)</script>');

            assert.ok(!html.includes('<script>'));
        });
    });
});
