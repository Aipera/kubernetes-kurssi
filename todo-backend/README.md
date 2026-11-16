## 4.2 Health probes

Backendin liveness käyttää reittiä `GET /healthz`, joka palauttaa HTTP
`200`, kun palvelin vastaa. Readiness käyttää reittiä `GET /readyz`,
joka suorittaa kyselyn PostgreSQL:n `todos`-tauluun. Onnistunut kysely
palauttaa HTTP `200` ja tietokantavirhe HTTP `503`. GKE Gatewayn
`HealthCheckPolicy` käyttää samaa `/readyz`-reittiä.

Paikallisessa testissä simuloin tietokantakatkon. Katkon aikana
`/readyz` palautti `503` ja `/healthz` palautti `200`. Yhteyden palauduttua
`/readyz` palautti `200`. GKE:ssä varmistin tallennuksen lisäämällä uuden
tehtävän selaimessa Todo Appin palauduttua ja päivittämällä sivun.

[Backendin koodi](app.js) · [Deployment](manifests/todo-backend.yaml) · [GKE:n terveystarkistus](../gke/todo.yaml)
