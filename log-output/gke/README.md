# 3.4 – Route rewriting

Gateway API muuntaa julkisen `/pingpong`-pyynnön poluksi `/` ennen sen välittämistä Ping-pongille. `HTTPRoute` käyttää tähän `URLRewrite`-suodatinta ja `ReplacePrefixMatch`-asetusta.

Ping-pong kasvattaa PostgreSQL-laskuria reitillä `GET /`. Klusterin sisäinen `/pongs` lukee laskurin arvon, ja sitä käyttävät sekä Log output että Gatewayn terveystarkistus. Julkinen `/log` näyttää laskurin nykyisen arvon.

## Käyttöönotto

Ohje käyttää tehtävässä 3.3 luotua GKE Gatewayta. Aja komennot Windowsin Google Cloud SDK Shellissä repositorion juuresta.

```cmd
cd /d "%USERPROFILE%\kubernetes-kurssi"
set "GKE_CTX=gke_project-e08f1dba-8ab7-491a-90a_europe-north1-b_dwk-cluster"
set "REGISTRY=europe-north1-docker.pkg.dev/project-e08f1dba-8ab7-491a-90a/kurssi"
```

Ota terveystarkistus käyttöön ensin. Jatka, kun `ping-pong-gateway`-rivi näyttää portin `3000` ja polun `/pongs`.

```cmd
kubectl --context="%GKE_CTX%" -n exercises apply -f log-output\gke\ping-pong-health.yaml
gcloud compute health-checks list --global --project=project-e08f1dba-8ab7-491a-90a --format="table(name,httpHealthCheck.port,httpHealthCheck.requestPath)"
```

Rakenna ja julkaise uusi Ping-pong-kuva. Ota sitten Deployment ja reitityssääntö käyttöön.

```cmd
docker build --platform linux/amd64 -t "%REGISTRY%/ping-pong:3.4" ping-pong
docker push "%REGISTRY%/ping-pong:3.4"
kubectl --context="%GKE_CTX%" -n exercises apply -f ping-pong\gke\ping-pong.yaml -f log-output\gke\routing.yaml
kubectl --context="%GKE_CTX%" -n exercises rollout status deployment/ping-pong --timeout=300s
kubectl --context="%GKE_CTX%" -n exercises get gateway exercises-gateway
```

## Testaus

Käytä Gatewayn `ADDRESS`-sarakkeessa näkyvää osoitetta. Testissä osoite oli `136.82.24.113`.

```cmd
curl.exe -f http://136.82.24.113/pingpong
curl.exe -f http://136.82.24.113/pingpong
curl.exe -f http://136.82.24.113/pingpong
curl.exe -f http://136.82.24.113/log
```

Testissä kolme `/pingpong`-pyyntöä palauttivat `pong 11`, `pong 12` ja `pong 13`. `/log` näytti sen jälkeen `Ping / Pongs: 14`.
