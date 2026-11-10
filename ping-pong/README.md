## 2.7 – Stateful applications

Ping-pong tallentaa laskurin PostgreSQL:ään. Tietokanta toimii yhden replikan StatefulSetinä `exercises`-namespacessa ja tallentaa datan `local-path`-levylle. Ping-pong hakee tietokannan salasanan `ping-pong-postgres-auth`-Secretistä.

### Käyttöönotto

Aja komennot repositorion juurikansiossa Windowsin CMD:ssä. HTTP-testi käyttää aiemmissa tehtävissä luotua Ingressiä.

```cmd
set "PATH=%USERPROFILE%\bin;%PATH%"
kubectl config use-context k3d-kurssi-network
kubectl apply -f exercises-namespace.yaml
```

Jos tietokannan Secretiä ei vielä ole, korvaa `VAIHDA_TAHAN_SALASANA` omalla salasanallasi ja aja seuraava komento.

```cmd
kubectl -n exercises create secret generic ping-pong-postgres-auth --from-literal="password=VAIHDA_TAHAN_SALASANA"
```

```cmd
kubectl -n exercises apply -f ping-pong\manifests\postgres.yaml
kubectl -n exercises rollout status statefulset/ping-pong-postgres --timeout=180s
docker build -t ping-pong:2.7 ping-pong
k3d image import ping-pong:2.7 -c kurssi-network
kubectl -n exercises apply -f ping-pong\manifests\ping-pong.yaml
kubectl -n exercises rollout status deployment/ping-pong --timeout=120s
```

### Testaus

```cmd
curl.exe -f http://localhost:8081/pingpong
curl.exe -f http://localhost:8081/pingpong
kubectl -n exercises rollout restart deployment/ping-pong
kubectl -n exercises rollout status deployment/ping-pong --timeout=120s
curl.exe -f http://localhost:8081/pingpong
curl.exe -f http://localhost:8081/log
```

Testissä vastaukset olivat `pong 0`, `pong 1` ja uudelleenkäynnistyksen jälkeen `pong 2`. Log Output näytti `Ping / Pongs: 3`.
