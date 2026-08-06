import * as assert from 'assert';
import { getLatestTerraformVersion } from '../src/terraform-installer';

describe('TerraformInstaller getLatestTerraformVersion', function () {

    it('picks the highest stable version', () => {
        assert.strictEqual(getLatestTerraformVersion(['1.9.8', '1.9.10', '1.10.0']), '1.10.0');
    });

    it('compares version segments numerically, not lexically', () => {
        assert.strictEqual(getLatestTerraformVersion(['1.2.0', '1.10.0', '1.9.0']), '1.10.0');
    });

    it('ignores pre-release versions', () => {
        assert.strictEqual(getLatestTerraformVersion(['1.9.8', '1.10.0-rc1', '1.10.0-beta1']), '1.9.8');
    });

    it('returns empty string when only pre-releases are available', () => {
        assert.strictEqual(getLatestTerraformVersion(['1.10.0-rc1', '1.10.0-alpha1']), '');
    });

    it('returns empty string for an empty list', () => {
        assert.strictEqual(getLatestTerraformVersion([]), '');
    });
});
