import inquirer from 'inquirer';
import chalk from 'chalk';
import { validateConnection } from './validate.js';
import { saveServerConfig, buildServerBlock, getConfigPath } from './config.js';

export async function runSetup({ nonInteractive } = {}) {
  console.log(chalk.bold.cyan('\n🔌 Splunk MCP Connector for Claude — Setup Wizard\n'));
  console.log('This wizard configures Claude Code to connect to your Splunk MCP Server.');
  console.log('You will need your MCP endpoint URL and an encrypted token from the Splunk MCP Server app.\n');

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'endpoint',
      message: 'Splunk MCP endpoint URL:',
      default: 'https://your-splunk-host:8089/services/mcp',
      validate: (v) => {
        try {
          new URL(v);
          return true;
        } catch {
          return 'Please enter a valid URL (e.g. https://splunk.example.com:8089/services/mcp)';
        }
      },
    },
    {
      type: 'password',
      name: 'token',
      message: 'Encrypted MCP token (from the Splunk MCP Server app):',
      mask: '*',
      validate: (v) => v.trim().length > 0 || 'Token cannot be empty',
    },
    {
      type: 'confirm',
      name: 'tlsVerify',
      message: 'Verify TLS certificate? (say No for self-signed / on-prem certs)',
      default: true,
    },
    {
      type: 'input',
      name: 'serverName',
      message: 'Name for this MCP server entry:',
      default: 'splunk-mcp-server',
      validate: (v) => /^[a-z0-9_-]+$/i.test(v) || 'Use only letters, numbers, hyphens, or underscores',
    },
    {
      type: 'list',
      name: 'scope',
      message: 'Where should the config be saved?',
      choices: [
        { name: 'Project (.claude/mcp.json in current directory)  ← recommended', value: 'project' },
        { name: 'Global  (~/.claude/mcp.json)', value: 'global' },
      ],
      default: 'project',
    },
  ]);

  const { endpoint, token, tlsVerify, serverName, scope } = answers;

  console.log(chalk.yellow('\n⏳ Validating connection…'));

  const result = await validateConnection({ endpoint, token, tlsVerify });

  if (!result.ok) {
    console.log(chalk.red(`\n✗ Connection failed: ${result.error}`));
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Save config anyway?',
        default: false,
      },
    ]);
    if (!proceed) {
      console.log(chalk.gray('\nSetup cancelled. No files were changed.'));
      process.exit(1);
    }
  } else {
    console.log(chalk.green('✓ Connection successful!'));
  }

  const configPath = saveServerConfig({ endpoint, token, tlsVerify, scope, serverName });

  console.log(chalk.green(`\n✓ Config written to: ${chalk.bold(configPath)}`));
  console.log('\nNext steps:');
  console.log('  1. Restart Claude Code (or run ' + chalk.cyan('/mcp') + ' to reload servers)');
  console.log(`  2. Your Splunk server "${serverName}" will be available with splunk_* and saia_* tools`);
  console.log(chalk.gray('\n  ⚠  Keep your token private — never commit it to git.\n'));
}
