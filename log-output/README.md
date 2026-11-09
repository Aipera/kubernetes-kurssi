## 2.5 – Documentation and ConfigMaps

Log output käyttää `exercises`-namespacessa ConfigMapia `log-output-config`. Kubernetes liittää `information.txt`-avaimen tiedostoksi polkuun `/config/information.txt` ja asettaa `MESSAGE`-avaimen ympäristömuuttujaksi `reader`-kontille. `/log` näyttää molemmat arvot ennen aikaleimaa ja pong-laskuria.

### Käyttöönotto

Aja komennot repositorion juurikansiossa Windowsin CMD:ssä. Käynnistä ensin `kurssi-network`-klusteri ja Ping-pong tehtävän 2.3 ohjeilla.

```cmd
set "PATH=%USERPROFILE%\bin;%PATH%"
kubectl config use-context k3d-kurssi-network
docker build -t log-output:2.5 log-output
k3d image import log-output:2.5 -c kurssi-network
kubectl -n exercises apply -f log-output\manifests\configmap.yaml -f log-output\manifests\deployment.yaml
kubectl -n exercises rollout status deployment/log-output --timeout=120s
```

### Testaus

```cmd
curl.exe -i http://localhost:8081/log
```

Esimerkkivastaus, kun palvelin palauttaa `200 OK`.

```text
file content: this text is from file
env variable: MESSAGE=hello world
2026-11-09T21:46:26.317Z: 7ec0c6a7-9927-4a1e-a31a-8a4f6292698a
Ping / Pongs: 2
```

Toteutuksessa käytetty Kubernetesin ohje on [Configure a Pod to Use a ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/).
