## 4.10 Erilliset repositoriot

Todo-projektin sovelluskoodi ja Kubernetes-määritykset ovat eri repositorioissa:

- [kubernetes-kurssi](https://github.com/Aipera/kubernetes-kurssi): sovelluskoodi, Dockerfilet ja GitHub Actions -työnkulut.
- [kubernetes-kurssi-config](https://github.com/Aipera/kubernetes-kurssi-config): Kubernetes-manifestit, Kustomize-ympäristöt ja Argo CD Applicationit.

GitHub Actions rakentaa ja julkaisee konttikuvat Artifact Registryyn. Kuvien tunnisteena käytetään koodirepon commitin SHA:ta. Sen jälkeen työnkulku päivittää kuvaversiot konfiguraatiorepoon CONFIG_REPO_TOKEN-salaisuuden avulla.

Argo CD seuraa konfiguraatiorepoa ja ottaa muutokset käyttöön klusterissa.

### Ympäristöt

| Ympäristö | Namespace | Julkaisun käynnistäjä | Broadcaster | Tietokannan varmuuskopiointi |
|---|---|---|---|---|
| Staging | staging | Commit koodirepon main-haaraan | Kirjoittaa lokiin | Ei |
| Production | project | Koodirepon tagi | Lähettää webhookiin | Kyllä |

Tuotannon määritykset sidotaan konfiguraatiorepon tiettyyn committiin. Konttikuvat sidotaan julkaistun koodicommitin SHA:han.

Secretit hallitaan klusterissa Argo CD:n ulkopuolella.

### Testaus

Main-haaran päivitys julkaisi stagingin kuvaversiot konfiguraatiorepoon muuttamatta tuotannon julkaisua.

Tagilla `4.10-test-20261120-155256` käynnistetty ajo julkaisi tuotannon päivityksen konfiguraatiorepoon.

Lopputarkistuksessa kaikki Applicationit olivat Synced ja Healthy:

- todo-environments
- todo-staging
- todo-project

Molempien ympäristöjen käyttöliittymät ja Todo API vastasivat HTTP 200.
