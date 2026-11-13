# 3.2 – Back to Ingress

Log output ja Ping-pong toimivat GKE:ssä yhden julkisen Ingressin kautta.

| Reitti | Palvelu | Vastaus |
| --- | --- | --- |
| `/pingpong` | `ping-pong` | Palauttaa `pong N` ja kasvattaa PostgreSQL-laskuria yhdellä |
| `/log` | `log-output` | Näyttää uusimman lokirivin, ConfigMapin tiedot ja laskurin nykyisen arvon |

Ingress käyttää kahta `ClusterIP`-palvelua. Molemmat sovellukset vastaavat omassa `/`-reitissään `200 OK`, jotta GKE voi tarkistaa niiden kunnon. `exercise-http`-BackendConfig tarkistaa polun `/` portissa `3000` kymmenen sekunnin välein ja odottaa vastausta enintään viisi sekuntia.

## Käyttöönotto

Ohje käyttää tehtävässä 3.1 luotua `dwk-cluster`-klusteria, `exercises`-namespacea ja Ping-pongin PostgreSQL-tietokantaa. Aja komennot Windowsin Google Cloud SDK Shellissä.

```cmd
cd /d "%USERPROFILE%\kubernetes-kurssi"
set "GKE_CTX=gke_project-e08f1dba-8ab7-491a-90a_europe-north1-b_dwk-cluster"
set "REGISTRY=europe-north1-docker.pkg.dev/project-e08f1dba-8ab7-491a-90a/kurssi"
```

Rakenna ja lähetä sovellusten `3.2`-kuvat Artifact Registryyn.

```cmd
docker build --platform linux/amd64 -t "%REGISTRY%/ping-pong:3.2" ping-pong
docker push "%REGISTRY%/ping-pong:3.2"
docker build --platform linux/amd64 -t "%REGISTRY%/log-output:3.2" log-output
docker push "%REGISTRY%/log-output:3.2"
```

Ota sovellukset ja Ingress käyttöön.

```cmd
kubectl --context="%GKE_CTX%" -n exercises apply -f ping-pong\gke\ping-pong.yaml -f log-output\gke
kubectl --context="%GKE_CTX%" -n exercises rollout status deployment/ping-pong --timeout=300s
kubectl --context="%GKE_CTX%" -n exercises rollout status deployment/log-output --timeout=300s
kubectl --context="%GKE_CTX%" -n exercises get ingress exercises-ingress
```

## Testaus

Käytä Ingressin `ADDRESS`-sarakkeessa näkyvää IP-osoitetta. Testissä osoite oli `136.81.5.12`.

```cmd
curl.exe -f http://136.81.5.12/pingpong
curl.exe -f http://136.81.5.12/pingpong
curl.exe -f http://136.81.5.12/log
```

Toisen `pong`-vastauksen luku kasvaa yhdellä. `/log` näyttää päivitetyn laskurin rivillä `Ping / Pongs`. Jos ensimmäinen vastaus on `pong 4` ja toinen `pong 5`, lokissa näkyy `Ping / Pongs: 6`.
