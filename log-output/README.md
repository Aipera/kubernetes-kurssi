## 2.3 – Keep them separated

Log output ja Ping-pong toimivat `exercises`-namespacessa. Log output hakee laskurin arvon Ping-pongin Serviceltä HTTP-pyynnöllä osoitteesta `http://ping-pong/pongs`.

### Käynnistä sovellukset

Aja komennot repositorion juurikansiossa Windowsin CMD:ssä, kun `kurssi-network`-klusteri on käynnissä.

```cmd
docker build -t log-output:2.1 log-output
docker build -t ping-pong:2.1 ping-pong
k3d image import log-output:2.1 ping-pong:2.1 -c kurssi-network

kubectl config use-context k3d-kurssi-network
kubectl apply -f exercises-namespace.yaml
kubectl -n exercises apply -f log-output\manifests -f ping-pong\manifests
kubectl -n exercises rollout status deployment/ping-pong
kubectl -n exercises rollout status deployment/log-output
```

### Testaa yhteys

```cmd
curl.exe http://localhost:8081/pingpong
curl.exe http://localhost:8081/log
```

`/pingpong` palauttaa `pong`-vastauksen ja kasvattaa laskuria. `/log` näyttää aikaleiman, tunnisteen ja laskurin arvon rivillä `Ping / Pongs`.
