## 4.7 GitOps

Log output käyttää GitOpsia GitHub Actionsin ja Argo CD:n avulla.

Kun Log outputin koodia tai GKE-asetuksia muutetaan main-haarassa:

1. GitHub Actions rakentaa ja julkaisee uuden konttikuvan Artifact Registryyn.
2. Työnkulku tallentaa uuden kuvatunnisteen Kustomize-tiedostoon ja tekee commitin.
3. Argo CD hakee muutokset Gitistä ja päivittää sovelluksen GKE:hen automaattisesti.

Argo CD seuraa hakemistoa `log-output/gke` ja hallitsee Log outputin
Deploymentia, ConfigMapia ja Serviceä.

### Testaus

Argo CD:n tiloiksi saatiin `Synced` ja `Healthy`.

Muutin GitHubissa ConfigMapin MESSAGE-arvoksi
`hello from GitOps 4.7`. Automaattisen päivityksen jälkeen komento

```powershell
curl.exe -f --max-time 15 http://136.82.24.113/log
```

palautti:

```text
env variable: MESSAGE=hello from GitOps 4.7
```

Muutos päivittyi ilman käsin tehtävää käyttöönottoa.

### Tiedostot

- [GitHub Actions -työnkulku](../.github/workflows/log-output-gitops.yaml)
- [Argo CD Application](../gitops/log-output-application.yaml)
- [Argo CD:n asennusasetukset](../gitops/argocd-values.yaml)
- [Kustomize-määritys](gke/kustomization.yaml)
