#!/usr/bin/env node
// Posts a release notification to Discord after a Production Tag Deployment.
// Triggered by .github/workflows/release.yml. No-ops if DISCORD_WEBHOOK_URL is unset.

const webhook = process.env.DISCORD_WEBHOOK_URL;
if (!webhook) {
  console.log('DISCORD_WEBHOOK_URL not set; skipping Discord notification.');
  process.exit(0);
}

const tag = process.env.TAG_NAME ?? 'unknown';
const sha = process.env.COMMIT_SHA ?? '';
const repo = process.env.REPO ?? '';
const failed = process.env.DEPLOY_STATUS === 'failure';

const shortSha = sha.slice(0, 7);
const commitUrl = repo && sha ? `https://github.com/${repo}/commit/${sha}` : null;

const embed = {
  title: failed
    ? `❌ Seen — TestFlight build failed (${tag})`
    : `✅ Seen — build submitted to TestFlight (${tag})`,
  color: failed ? 0xed4245 : 0x208aef,
  fields: [
    { name: 'Tag', value: tag, inline: true },
    { name: 'Commit', value: commitUrl ? `[${shortSha}](${commitUrl})` : shortSha, inline: true },
  ],
};

const res = await fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ embeds: [embed] }),
});

if (!res.ok) {
  console.error(`Discord webhook failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log('Discord notification sent.');
