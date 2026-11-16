## 4.2 Health probes

Todo Appin readiness ja liveness käyttävät reittiä `GET /healthz`.
**Break the app** -painike lähettää pyynnön `POST /break` ja näyttää
**System Failure** -sivun. Vikatilassa `/healthz` palauttaa HTTP `500`
ja etusivu HTTP `503`.

### Testaus GKE:ssä

1. Seurasin podia komennolla `kubectl -n project get pods -l app=todo-app -w`.
2. Painoin **Break the app** ja näin virhesivun. Liveness-tarkistus
   käynnisti kontin uudelleen samassa podissa. `RESTARTS` kasvoi yhdellä
   ja `READY` palasi arvoon `1/1`.
3. Palasin Todo Appiin, lisäsin tehtävän `Testi 4.2` ja päivitin sivun.
   Tehtävä näkyi edelleen listassa.

[Sovelluskoodi](app.js) · [Deployment](manifests/deployment.yaml) · [GKE-reititys](../gke/todo.yaml)
