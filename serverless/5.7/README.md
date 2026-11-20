# 5.7 Deploy to serverless

Ping-pong toimii Knative Servicenä tehtävän 5.6 paikallisessa `knative-lab`-klusterissa.
Log output ja greeter toimivat Deployment-resursseina. PostgreSQL toimii
StatefulSet-resurssina ja tallentaa laskurin pysyvälle taltiolle.

Log output hakee laskurin osoitteesta
`http://pingpong.exercises.svc.cluster.local/pongs`.
Ping-pong käyttää PostgreSQL:n täydellistä palvelunimeä
`ping-pong-postgres.exercises.svc.cluster.local`.

Ping-pong kuuntelee Knativen asettamaa `PORT`-ympäristömuuttujaa.
Sen `/`-polku kasvattaa laskuria ja `/pongs` palauttaa laskurin arvon.
`/healthz` tarkistaa HTTP-palvelimen toiminnan muuttamatta laskuria.

Log output odottaa Ping-pongin vastausta enintään 60 sekuntia, jotta
Knative ehtii käynnistää podin nollasta. Log outputin terveystarkistus
kutsuu paikallista `/`-polkua, joten se ei herätä Ping-pongia.

## Käyttöönotto

Edellytyksenä on tehtävässä 5.6 asennettu Knative Serving ja Kourier.
Konteksti on `k3d-knative-lab` ja Kourier on saatavilla portissa 8087.
Suorita komennot repositorion juuresta.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
    -File .\serverless\5.7\deploy.ps1
```

Skripti rakentaa kolme konttikuvaa ja tuo ne k3d-klusterin nodeille.
Kuvien `dev.local`-etuliite ohittaa Knativen oletusasetuksilla rekisteristä
tehtävän kuvatunnisteen selvityksen. `imagePullPolicy` on `Never`, koska
kuvat on tuotu paikallisesti nodeille.

Skripti luo tietokannan Secretin, jos sitä ei ole ennestään.
Salasanaa ei tallenneta Git-repositorioon.

## Log output

Käynnistä porttiohjaus ja pidä terminaali avoinna.

```powershell
kubectl --context=k3d-knative-lab -n exercises `
    port-forward svc/log-output-svc 8088:80
```

Avaa selaimessa <http://localhost:8088/log>.

## Ping-pongin kutsuminen

Kourier valitsee Knative Servicen HTTP-pyynnön Host-otsakkeen perusteella.

```powershell
$serviceUrl = kubectl --context=k3d-knative-lab -n exercises `
    get ksvc pingpong -o jsonpath='{.status.url}'

$serviceHost = ([uri]$serviceUrl).Host

curl.exe -fsS --max-time 90 `
    -H "Host: $serviceHost" http://localhost:8087/
```

## Skaalautumisen ja laskurin säilymisen testaus

Pidä Log outputin porttiohjaus käynnissä. Suorita toisessa terminaalissa
testiskripti. Älä päivitä Log outputin sivua testin odotuksen aikana.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass `
    -File .\serverless\5.7\test-serverless.ps1
```

Skripti kasvattaa laskuria Ping-pongin kautta ja tarkistaa sen Log outputista.
Sen jälkeen se odottaa Knativen tavoite- ja toteutuneen skaalausmäärän
putoamista nollaan sekä aktiivisten podien poistumista. Vanhat podit voivat
vielä näkyä Terminating-tilassa. Seuraava Log outputin pyyntö käynnistää
Ping-pongin uudelleen. Testi tarkistaa uuden podin UID:n ja laskurin arvon
säilymisen. Lopussa onnistunut testi tulostaa `Serverless test passed.`

PostgreSQL, greeter ja Log output jäävät käyntiin Ping-pongin skaalautuessa nollaan.

## Lähteet

- [Deploymentin muuttaminen Knative Serviceksi](https://knative.dev/docs/serving/convert-deployment-to-knative-service/)
- [Knative-kuvatunnisteiden selvityksen asetukset](https://knative.dev/docs/serving/configuration/deployment/)
