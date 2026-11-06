# Log output – tehtävä 2.1

`GET /log` näyttää uusimman aikaleiman, UUID:n ja Ping-pongin laskurin.
Log output hakee laskurin klusterin sisällä osoitteesta `http://ping-pong/pongs`.
Log outputin kaksi konttia jakavat oman lokitiedostonsa `emptyDir`-volyymilla.

## Käynnistys

Aja komennot repositorion juurikansiossa, kun `kurssi-network`-klusteri on käynnissä.

```cmd
kubectl config use-context k3d-kurssi-network
docker build -t ping-pong:2.1 ping-pong
docker build -t log-output:2.1 log-output
k3d image import ping-pong:2.1 log-output:2.1 -c kurssi-network
kubectl apply -f ping-pong\manifests
kubectl apply -f log-output\manifests
kubectl rollout status deployment/ping-pong
kubectl rollout status deployment/log-output
```

## Testaus

```cmd
curl.exe http://localhost:8081/pingpong
curl.exe http://localhost:8081/log
curl.exe http://localhost:8081/log
```

`/pingpong` kasvattaa laskuria yhdellä. Molemmat `/log`-pyynnöt
näyttävät saman arvon rivillä `Ping / Pongs: N`.
