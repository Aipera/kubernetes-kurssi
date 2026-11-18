## 4.8 Todo-projektin GitOps

Todo-projekti julkaistaan main-haarasta GitHub Actionsin ja Argo CD:n avulla.

Kun projektin koodia tai manifesteja muutetaan:

1. GitHub Actions rakentaa Todo Appin, Backendin ja broadcasterin konttikuvat.
2. Kuvat julkaistaan Artifact Registryyn commitin SHA-tunnisteella.
3. Työnkulku tallentaa kuvatunnisteet kustomization.yaml-tiedostoon ja tekee commitin.
4. Argo CD hakee muutokset Gitistä ja päivittää projektin GKE:hen.

Argo CD Application `todo-project` seuraa repositorion juuren
Kustomize-määritystä. Resurssit julkaistaan `project`-namespaceen.
Mukana ovat sovellukset, PostgreSQL, Wikipedia-CronJob ja
tietokannan varmuuskopiointi.

### Testaus

Argo CD saavutti tilat `Synced` ja `Healthy`.

Muutin käyttöliittymän otsikoksi `Todo App - GitOps 4.8` ja tein
commitin main-haaraan. Uusi otsikko ilmestyi sovellukseen automaattisesti.

Todon lisääminen ja tehdyksi merkitseminen toimivat.
Wikipedia-työn testiajo valmistui onnistuneesti kuudessa sekunnissa
ja loi uuden todon.

### Tiedostot

- [GitHub Actions -työnkulku](../.github/workflows/deploy-todo.yaml)
- [Argo CD Application](../gitops/todo-application.yaml)
- [Kustomize-määritys](../kustomization.yaml)
- [Kuvatunnisteiden julkaisuskripti](../gke/release-todo-images.sh)
