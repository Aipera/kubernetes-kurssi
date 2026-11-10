# 3.3 – Gateway API

Gateway API korvaa tehtävän 3.2 Ingressin. `exercises-gateway` kuuntelee HTTP-liikennettä portissa 80, ja `exercises-route` ohjaa pyynnöt oikeille palveluille.

| Reitti | Service | Toiminta |
| --- | --- | --- |
| `/pingpong` | `ping-pong-gateway` | Palauttaa `pong N` ja kasvattaa PostgreSQL-laskuria |
| `/log` | `log-output-gateway` | Näyttää uusimman lokirivin ja laskurin nykyisen arvon |

Log output lukee laskurin klusterin sisällä osoitteesta `http://ping-pong/pongs`. Sovellukset käyttävät tehtävän 3.2 konttikuvia.

## Käyttöönotto

Ohje olettaa, että Log output, Ping-pong ja PostgreSQL ovat käynnissä GKE-klusterin `exercises`-namespacessa. Aja komennot Windowsin Google Cloud SDK Shellissä.

```cmd
cd /d "%USERPROFILE%\kubernetes-kurssi"
set "GKE_CTX=gke_project-e08f1dba-8ab7-491a-90a_europe-north1-b_dwk-cluster"
```

Ota Gateway API käyttöön, jos sitä ei ole vielä otettu käyttöön tässä klusterissa.

```cmd
gcloud container clusters update dwk-cluster --location=europe-north1-b --project=project-e08f1dba-8ab7-491a-90a --gateway-api=standard
kubectl --context="%GKE_CTX%" get gatewayclass
```

Kun `gke-l7-global-external-managed` on hyväksytty, ota Gateway ja reitit käyttöön.

```cmd
kubectl --context="%GKE_CTX%" -n exercises apply -f log-output\gke\routing.yaml
kubectl --context="%GKE_CTX%" -n exercises wait --for=condition=Programmed gateway/exercises-gateway --timeout=900s
kubectl --context="%GKE_CTX%" -n exercises get gateway,httproute
```

## Testaus

Käytä Gatewayn `ADDRESS`-sarakkeessa näkyvää IP-osoitetta. Tässä testissä osoite oli `136.82.24.113`.

```cmd
curl.exe -f http://136.82.24.113/pingpong
curl.exe -f http://136.82.24.113/log
```

Lopputestissä `/pingpong` palautti `pong 10`, ja `/log` näytti päivitetyn arvon `Ping / Pongs: 11`.

## Vanhan Ingressin poistaminen

Jos klusterissa on vielä tehtävän 3.2 Ingress, poista se, kun molemmat reitit toimivat Gatewayn kautta. Ota sitten käyttöön päivitetty sisäinen `ping-pong`-Service ja poista vanhat Ingressin resurssit.

```cmd
kubectl --context="%GKE_CTX%" -n exercises delete ingress exercises-ingress --ignore-not-found
kubectl --context="%GKE_CTX%" -n exercises apply -f ping-pong\gke\ping-pong.yaml
kubectl --context="%GKE_CTX%" -n exercises delete service/log-output backendconfig/exercise-http --ignore-not-found
kubectl --context="%GKE_CTX%" -n exercises get gateway,httproute,ingress
```
