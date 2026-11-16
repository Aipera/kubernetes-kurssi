## 4.1 Readiness probe

Lisäsin `reader`-konttiin readiness proben, joka kutsuu `/log`-reittiä
portissa `3000`. Reitti lukee yhteisen lokitiedoston ja hakee laskurin
Ping-pongin `/pongs`-reitiltä.

GKE-testin alussa `writer` oli valmis ja podin `READY` oli `1/2`.
Kun PostgreSQL käynnistyi ja Ping-pong alkoi vastata, Log output
vaihtui tilaan `2/2` ilman uudelleenkäynnistystä. Käyttöönoton jälkeen
Gatewayn `/log` näytti `Ping / Pongs: 15`.

[GKE-manifesti](gke/deployment.yaml)
