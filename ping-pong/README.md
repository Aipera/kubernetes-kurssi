## 4.1 Readiness probe

Ping-pong käynnistää HTTP-palvelimen heti. Readiness probe kutsuu
`/pongs`-reittiä, joka lukee laskurin PostgreSQL:stä. Reitti palauttaa
HTTP `503`, kun tietokanta ei ole käytettävissä, ja HTTP `200`, kun
laskurin luku onnistuu. Jos laskurin alustus epäonnistuu, seuraava
pyyntö yrittää sitä uudelleen.

GKE-testissä pod oli `Running` ja `READY` oli `0/1` ennen tietokannan
käynnistämistä. Kun PostgreSQL tuli valmiiksi, sama pod vaihtui tilaan
`1/1` ilman uudelleenkäynnistystä. Käyttöönoton jälkeen Gatewayn
`/pingpong` palautti `pong 14`.

[Sovelluskoodi](app.js) · [GKE-manifesti](gke/ping-pong.yaml)
