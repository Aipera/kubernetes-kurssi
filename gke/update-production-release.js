const fs = require('node:fs');

if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REF_TYPE !== 'tag') {
  throw new Error('Production releases must originate from a tagged GitHub Actions run');
}
const sha = process.env.TODO_RELEASE_SHA;
if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error('Invalid release commit');
const images = [
  ['todo-app', process.env.TODO_APP_IMAGE],
  ['todo-backend', process.env.TODO_BACKEND_IMAGE],
  ['broadcaster', process.env.BROADCASTER_IMAGE]
].map(([name, image]) => {
  if (typeof image !== 'string' || !image.endsWith(`/${name}:${sha}`)) {
    throw new Error(`Invalid ${name} release image`);
  }
  return `${image.slice(0, image.lastIndexOf(':'))}=${image}`;
});
const path = 'gitops/todo-apps/production-release.json';
const release = JSON.parse(fs.readFileSync(path, 'utf8'));
release.metadata.annotations['release-tag'] = process.env.GITHUB_REF_NAME;
release.spec.source = { targetRevision: sha, path: 'overlays/production', kustomize: { images } };
fs.writeFileSync(path, `${JSON.stringify(release, null, 2)}\n`);
