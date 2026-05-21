#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import { runSetup } from '../src/setup.js';
import { validateConnection } from '../src/validate.js';
import { buildServerBlock } from '../src/config.js';

program
  .name('splunk-mcp')
  .description('Configure Claude Code to connect to a Splunk MCP Server')
  .version('1.0.0');

program
  .command('setup')
  .description('Interactive wizard: prompt for endpoint/token and write Claude Code config')
  .action(async () => {
    await runSetup();
  });

program
  .command('validate')
  .description('Test the connection to a Splunk MCP endpoint without writing any files')
  .requiredOption('-e, --endpoint <url>', 'Splunk MCP endpoint URL')
  .requiredOption('-t, --token <token>', 'Encrypted MCP token')
  .option('--no-tls-verify', 'Skip TLS certificate verification (for self-signed certs)')
  .action(async (opts) => {
    console.log(chalk.yellow(`\nValidating connection to ${opts.endpoint} …`));
    const result = await validateConnection({
      endpoint: opts.endpoint,
      token: opts.token,
      tlsVerify: opts.tlsVerify,
    });
    if (result.ok) {
      console.log(chalk.green('✓ Connection successful!'));
    } else {
      console.log(chalk.red(`✗ ${result.error}`));
      process.exit(1);
    }
  });

program
  .command('show-config')
  .description('Print the mcp.json block without writing any files')
  .requiredOption('-e, --endpoint <url>', 'Splunk MCP endpoint URL')
  .requiredOption('-t, --token <token>', 'Encrypted MCP token')
  .option('--no-tls-verify', 'Skip TLS certificate verification (for self-signed certs)')
  .option('-n, --name <name>', 'Server name', 'splunk-mcp-server')
  .action((opts) => {
    const block = buildServerBlock({
      endpoint: opts.endpoint,
      token: opts.token,
      tlsVerify: opts.tlsVerify,
    });
    const output = {
      mcpServers: {
        [opts.name]: block,
      },
    };
    console.log(JSON.stringify(output, null, 2));
  });

program.parse();
