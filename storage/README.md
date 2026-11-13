# Tehtävä 1.11 – Pysyvä laskuri

Ping-pong tallentaa pyyntömäärän tiedostoon `/persistent/count.txt`.
Log output lukee saman tiedoston ja näyttää laskurin aikaleiman ja UUID:n
yhteydessä. Molemmat Podit käyttävät samaa `ping-pong-pvc`-levyvarausta.

## Käynnistys

Aja komennot repositorion juurikansiossa, kun `kurssi-network`-klusteri on käynnissä.

```cmd
kubectl config use-context k3d-kurssi-network
docker exec k3d-kurssi-network-server-0 mkdir -p /var/lib/kurssi/ping-pong
docker build -t ping-pong:1.11 ping-pong
docker build -t log-output:1.11 log-output
k3d image import ping-pong:1.11 log-output:1.11 -c kurssi-network
kubectl apply -f storage\ping-pong-storage.yaml
kubectl apply -f ping-pong\manifests
kubectl apply -f log-output\manifests
kubectl rollout status deployment/ping-pong
kubectl rollout status deployment/log-output
kubectl get pvc ping-pong-pvc
```

PVC:n pitäisi näkyä tilassa `Bound`.

## Testaus

```cmd
curl.exe http://localhost:8081/pingpong
curl.exe http://localhost:8081/pingpong
curl.exe http://localhost:8081/log
```

Jos laskuri alkoi nollasta, `/log` näyttää nyt `Ping / Pongs: 2`.
Varmista vielä, että laskuri säilyy, kun Ping-pongin Pod vaihtuu:

```cmd
kubectl rollout restart deployment/ping-pong
kubectl rollout status deployment/ping-pong
curl.exe http://localhost:8081/log
```

`/log` näyttää saman laskurin arvon kuin ennen uudelleenkäynnistystä.
