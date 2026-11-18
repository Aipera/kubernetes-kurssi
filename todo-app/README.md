## 4.9 Staging ja production

Projektilla on kaksi erillistä ympäristöä:

| Ympäristö | Namespace | Julkaisu | Broadcaster | Varmuuskopiointi |
|---|---|---|---|---|
| staging | staging | Main-commit | Vain lokiin | Ei |
| production | project | Tägi | Webhookiin | Kyllä |

Tuotanto käyttää nykyistä project-namespacea ja sen tietokantaa.
Stagingilla on oma tietokanta, Secret ja pysyvät levyt.

Yhteiset resurssit määritellään Kustomize-basessa. Ympäristökohtaiset
muutokset ovat overlays/staging- ja overlays/production-hakemistoissa.

GitHub Actions rakentaa konttikuvat ja tallentaa julkaisutiedot Gitiin.
Argo CD päivittää ympäristöt automaattisesti.

Tuotannon kuvat ja manifestit lukitaan tägin commitiin. Myöhemmät
main-haaran muutokset päivittyvät stagingiin.

### Testaus

- Stagingissa luotu todo ei näkynyt tuotannossa.
- Stagingin broadcaster kirjasi luomisen ja päivityksen tapahtumina
  todo_event_logged.
- Stagingissa oli vain read-wikipedia-CronJob.
- Tuotannossa oli myös todo-db-backup-CronJob.
- Main-commit vaihtoi otsikon versioon 4.9 vain stagingissa.
- Tägin julkaiseminen päivitti myös tuotannon versioon 4.9.
- Molemmat Argo CD -sovellukset saavuttivat tilat Synced ja Healthy.

### Tiedostot

- [Yhteinen base](../base/kustomization.yaml)
- [Staging](../overlays/staging/kustomization.yaml)
- [Production](../overlays/production/kustomization.yaml)
- [Argo CD -määritys](../gitops/todo-application.yaml)
- [Tuotannon julkaisutiedot](../gitops/todo-apps/production-release.json)
- [GitHub Actions](../.github/workflows/deploy-todo.yaml)
