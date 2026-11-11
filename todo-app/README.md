## 3.7 – Branch environments

Todo-projektin GitHub Actions -työnkulku julkaisee jokaisen haaran omaan ympäristöönsä Google Kubernetes Enginessä. Ajo käynnistyy, kun haaraan pushataan muutos. Se rakentaa Todo Appin ja Todo Backendin konttikuvat, julkaisee ne Artifact Registryyn ja ottaa ne käyttöön Kustomizella.

| Haara | Kubernetes-namespace | Osoite |
| --- | --- | --- |
| `main` | `project` | [Todo App](http://136.82.24.113/) |
| `testi-37` | `preview-testi-37` | [Todo Appin esikatselu](http://preview-testi-37.gke.136.82.24.113.sslip.io/) |

Esikatseluympäristöllä on omat Todo-sovelluksensa, PostgreSQL-tietokantansa ja pysyvät levynsä. Ympäristöt käyttävät yhteistä Gatewayta. Esikatselun `HTTPRoute` ohjaa pyynnöt oman namespacensa palveluihin osoitteen isäntänimen perusteella. Osoitteen `.gke.` erottaa haaran nimen IP-osoitteesta, jotta esimerkiksi `testi-37`-haaran numero ei sekoitu osoitteeseen DNS-haussa.

### Testaus

1. Luo `main`-haarasta `testi-37` ja pushaa siihen pieni README-muutos.
2. Avaa GitHub Actionsissa `testi-37`-haaran onnistunut ajo. Avaa **deploy → Deploy with Kustomize** ja kopioi lokista **Preview URL**.
3. Avaa esikatselu, lisää tehtävä `Testi 3.7` ja päivitä sivu. Tarkista, että tehtävä näkyy yhä listassa.
4. Avaa taulukosta `main`-haaran Todo App ja varmista, että testitehtävä näkyy vain esikatselussa.
